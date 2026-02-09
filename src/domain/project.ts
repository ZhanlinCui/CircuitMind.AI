import { Workflow } from './workflow';

export type ProjectStatus = 'draft' | 'generating' | 'in_progress' | 'completed' | 'archived';

export interface ProjectComponentRef {
  componentId: string;
  model: string;
  addedAtMs: number;
}

export type SolutionRiskLevel = 'low' | 'medium' | 'high';

// ========== L0/L1 架构图相关类型 ==========

// 节点类型
export type GraphNodeType = 'group' | 'module' | 'submodule';

// 连接类型
export type GraphEdgeType = 'power' | 'bus' | 'io' | 'rf' | 'net' | 'debug' | 'dependency';

// 端口定义（L1 端口级连接需要）
export interface GraphPort {
  id: string;
  name: string;
  kind: GraphEdgeType;
  direction: 'in' | 'out' | 'bidirectional';
  voltage?: string;
  maxCurrent?: string;
  busType?: string;
  levelV?: number;
}

// 图节点
export interface GraphNode {
  id: string;
  label: string;
  nodeType: GraphNodeType;
  parentId?: string;
  ports?: GraphPort[];
  summary?: string;
  category?: string;
}

// 图边（连接）
export interface GraphEdge {
  id: string;
  from: {
    nodeId: string;
    portId?: string;
  };
  to: {
    nodeId: string;
    portId?: string;
  };
  type: GraphEdgeType;
  protocolOrSignal: string;
  constraints?: string;
  criticality: 'low' | 'medium' | 'high';
  testPoints?: string[];
  faultHandling?: string;
}

// 图数据结构（用于 L0 和 L1）
export interface GraphDTO {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ========== 研发工作流相关类型 ==========

// 泳道
export interface WorkflowLane {
  id: string;
  name: string;
}

// 工作流节点
export interface WorkflowNode {
  id: string;
  laneId: string;
  name: string;
  inputs: string[];
  outputs: string[];
  acceptance: string[];
  ownerRole?: string;
  durationEstimate?: string;
}

// 工作流边
export interface WorkflowEdge {
  fromNodeId: string;
  toNodeId: string;
  relation: 'depends_on' | 'produces' | 'verifies';
}

// 工作流门禁
export interface WorkflowGate {
  id: string;
  name: string;
  criteria: string[];
  evidence: string[];
}

// 追踪链接（可选）
export interface TraceLink {
  fromType: 'requirement' | 'workflow_node' | 'test';
  fromId: string;
  toType: 'l0_node' | 'l0_edge' | 'l1_node' | 'l1_edge' | 'gate';
  toId: string;
}

// 研发工作流数据结构
export interface WorkflowDTO {
  lanes: WorkflowLane[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  gates: WorkflowGate[];
  traceLinks?: TraceLink[];
}

// 开放问题（供用户勾选修正）
export interface OpenQuestion {
  id: string;
  question: string;
  options?: string[];
  category?: string;
}

export interface SolutionModule {
  id: string;
  name: string;
  summary: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  complexity: SolutionRiskLevel;
  risks: string[];
}

export interface SolutionEdge {
  source: string;
  target: string;
  kind: string;
  contract: string;
  criticality: string;
}

export interface SolutionMilestone {
  name: string;
  deliverables: string[];
  timeframe: string;
}

export interface SolutionAssets {
  flow: string;
  ia: string;
  wireframes: string[];
}

export interface ProjectSolution {
  id: string;
  name: string;
  positioning: string;
  costRange: string;
  durationRange: string;
  riskLevel: SolutionRiskLevel;
  highlights: string[];
  tradeoffs: string[];
  assumptions: string[];
  modules: SolutionModule[];
  edges: SolutionEdge[];
  milestones: SolutionMilestone[];
  assets: SolutionAssets;
  generatedAtMs: number;

  // ========== 新增字段（L0/L1 架构图 + 研发工作流） ==========
  architectureL0?: GraphDTO;           // L0 系统架构图（大模块连接）
  architectureL1?: GraphDTO;           // L1 详细连接图（端口级连接）
  interfaceTable?: GraphEdge[];        // 接口表（从 L1 边汇总）
  rdWorkflow?: WorkflowDTO;            // 研发工作流图
  openQuestions?: OpenQuestion[];      // 开放问题（最多 8 条）
}

export interface Project {
  id: string;
  name: string;
  description: string;
  requirementsText: string;
  coverImageDataUrl?: string;
  workflow: Workflow;
  components: ProjectComponentRef[];
  solutions?: ProjectSolution[];
  solutionsUpdatedAtMs?: number;
  status: ProjectStatus;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface ProjectCreateInput {
  name: string;
  description: string;
  requirementsText: string;
  coverImageDataUrl?: string;
  workflow: Workflow;
  components?: ProjectComponentRef[];
}
