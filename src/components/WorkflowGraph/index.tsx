import React, { useEffect, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  ConnectionMode,
  Node,
  Edge,
  MarkerType,
  NodeTypes,
  Connection,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

import { Workflow, WorkflowModuleDefinition, getModuleById } from '../../domain/workflow';
import { MODULE_CATALOG } from '../../domain/moduleCatalog';
import ModuleNode, { ModuleNodeData } from './ModuleNode';

// 注册自定义节点类型
const nodeTypes: NodeTypes = {
  module: ModuleNode,
};

interface WorkflowGraphProps {
  workflow: Workflow;
  className?: string;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  moduleCatalog?: readonly WorkflowModuleDefinition[];
}

// 估算节点尺寸用于布局计算
const NODE_WIDTH = 220;
const HEADER_HEIGHT = 50;
const PORT_HEIGHT = 32;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const g = new dagre.graphlib.Graph({ compound: true });
  g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 100 }); // LR: Left to Right
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    const data = node.data as unknown as ModuleNodeData;
    // 检查是否是 Group 节点（即是否有其他节点的 parentId 指向它）
    const isGroup = nodes.some((n) => n.parentId === node.id);

    if (isGroup) {
      // Group 节点，让 dagre 计算大小，或者设置最小尺寸
      g.setNode(node.id, { minWidth: NODE_WIDTH, minHeight: 100 });
    } else {
      // 普通节点，根据端口数量估算高度
      const height = HEADER_HEIGHT + (data.ports.length * PORT_HEIGHT) + 20;
      g.setNode(node.id, { width: NODE_WIDTH, height });
    }

    if (node.parentId) {
      g.setParent(node.id, node.parentId);
    }
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    
    // 计算绝对坐标（左上角）
    const absoluteX = nodeWithPosition.x - nodeWithPosition.width / 2;
    const absoluteY = nodeWithPosition.y - nodeWithPosition.height / 2;

    let position = { x: absoluteX, y: absoluteY };

    // 如果有父节点，需要转换为相对坐标
    if (node.parentId) {
      const parentNode = g.node(node.parentId);
      const parentAbsoluteX = parentNode.x - parentNode.width / 2;
      const parentAbsoluteY = parentNode.y - parentNode.height / 2;
      
      position = {
        x: absoluteX - parentAbsoluteX,
        y: absoluteY - parentAbsoluteY,
      };
    }

    return {
      ...node,
      position,
      style: {
        ...node.style,
        width: nodeWithPosition.width,
        height: nodeWithPosition.height,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const WorkflowGraph: React.FC<WorkflowGraphProps> = ({ workflow, className, onNodeClick, moduleCatalog }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const catalog = moduleCatalog ?? MODULE_CATALOG;

  // 处理连接事件
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // 将 Workflow 数据转换为 React Flow 格式
  useEffect(() => {
    const initialNodes: Node[] = workflow.nodes.map((node) => {
      const moduleDef = getModuleById(catalog, node.moduleId);
      return {
        id: node.id,
        type: 'module',
        data: {
          label: node.label,
          category: moduleDef?.category ?? 'unknown',
          ports: moduleDef?.ports ?? [],
        },
        position: { x: 0, y: 0 }, // 初始位置，会被布局算法覆盖
        parentId: node.parentId,
        extent: node.extent,
      };
    });

    const initialEdges: Edge[] = workflow.connections.map((conn) => ({
      id: conn.id,
      source: conn.from.nodeId,
      sourceHandle: conn.from.portId,
      target: conn.to.nodeId,
      targetHandle: conn.to.portId,
      type: 'default', // 'smoothstep' or 'bezier' (default)
      animated: true,
      style: { stroke: '#64748b', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#64748b',
      },
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [workflow, catalog, setNodes, setEdges]);

  return (
    <div className={`w-full h-full bg-slate-50 ${className || ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose} // 允许任意 Handle 之间连接
        fitView
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#ccc" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default WorkflowGraph;
