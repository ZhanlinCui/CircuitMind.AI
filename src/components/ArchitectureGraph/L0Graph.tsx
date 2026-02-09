import React, { useEffect } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

import { GraphDTO } from '../../domain/project';

interface L0GraphProps {
  data: GraphDTO;
  className?: string;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 120 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const SystemNode: React.FC<{
  data: { label: string; summary?: string; category?: string };
}> = ({ data }) => {
  return (
    <div className='px-4 py-3 rounded-lg border-2 border-blue-500 bg-white shadow-md min-w-[180px]'>
      <div className='font-semibold text-sm text-gray-900'>{data.label}</div>
      {data.summary && (
        <div className='text-xs text-gray-600 mt-1 line-clamp-2'>
          {data.summary}
        </div>
      )}
      {data.category && (
        <div className='text-xs text-blue-600 mt-1'>{data.category}</div>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  system: SystemNode,
};

const L0Graph: React.FC<L0GraphProps> = ({
  data,
  className,
  onNodeClick,
  onEdgeClick,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const initialNodes: Node[] = data.nodes.map((node) => ({
      id: node.id,
      type: 'system',
      data: {
        label: node.label,
        summary: node.summary,
        category: node.category,
      },
      position: { x: 0, y: 0 },
    }));

    const initialEdges: Edge[] = data.edges.map((edge) => {
      const style: React.CSSProperties = { strokeWidth: 2 };
      let animated = false;
      let markerColor = '#64748b';
      const label = edge.protocolOrSignal;

      switch (edge.type) {
      case 'power':
        style.stroke = '#ef4444';
        style.strokeWidth = 3;
        markerColor = '#ef4444';
        break;
      case 'bus':
        style.stroke = '#3b82f6';
        style.strokeDasharray = '5,5';
        animated = true;
        markerColor = '#3b82f6';
        break;
      case 'io':
        style.stroke = '#10b981';
        markerColor = '#10b981';
        break;
      case 'rf':
        style.stroke = '#8b5cf6';
        style.strokeDasharray = '3,3';
        animated = true;
        markerColor = '#8b5cf6';
        break;
      case 'net':
        style.stroke = '#06b6d4';
        style.strokeDasharray = '5,5';
        animated = true;
        markerColor = '#06b6d4';
        break;
      case 'debug':
        style.stroke = '#f59e0b';
        markerColor = '#f59e0b';
        break;
      case 'dependency':
        style.stroke = '#64748b';
        style.strokeDasharray = '2,2';
        markerColor = '#64748b';
        break;
      }

      if (edge.criticality === 'high') {
        style.strokeWidth = 4;
        style.filter = 'drop-shadow(0 0 3px currentColor)';
      }

      return {
        id: edge.id,
        source: edge.from.nodeId,
        target: edge.to.nodeId,
        type: 'smoothstep',
        animated,
        style,
        label,
        labelStyle: { fontSize: 10, fill: markerColor },
        labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: markerColor,
        },
      };
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [data, setNodes, setEdges]);

  return (
    <div className={`w-full h-full bg-slate-50 ${className || ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color='#ccc' gap={20} />
        <Controls />
      </ReactFlow>

      <div className='absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs'>
        <div className='font-semibold mb-2'>连接类型</div>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-0.5 bg-red-500'></div>
            <span>电源</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-0.5 border-t-2 border-dashed border-blue-500'></div>
            <span>总线</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-0.5 bg-green-500'></div>
            <span>IO</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-0.5 border-t-2 border-dashed border-purple-500'></div>
            <span>射频</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-0.5 border-t-2 border-dashed border-cyan-500'></div>
            <span>网络</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-0.5 bg-orange-500'></div>
            <span>调试</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-0.5 border-t-2 border-dotted border-gray-500'></div>
            <span>依赖</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default L0Graph;
