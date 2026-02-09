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
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

import { GraphDTO, GraphPort } from '../../domain/project';

interface L1GraphProps {
  data: GraphDTO;
  className?: string;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void;
}

const GroupNode: React.FC<{ data: { label: string; summary?: string; nodeType: string } }> = ({ data }) => {
  return (
    <div className='px-4 py-3 rounded-xl border-2 border-dashed border-purple-400 bg-purple-50 bg-opacity-50 min-w-[280px] min-h-[200px]'>
      <div className='font-bold text-base text-purple-700 mb-1'>
        📦 {data.label}
      </div>
      {data.summary && (
        <div className='text-xs text-purple-600 mb-2'>{data.summary}</div>
      )}
      <div className='text-xs text-purple-500 italic'>功能模块</div>
    </div>
  );
};

const DetailNode: React.FC<{ data: { label: string; ports: GraphPort[]; nodeType: string } }> = ({ data }) => {
  const inputPorts = data.ports?.filter(p => p.direction === 'in') || [];
  const outputPorts = data.ports?.filter(p => p.direction === 'out') || [];
  const biPorts = data.ports?.filter(p => p.direction === 'bidirectional') || [];

  return (
    <div className='px-3 py-2 rounded-lg border-2 border-indigo-500 bg-white shadow-md min-w-[200px]'>
      <div className='font-semibold text-sm text-gray-900 mb-2 border-b pb-1'>
        {data.label}
      </div>

      {inputPorts.length > 0 && (
        <div className='space-y-1 mb-2'>
          {inputPorts.map((port, idx) => (
            <div key={port.id} className='flex items-center gap-2 text-xs'>
              <Handle
                type='target'
                position={Position.Left}
                id={port.id}
                style={{ top: 60 + idx * 20, left: -8, width: 8, height: 8 }}
              />
              <div className='w-2 h-2 rounded-full bg-green-500'></div>
              <span className='text-gray-700'>{port.name}</span>
              {port.voltage && <span className='text-gray-500'>({port.voltage})</span>}
            </div>
          ))}
        </div>
      )}

      {outputPorts.length > 0 && (
        <div className='space-y-1 mb-2'>
          {outputPorts.map((port, idx) => (
            <div key={port.id} className='flex items-center justify-end gap-2 text-xs'>
              {port.voltage && <span className='text-gray-500'>({port.voltage})</span>}
              <span className='text-gray-700'>{port.name}</span>
              <div className='w-2 h-2 rounded-full bg-blue-500'></div>
              <Handle
                type='source'
                position={Position.Right}
                id={port.id}
                style={{ top: 60 + (inputPorts.length * 20) + idx * 20, right: -8, width: 8, height: 8 }}
              />
            </div>
          ))}
        </div>
      )}

      {biPorts.length > 0 && (
        <div className='space-y-1'>
          {biPorts.map((port, idx) => (
            <div key={port.id} className='flex items-center gap-2 text-xs'>
              <Handle
                type='target'
                position={Position.Left}
                id={`${port.id}-in`}
                style={{ top: 60 + (inputPorts.length + outputPorts.length) * 20 + idx * 20, left: -8 }}
              />
              <Handle
                type='source'
                position={Position.Right}
                id={`${port.id}-out`}
                style={{ top: 60 + (inputPorts.length + outputPorts.length) * 20 + idx * 20, right: -8 }}
              />
              <div className='w-2 h-2 rounded-full bg-purple-500'></div>
              <span className='text-gray-700'>{port.name}</span>
              {port.busType && <span className='text-gray-500'>({port.busType})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  detail: DetailNode,
  group: GroupNode,
};

const L1Graph: React.FC<L1GraphProps> = ({ data, className, onNodeClick, onEdgeClick }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const initialNodes: Node[] = data.nodes.map((node) => ({
      id: node.id,
      type: node.nodeType === 'group' ? 'group' : 'detail',
      data: {
        label: node.label,
        ports: node.ports || [],
        nodeType: node.nodeType,
      },
      position: { x: 0, y: 0 },
      parentId: node.parentId,
      extent: node.parentId ? 'parent' : undefined,
    }));

    const initialEdges: Edge[] = data.edges.map((edge) => {
      const style: React.CSSProperties = { strokeWidth: 2 };
      let animated = false;
      let markerColor = '#64748b';

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
      default:
        style.stroke = '#64748b';
        style.strokeDasharray = '2,2';
        markerColor = '#64748b';
      }

      if (edge.criticality === 'high') {
        style.strokeWidth = 4;
        style.filter = 'drop-shadow(0 0 3px currentColor)';
      }

      return {
        id: edge.id,
        source: edge.from.nodeId,
        sourceHandle: edge.from.portId,
        target: edge.to.nodeId,
        targetHandle: edge.to.portId,
        type: 'smoothstep',
        animated,
        style,
        label: edge.protocolOrSignal,
        labelStyle: { fontSize: 10, fill: markerColor },
        labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: markerColor,
        },
      };
    });

    const g = new dagre.graphlib.Graph({ compound: true });
    g.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 180, edgesep: 50 });
    g.setDefaultEdgeLabel(() => ({}));

    initialNodes.forEach((node) => {
      if (node.type === 'group') {
        g.setNode(node.id, { width: 300, height: 250 });
      } else {
        const portCount = (node.data as { ports: unknown[] }).ports?.length || 0;
        const height = 60 + portCount * 24 + 20;
        g.setNode(node.id, { width: 220, height });
      }

      if (node.parentId) {
        g.setParent(node.id, node.parentId);
      }
    });

    initialEdges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const layoutedNodes = initialNodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      const width = nodeWithPosition.width;
      const height = nodeWithPosition.height;

      let x = nodeWithPosition.x - width / 2;
      let y = nodeWithPosition.y - height / 2;

      if (node.parentId) {
        const parentNodePosition = g.node(node.parentId);
        const parentX = parentNodePosition.x - parentNodePosition.width / 2;
        const parentY = parentNodePosition.y - parentNodePosition.height / 2;
        x = x - parentX;
        y = y - parentY;
      }

      return {
        ...node,
        position: { x, y },
        style: {
          ...node.style,
          width,
          height,
        },
      };
    });

    setNodes(layoutedNodes);
    setEdges(initialEdges);
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

      <div className='absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs space-y-3'>
        <div>
          <div className='font-semibold mb-2'>层次结构</div>
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 border-2 border-dashed border-purple-400 bg-purple-50'></div>
              <span>功能模块（容器）</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 border-2 border-indigo-500 bg-white'></div>
              <span>具体器件（端口）</span>
            </div>
          </div>
        </div>

        <div className='border-t pt-2'>
          <div className='font-semibold mb-2'>端口类型</div>
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 rounded-full bg-green-500'></div>
              <span>输入</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 rounded-full bg-blue-500'></div>
              <span>输出</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 rounded-full bg-purple-500'></div>
              <span>双向</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default L1Graph;
