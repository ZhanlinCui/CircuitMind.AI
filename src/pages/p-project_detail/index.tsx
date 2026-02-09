import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../components/AppShell';
import { MODULE_CATALOG } from '../../domain/moduleCatalog';
import {
  Project,
  ProjectSolution,
  SolutionRiskLevel,
  GraphPort,
  GraphNode,
  GraphEdge,
  GraphDTO,
  GraphEdgeType,
  GraphNodeType,
  WorkflowDTO,
  WorkflowLane,
  WorkflowNode as RDWorkflowNode,
  WorkflowEdge as RDWorkflowEdge,
  WorkflowGate,
  OpenQuestion,
} from '../../domain/project';
import {
  createId,
  createEmptyWorkflow,
  validateWorkflow,
  Workflow,
  WorkflowNode,
  WorkflowConnection,
  WorkflowModuleDefinition,
  WorkflowPortDefinition,
} from '../../domain/workflow';
import WorkflowGraph from '../../components/WorkflowGraph';
import L1Graph from '../../components/ArchitectureGraph/L1Graph';
import RDWorkflowGraph from '../../components/RDWorkflowGraph';
import {
  deleteProject,
  getProjectById,
  setProjectSolutions,
  setProjectStatus,
} from '../../lib/projectsStore';
import { loadAiConfig } from '../../lib/storage';
import { callGemini, SOLUTION_OUTPUT_SCHEMA } from '../../lib/gemini';

type TabKey = 'workflow' | 'requirements' | 'schemes';

function formatDateTime(ms: number): string {
  const date = new Date(ms);
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function formatRiskLabel(risk: SolutionRiskLevel): string {
  if (risk === 'low') return 'Low';
  if (risk === 'high') return 'High';
  return 'Medium';
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

function buildEndpoint(
  baseUrl: string,
  provider: 'openai' | 'anthropic' | 'gemini',
  model?: string,
): string {
  const normalized = normalizeBaseUrl(baseUrl);
  if (provider === 'gemini') {
    return `${normalized}/models/${model ?? 'gemini-3-flash-preview'}:generateContent`;
  }
  if (provider === 'openai') {
    return normalized.endsWith('/v1')
      ? `${normalized}/chat/completions`
      : `${normalized}/v1/chat/completions`;
  }
  return normalized.endsWith('/v1')
    ? `${normalized}/messages`
    : `${normalized}/v1/messages`;
}

function extractJsonFromText(text: string): string {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    return text;
  }
  return text.slice(first, last + 1);
}

function extractJsonPayload(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = codeBlockMatch ? codeBlockMatch[1] : text;
  const trimmed = candidate.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    return trimmed;
  }
  const objectStart = trimmed.indexOf('{');
  const objectEnd = trimmed.lastIndexOf('}');
  if (objectStart !== -1 && objectEnd > objectStart) {
    return trimmed.slice(objectStart, objectEnd + 1);
  }
  const arrayStart = trimmed.indexOf('[');
  const arrayEnd = trimmed.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    return trimmed.slice(arrayStart, arrayEnd + 1);
  }
  return extractJsonFromText(trimmed);
}

function sanitizeJsonText(text: string): string {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .replace(/,\s*([}\]])/g, '$1')
    .trim();
}

function parseJsonWithRepair(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (_error) {
    const sanitized = sanitizeJsonText(text);
    return JSON.parse(sanitized);
  }
}

function extractOpenAiMessageText(message: unknown): string {
  if (!message) {
    return '';
  }
  if (typeof message === 'string') {
    return message;
  }
  const record = toRecord(message);
  if (!record) {
    return '';
  }
  const content = record.content;
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        const itemRecord = toRecord(item);
        if (!itemRecord) {
          return '';
        }
        return toString(itemRecord.text) ?? '';
      })
      .filter((item) => item.trim().length > 0)
      .join('\n');
  }
  return '';
}

function extractAnthropicText(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        const itemRecord = toRecord(item);
        if (!itemRecord) {
          return '';
        }
        return toString(itemRecord.text) ?? '';
      })
      .filter((item) => item.trim().length > 0)
      .join('\n');
  }
  const record = toRecord(content);
  return record ? (toString(record.text) ?? '') : '';
}

function extractTextByProvider(
  provider: 'openai' | 'anthropic' | 'gemini',
  data: unknown,
): string {
  if (provider === 'gemini') {
    const record = toRecord(data);
    if (!record) return '';
    const candidates = Array.isArray(record.candidates) ? record.candidates : [];
    const first = toRecord(candidates[0]);
    if (!first) return '';
    const content = toRecord(first.content);
    if (!content) return '';
    const parts = Array.isArray(content.parts) ? content.parts : [];
    return parts
      .map((p: unknown) => {
        const pr = toRecord(p);
        return pr ? (toString(pr.text) ?? '') : '';
      })
      .filter((t: string) => t.length > 0)
      .join('');
  }
  const record = toRecord(data);
  if (provider === 'openai') {
    const recordObject = record ?? {};
    const choices = Array.isArray(recordObject.choices)
      ? recordObject.choices
      : undefined;
    const firstChoice = Array.isArray(choices) ? toRecord(choices[0]) : null;
    const candidate =
      firstChoice?.message ??
      firstChoice?.delta ??
      recordObject.message ??
      recordObject.data ??
      recordObject.result ??
      data;
    return extractOpenAiMessageText(candidate);
  }
  const recordObject = record ?? {};
  const candidate =
    recordObject.content ??
    toRecord(recordObject.message)?.content ??
    recordObject.data ??
    recordObject.result ??
    data;
  return extractAnthropicText(candidate);
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
}

function toString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return undefined;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item))
      .filter((item) => item.trim().length > 0);
  }
  const asString = toString(value);
  return asString ? [asString] : [];
}

function normalizeRiskLevel(value: unknown): SolutionRiskLevel {
  const raw = toString(value)?.toLowerCase() ?? '';
  if (raw.includes('low') || raw.includes('低')) {
    return 'low';
  }
  if (raw.includes('high') || raw.includes('高')) {
    return 'high';
  }
  return 'medium';
}

function normalizeSolutionModule(
  value: unknown,
): ProjectSolution['modules'][number] {
  const record = toRecord(value) ?? {};
  return {
    id: toString(record.id) ?? createId('mod'),
    name: toString(record.name) ?? '模块',
    summary: toString(record.summary) ?? '',
    inputs: toStringArray(record.inputs ?? record.input),
    outputs: toStringArray(record.outputs ?? record.output),
    dependencies: toStringArray(record.dependencies ?? record.dependency),
    complexity: normalizeRiskLevel(record.complexity),
    risks: toStringArray(record.risks ?? record.risk),
  };
}

function normalizeSolutionEdge(
  value: unknown,
): ProjectSolution['edges'][number] {
  const record = toRecord(value) ?? {};
  return {
    source: toString(record.source) ?? '',
    target: toString(record.target) ?? '',
    kind: toString(record.kind) ?? '',
    contract: toString(record.contract) ?? '',
    criticality: toString(record.criticality) ?? '',
  };
}

function normalizeSolutionMilestone(
  value: unknown,
): ProjectSolution['milestones'][number] {
  const record = toRecord(value) ?? {};
  return {
    name: toString(record.name) ?? '',
    deliverables: toStringArray(record.deliverables ?? record.deliverable),
    timeframe: toString(record.timeframe) ?? '',
  };
}

function normalizeSolutionAssets(value: unknown): ProjectSolution['assets'] {
  const record = toRecord(value) ?? {};
  return {
    flow: toString(record.flow) ?? '',
    ia: toString(record.ia) ?? '',
    wireframes: toStringArray(record.wireframes ?? record.wireframe),
  };
}

// ========== 新增：归一化 L0/L1 架构图和研发工作流 ==========

function normalizeGraphPort(value: unknown): GraphPort | undefined {
  const record = toRecord(value);
  if (!record) return undefined;

  return {
    id: toString(record.id) ?? createId('port'),
    name: toString(record.name) ?? '',
    kind: (toString(record.kind) as GraphEdgeType) ?? 'io',
    direction: (toString(record.direction) as 'in' | 'out' | 'bidirectional') ?? 'bidirectional',
    voltage: toString(record.voltage),
    maxCurrent: toString(record.maxCurrent),
    busType: toString(record.busType),
    levelV: typeof record.levelV === 'number' ? record.levelV : undefined,
  };
}

function normalizeGraphNode(value: unknown): GraphNode {
  const record = toRecord(value) ?? {};
  const ports = Array.isArray(record.ports) ? record.ports : [];

  return {
    id: toString(record.id) ?? createId('node'),
    label: toString(record.label) ?? '',
    nodeType: (toString(record.nodeType) as GraphNodeType) ?? 'module',
    parentId: toString(record.parentId),
    ports: ports.map(normalizeGraphPort).filter((p): p is GraphPort => p !== undefined),
    summary: toString(record.summary),
    category: toString(record.category),
  };
}

function normalizeGraphEdge(value: unknown): GraphEdge {
  const record = toRecord(value) ?? {};
  const fromRecord = toRecord(record.from) ?? {};
  const toRecordData = toRecord(record.to) ?? {};

  return {
    id: toString(record.id) ?? createId('edge'),
    from: {
      nodeId: toString(fromRecord.nodeId) ?? '',
      portId: toString(fromRecord.portId),
    },
    to: {
      nodeId: toString(toRecordData.nodeId) ?? '',
      portId: toString(toRecordData.portId),
    },
    type: (toString(record.type) as GraphEdgeType) ?? 'dependency',
    protocolOrSignal: toString(record.protocolOrSignal) ?? '',
    constraints: toString(record.constraints),
    criticality: (toString(record.criticality) as 'low' | 'medium' | 'high') ?? 'medium',
    testPoints: toStringArray(record.testPoints),
    faultHandling: toString(record.faultHandling),
  };
}

function normalizeGraphDTO(value: unknown): GraphDTO | undefined {
  const record = toRecord(value);
  if (!record) return undefined;

  const nodes = Array.isArray(record.nodes) ? record.nodes : [];
  const edges = Array.isArray(record.edges) ? record.edges : [];

  return {
    nodes: nodes.map(normalizeGraphNode),
    edges: edges.map(normalizeGraphEdge),
  };
}

function normalizeWorkflowLane(value: unknown): WorkflowLane {
  const record = toRecord(value) ?? {};
  return {
    id: toString(record.id) ?? createId('lane'),
    name: toString(record.name) ?? '',
  };
}

function normalizeWorkflowNode(value: unknown): RDWorkflowNode {
  const record = toRecord(value) ?? {};
  return {
    id: toString(record.id) ?? createId('wfnode'),
    laneId: toString(record.laneId) ?? '',
    name: toString(record.name) ?? '',
    inputs: toStringArray(record.inputs),
    outputs: toStringArray(record.outputs),
    acceptance: toStringArray(record.acceptance),
    ownerRole: toString(record.ownerRole),
    durationEstimate: toString(record.durationEstimate),
  };
}

function normalizeWorkflowEdge(value: unknown): RDWorkflowEdge {
  const record = toRecord(value) ?? {};
  return {
    fromNodeId: toString(record.fromNodeId) ?? '',
    toNodeId: toString(record.toNodeId) ?? '',
    relation: (toString(record.relation) as 'depends_on' | 'produces' | 'verifies') ?? 'depends_on',
  };
}

function normalizeWorkflowGate(value: unknown): WorkflowGate {
  const record = toRecord(value) ?? {};
  return {
    id: toString(record.id) ?? createId('gate'),
    name: toString(record.name) ?? '',
    criteria: toStringArray(record.criteria),
    evidence: toStringArray(record.evidence),
  };
}

function normalizeWorkflowDTO(value: unknown): WorkflowDTO | undefined {
  const record = toRecord(value);
  if (!record) return undefined;

  const lanes = Array.isArray(record.lanes) ? record.lanes : [];
  const nodes = Array.isArray(record.nodes) ? record.nodes : [];
  const edges = Array.isArray(record.edges) ? record.edges : [];
  const gates = Array.isArray(record.gates) ? record.gates : [];

  return {
    lanes: lanes.map(normalizeWorkflowLane),
    nodes: nodes.map(normalizeWorkflowNode),
    edges: edges.map(normalizeWorkflowEdge),
    gates: gates.map(normalizeWorkflowGate),
  };
}

function normalizeOpenQuestion(value: unknown): OpenQuestion {
  const record = toRecord(value) ?? {};
  return {
    id: toString(record.id) ?? createId('q'),
    question: toString(record.question) ?? '',
    options: toStringArray(record.options),
    category: toString(record.category),
  };
}

function normalizeSolution(
  value: unknown,
  index: number,
  parsedAssumptions: string[],
  now: number,
): ProjectSolution {
  const record = toRecord(value) ?? {};
  const modules = Array.isArray(record.modules ?? record.moduleList)
    ? (record.modules ?? record.moduleList)
    : [];
  const edges = Array.isArray(record.edges ?? record.links)
    ? (record.edges ?? record.links)
    : [];
  const milestones = Array.isArray(record.milestones ?? record.milestone)
    ? (record.milestones ?? record.milestone)
    : [];
  // 处理新增字段
  const openQuestions = Array.isArray(record.openQuestions) ? record.openQuestions : [];

  return {
    id: toString(record.id) ?? createId(`sol_${index + 1}`),
    name: toString(record.name) ?? `方案 ${index + 1}`,
    positioning: toString(record.positioning ?? record.position) ?? '均衡',
    costRange: toString(record.costRange ?? record.cost) ?? '待评估',
    durationRange:
      toString(record.durationRange ?? record.duration) ?? '待评估',
    riskLevel: normalizeRiskLevel(
      record.riskLevel ?? record.risk_level ?? record.risk,
    ),
    highlights: toStringArray(record.highlights ?? record.highlight),
    tradeoffs: toStringArray(record.tradeoffs ?? record.tradeoff),
    assumptions:
      toStringArray(record.assumptions).length > 0
        ? toStringArray(record.assumptions)
        : parsedAssumptions,
    modules: (modules as unknown[]).map(normalizeSolutionModule),
    edges: (edges as unknown[]).map(normalizeSolutionEdge),
    milestones: (milestones as unknown[]).map(normalizeSolutionMilestone),
    assets: normalizeSolutionAssets(record.assets ?? record.asset ?? record),
    generatedAtMs: now,

    // ========== 新增字段 ==========
    architectureL0: normalizeGraphDTO(record.architectureL0),
    architectureL1: normalizeGraphDTO(record.architectureL1),
    interfaceTable: Array.isArray(record.interfaceTable)
      ? record.interfaceTable.map(normalizeGraphEdge)
      : undefined,
    rdWorkflow: normalizeWorkflowDTO(record.rdWorkflow),
    openQuestions: openQuestions.map(normalizeOpenQuestion).slice(0, 8), // 最多8条
  };
}

function buildSolutionPrompt(project: Project) {
  const system = [
    '你是资深硬件系统方案架构师。',
    '输出严格合法JSON，无Markdown代码块，无注释，紧凑格式。',
    '必须输出3个方案，差异明显（主控选型/供电/通信/成本/功耗/扩展性）。',
    '每方案覆盖：供电、主控、传感/执行、通信、接口、存储、调试、保护。',
    '',
    '数量约束：modules=6-8 edges=8-12 milestones=3 highlights<=5 tradeoffs<=4 assumptions<=3',
    '',
    '【关键】architectureL1必须与modules建立层次映射关系：',
    '1. 先在modules中定义功能模块(如\'电源模块\'id=\'M_POWER\',\'主控模块\'id=\'M_MCU\')',
    '2. 在architectureL1.nodes中，具体器件的parentId必须指向所属模块ID',
    '   示例：{id:\'U1\',label:\'AMS1117\',nodeType:\'submodule\',parentId:\'M_POWER\'}',
    '3. Group节点(nodeType=\'group\')代表模块边界，id必须与module.id一致',
    '   示例：{id:\'M_POWER\',label:\'电源模块\',nodeType:\'group\',summary:\'5V转3.3V\'}',
    '',
    'architectureL1结构(nodes=12-20 edges=15-25)：',
    '- Group节点(4-6个)：对应modules，无ports字段',
    '- Submodule节点(8-14个)：具体芯片/器件，必须有parentId和ports',
    '- 每个submodule节点ports=2-6个',
    '',
    '必须包含的Group及其Submodule：',
    '1. 电源模块(M_POWER)：USB接口、LDO芯片、滤波电容',
    '2. 主控模块(M_MCU)：MCU芯片、晶振、复位电路',
    '3. 通信模块(M_COMM)：UART接口、USB_DM/DP',
    '4. 调试模块(M_DEBUG)：SWD接口、调试连接器',
    '',
    '端口方向规则：',
    '  in=信号进入(VDD/RX) out=信号输出(VOUT/TX) bidirectional=双向(SDA/SWDIO)',
    '',
    '【rdWorkflow 研发工作流生成规则】',
    '数量约束：lanes=3-5 nodes=6-12 edges=6-14 gates=1-3',
    '',
    '必须包含的泳道(3-5个)：',
    '1. 硬件设计(L_HW)：需求分析、原理图、PCB、器件选型',
    '2. 软件开发(L_SW)：BSP/驱动、固件、应用程序',
    '3. 测试验证(L_TEST)：功能测试、可靠性测试、认证',
    '4. 项目管理(L_PM)：可选，评审、门禁管理',
    '5. 供应链(L_SCM)：可选，器件采购、生产准备',
    '',
    '节点设计要求：',
    '- 必须覆盖完整周期：需求→设计→开发→测试→验收',
    '- 每个节点必须有具体交付物(outputs)和明确验收标准(acceptance)',
    '- 必须指定ownerRole(如\'硬件工程师\'、\'软件工程师\')和durationEstimate(如\'3天\'、\'1周\')',
    '- 节点命名要具体：避免\'设计\'，使用\'原理图设计\'、\'PCB Layout\'、\'驱动开发\'',
    '',
    '边(依赖关系)设计：',
    '- relation可选值：depends_on(依赖), produces(产出), verifies(验证)',
    '- 必须有跨泳道协作边，体现硬件-软件-测试的配合',
    '- 示例：原理图→PCB(produces)、PCB+固件→功能测试(depends_on)',
    '',
    '门禁(Gates)设计：',
    '- 至少1个关键评审门禁(如EVT、DVT、PVT)',
    '- 每个门禁必须包含criteria(验收标准)和evidence(证据材料)',
    '- 示例：EVT门禁→criteria=[\'原理图评审通过\',\'关键器件确认\']',
    '',
    'openQuestions<=8 wireframes<=6 flow/ia各<=200字',
  ].join('');

  const user = [
    `需求：${project.requirementsText || '无'}`,
    `补充：${project.description || '无'}`,
    '',
    '输出JSON结构(紧凑，无注释，无```json)：',
    '{',
    '  "assumptions":["假设1","假设2"],',
    '  "solutions":[{',
    '    "id":"S1","name":"方案名","positioning":"高性价比|均衡|高扩展",',
    '    "costRange":"单板成本X-Y元","durationRange":"N-M周","riskLevel":"low|medium|high",',
    '    "highlights":["亮点1"],"tradeoffs":["权衡1"],"assumptions":["方案假设"],',
    '',
    '    "modules":[',
    '      {"id":"M_POWER","name":"电源模块","summary":"USB 5V转3.3V","inputs":["5V"],"outputs":["3.3V"],"dependencies":[],"complexity":"low","risks":[]},',
    '      {"id":"M_MCU","name":"主控模块","summary":"STM32主控","inputs":["3.3V"],"outputs":["GPIO"],"dependencies":["M_POWER"],"complexity":"medium","risks":[]}',
    '    ],',
    '    "edges":[{"source":"M_POWER","target":"M_MCU","kind":"power","contract":"3.3V/500mA","criticality":"high"}],',
    '',
    '    "architectureL1":{',
    '      "nodes":[',
    '        {"id":"M_POWER","label":"电源模块","nodeType":"group","summary":"5V->3.3V供电"},',
    '        {"id":"U_USB","label":"USB_C","nodeType":"submodule","parentId":"M_POWER","ports":[',
    '          {"id":"P1","name":"VBUS","kind":"power","direction":"out","voltage":"5V"},',
    '          {"id":"P2","name":"D+","kind":"io","direction":"bidirectional"},',
    '          {"id":"P3","name":"D-","kind":"io","direction":"bidirectional"}',
    '        ]},',
    '        {"id":"U_LDO","label":"AMS1117-3.3","nodeType":"submodule","parentId":"M_POWER","ports":[',
    '          {"id":"P4","name":"VIN","kind":"power","direction":"in","voltage":"5V"},',
    '          {"id":"P5","name":"VOUT","kind":"power","direction":"out","voltage":"3.3V"}',
    '        ]},',
    '        {"id":"M_MCU","label":"主控模块","nodeType":"group","summary":"STM32主控"},',
    '        {"id":"U_MCU","label":"STM32F072CBT6","nodeType":"submodule","parentId":"M_MCU","ports":[',
    '          {"id":"P6","name":"VDD","kind":"power","direction":"in","voltage":"3.3V"},',
    '          {"id":"P7","name":"USB_DM","kind":"io","direction":"bidirectional"},',
    '          {"id":"P8","name":"USB_DP","kind":"io","direction":"bidirectional"},',
    '          {"id":"P9","name":"SWCLK","kind":"debug","direction":"bidirectional"},',
    '          {"id":"P10","name":"SWDIO","kind":"debug","direction":"bidirectional"}',
    '        ]}',
    '      ],',
    '      "edges":[',
    '        {"id":"E1","from":{"nodeId":"U_USB","portId":"P1"},"to":{"nodeId":"U_LDO","portId":"P4"},"type":"power","protocolOrSignal":"5V","criticality":"high"},',
    '        {"id":"E2","from":{"nodeId":"U_LDO","portId":"P5"},"to":{"nodeId":"U_MCU","portId":"P6"},"type":"power","protocolOrSignal":"3.3V","criticality":"high"},',
    '        {"id":"E3","from":{"nodeId":"U_USB","portId":"P2"},"to":{"nodeId":"U_MCU","portId":"P7"},"type":"bus","protocolOrSignal":"USB","criticality":"medium"}',
    '      ]',
    '    },',
    '',
    '    "milestones":[{"name":"EVT","deliverables":["原理图"],"timeframe":"第2周"}],',
    '    "assets":{"flow":"USB->LDO->MCU","ia":"单板布局","wireframes":[]},',
    '',
    '    "rdWorkflow":{',
    '      "lanes":[',
    '        {"id":"L_HW","name":"硬件设计"},',
    '        {"id":"L_SW","name":"软件开发"},',
    '        {"id":"L_TEST","name":"测试验证"}',
    '      ],',
    '      "nodes":[',
    '        {"id":"N1","laneId":"L_HW","name":"需求分析","inputs":[],"outputs":["需求规格书","器件选型表"],"acceptance":["需求评审通过","器件可获得性确认"],"ownerRole":"硬件负责人","durationEstimate":"2-3天"},',
    '        {"id":"N2","laneId":"L_HW","name":"原理图设计","inputs":["需求规格书","器件选型表"],"outputs":["原理图","BOM清单"],"acceptance":["原理图评审通过","关键信号仿真验证"],"ownerRole":"硬件工程师","durationEstimate":"5-7天"},',
    '        {"id":"N3","laneId":"L_HW","name":"PCB设计","inputs":["原理图"],"outputs":["PCB文件","Gerber文件"],"acceptance":["DRC/DFM检查通过","叠层设计评审"],"ownerRole":"Layout工程师","durationEstimate":"5-7天"},',
    '        {"id":"N4","laneId":"L_SW","name":"BSP开发","inputs":["原理图"],"outputs":["驱动代码","HAL层"],"acceptance":["代码编译通过","单元测试覆盖率>80%"],"ownerRole":"嵌入式工程师","durationEstimate":"1-2周"},',
    '        {"id":"N5","laneId":"L_SW","name":"应用程序开发","inputs":["需求规格书","驱动代码"],"outputs":["固件程序"],"acceptance":["功能模块自测通过"],"ownerRole":"软件工程师","durationEstimate":"1-2周"},',
    '        {"id":"N6","laneId":"L_TEST","name":"功能测试","inputs":["PCB样板","固件程序"],"outputs":["测试报告"],"acceptance":["测试用例100%执行","关键功能验证通过"],"ownerRole":"测试工程师","durationEstimate":"3-5天"},',
    '        {"id":"N7","laneId":"L_TEST","name":"可靠性测试","inputs":["PCB样板","固件程序"],"outputs":["可靠性报告"],"acceptance":["高低温测试通过","EMC预测试通过"],"ownerRole":"测试工程师","durationEstimate":"1周"}',
    '      ],',
    '      "edges":[',
    '        {"fromNodeId":"N1","toNodeId":"N2","relation":"produces"},',
    '        {"fromNodeId":"N2","toNodeId":"N3","relation":"produces"},',
    '        {"fromNodeId":"N2","toNodeId":"N4","relation":"produces"},',
    '        {"fromNodeId":"N1","toNodeId":"N5","relation":"produces"},',
    '        {"fromNodeId":"N4","toNodeId":"N5","relation":"depends_on"},',
    '        {"fromNodeId":"N3","toNodeId":"N6","relation":"depends_on"},',
    '        {"fromNodeId":"N5","toNodeId":"N6","relation":"depends_on"},',
    '        {"fromNodeId":"N6","toNodeId":"N7","relation":"verifies"}',
    '      ],',
    '      "gates":[',
    '        {"id":"G1","name":"EVT评审","criteria":["原理图评审通过","关键器件选型确认","成本核算完成"],"evidence":["评审会议记录","器件认证清单","成本分析报告"]},',
    '        {"id":"G2","name":"DVT评审","criteria":["功能测试通过","可靠性测试通过","软件代码冻结"],"evidence":["功能测试报告","可靠性测试报告","代码提交记录"]}',
    '      ]',
    '    },',
    '',
    '    "openQuestions":[]',
    '  }]',
    '}',
    '',
    '【关键】每个module必须在architectureL1中有对应的group节点(id相同)，该group下包含具体器件(parentId指向group)',
    'type可选值: power bus io rf net debug',
  ].join('\n');

  return { system, user };
}

/**
 * 将AI生成的方案模块转换为WorkflowModuleDefinition格式
 */
function convertSolutionModulesToCatalog(
  solution: ProjectSolution,
): WorkflowModuleDefinition[] {
  return (solution.modules ?? []).map((module) => {
    // 为每个输入创建 IO 端口定义
    const inputPorts: WorkflowPortDefinition[] = (module.inputs ?? []).map(
      (input, index) => ({
        id: `input_${index}`,
        name: input,
        kind: 'io' as const,
        direction: 'in' as const,
        io: 'gpio' as const,
      }),
    );

    // 为每个输出创建 IO 端口定义
    const outputPorts: WorkflowPortDefinition[] = (module.outputs ?? []).map(
      (output, index) => ({
        id: `output_${index}`,
        name: output,
        kind: 'io' as const,
        direction: 'out' as const,
        io: 'gpio' as const,
      }),
    );

    return {
      id: module.id,
      name: module.name,
      category: 'other' as const,
      ports: [...inputPorts, ...outputPorts],
    };
  });
}

/**
 * 将AI生成的方案模块转换为Workflow格式，用于可视化渲染
 */
function convertSolutionToWorkflow(
  solution: ProjectSolution,
  moduleCatalog: WorkflowModuleDefinition[],
): Workflow {
  // 1. 将 SolutionModule 转换为 WorkflowNode
  const nodes: WorkflowNode[] = (solution.modules ?? []).map((module) => ({
    id: module.id,
    moduleId: module.id,
    label: module.name,
  }));

  // 2. 将 SolutionEdge 转换为 WorkflowConnection
  const connections: WorkflowConnection[] = (solution.edges ?? []).map(
    (edge, index) => {
      // 找到源模块和目标模块
      const sourceModule = moduleCatalog.find((m) => m.id === edge.source);
      const targetModule = moduleCatalog.find((m) => m.id === edge.target);

      // 使用第一个输出端口和第一个输入端口
      const sourcePort = sourceModule?.ports.find((p) => p.direction === 'out');
      const targetPort = targetModule?.ports.find((p) => p.direction === 'in');

      const connection = {
        id: createId(`conn_${index}`),
        from: {
          nodeId: edge.source,
          portId: sourcePort?.id ?? 'output_0',
        },
        to: {
          nodeId: edge.target,
          portId: targetPort?.id ?? 'input_0',
        },
      };
      return connection;
    },
  );

  const workflow = { nodes, connections };

  return workflow;
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-4 py-2 rounded-lg font-medium transition-colors',
        active
          ? 'bg-bg-secondary text-text-primary'
          : 'text-text-secondary hover:bg-bg-secondary',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function ProjectNotFound({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl shadow-card p-10 text-center">
      <div className="text-4xl mb-3 text-text-secondary">
        <i className="fas fa-exclamation-triangle"></i>
      </div>
      <div className="text-lg font-semibold text-text-primary mb-1">
        {t('project_detail.not_found_title')}
      </div>
      <div className="text-sm text-text-secondary mb-6">
        {t('project_detail.not_found_desc')}
      </div>
      <button
        type="button"
        onClick={onBack}
        className="bg-gradient-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-glow transition-all duration-300"
      >
        {t('project_detail.btn_back_to_list')}
      </button>
    </div>
  );
}

function WorkflowSummary({ project }: { project: Project }) {
  const issues = useMemo(
    () => validateWorkflow(project.workflow, MODULE_CATALOG),
    [project.workflow],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="text-sm text-text-secondary">模块数</div>
          <div className="text-3xl font-bold text-text-primary mt-1">
            {project.workflow.nodes.length}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="text-sm text-text-secondary">连接数</div>
          <div className="text-3xl font-bold text-text-primary mt-1">
            {project.workflow.connections.length}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="text-sm text-text-secondary">校验问题</div>
          <div className="text-3xl font-bold text-text-primary mt-1">
            {issues.length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden h-[600px] border border-border-primary">
        <div className="p-4 border-b border-border-primary bg-gray-50 font-semibold text-text-primary">
          系统连接图
        </div>
        <WorkflowGraph workflow={project.workflow} />
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-border-primary flex items-center justify-between">
          <div className="font-semibold text-text-primary">模块列表</div>
        </div>
        {project.workflow.nodes.length === 0 ? (
          <div className="p-6 text-text-secondary text-sm">
            还没有工作流模块，可以去“编辑项目”开始拼接。
          </div>
        ) : (
          <ul className="divide-y divide-border-primary">
            {project.workflow.nodes.map((node) => {
              const moduleDef = MODULE_CATALOG.find(
                (m) => m.id === node.moduleId,
              );
              return (
                <li
                  key={node.id}
                  className="p-6 flex items-center justify-between"
                >
                  <div>
                    <div className="text-text-primary font-medium">
                      {node.label}
                    </div>
                    <div className="text-sm text-text-secondary">
                      {moduleDef?.name ?? node.moduleId}
                    </div>
                  </div>
                  <span className="text-xs text-text-secondary">
                    {moduleDef?.category ?? 'other'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-border-primary flex items-center justify-between">
          <div className="font-semibold text-text-primary">校验结果</div>
        </div>
        {issues.length === 0 ? (
          <div className="p-6 text-sm text-success">暂无问题</div>
        ) : (
          <ul className="divide-y divide-border-primary">
            {issues.map((issue) => (
              <li key={issue.id} className="p-6 flex items-start space-x-3">
                <span
                  className={[
                    'mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs text-white flex-shrink-0',
                    issue.severity === 'error'
                      ? 'bg-danger'
                      : issue.severity === 'warning'
                        ? 'bg-warning'
                        : 'bg-info',
                  ].join(' ')}
                >
                  {issue.severity === 'error'
                    ? '!'
                    : issue.severity === 'warning'
                      ? '⚠'
                      : 'i'}
                </span>
                <div className="text-sm text-text-primary">{issue.message}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const ProjectDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') ?? '';
  const action = searchParams.get('action');
  const [activeTab, setActiveTab] = useState<TabKey>('workflow');
  const [project, setProject] = useState(() => getProjectById(projectId));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [solutions, setSolutions] = useState<ProjectSolution[]>([]);
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(
    null,
  );
  const [archViewTab, setArchViewTab] = useState<'l1' | 'workflow' | 'legacy'>('legacy');
  const isGeneratingRef = useRef(false);
  const reloadProject = useCallback(() => {
    setProject(getProjectById(projectId));
  }, [projectId]);

  useEffect(() => {
    reloadProject();
  }, [reloadProject]);

  useEffect(() => {
    if (!project) {
      setSolutions([]);
      setSelectedSolutionId(null);
      return;
    }
    const nextSolutions = project.solutions ?? [];
    setSolutions(nextSolutions);
    setSelectedSolutionId(nextSolutions[0]?.id ?? null);
  }, [project]);

  const handleDelete = () => {
    if (!project) {
      return;
    }
    if (!confirm('确定要删除这个项目吗？此操作不可撤销。')) {
      return;
    }
    deleteProject(project.id);
    navigate('/project-list');
  };

  const handleSetStatus = (nextStatus: Project['status']) => {
    if (!project) {
      return;
    }
    setProjectStatus(project.id, nextStatus);
    reloadProject();
  };

  const handleGenerateSolutions = useCallback(async () => {
    if (!project || isGeneratingRef.current) {
      return;
    }
    isGeneratingRef.current = true;
    const config = loadAiConfig();
    if (!config || !config.apiKey || !config.model) {
      setGenerateError('Please configure AI settings first (Settings > AI Compute Config)');
      setProjectStatus(project.id, 'draft');
      reloadProject();
      isGeneratingRef.current = false;
      return;
    }
    setGenerateError(null);
    setIsGenerating(true);
    setProjectStatus(project.id, 'generating');
    reloadProject();

    try {
      const { system, user } = buildSolutionPrompt(project);

      let rawText = '';
      let hasStructuredPayload = false;
      let data: unknown = null;

      if (config.provider === 'gemini') {
        // Use Gemini 3 with structured output (JSON Schema)
        const geminiResult = await callGemini({
          apiKey: config.apiKey,
          model: config.model,
          systemPrompt: system,
          userPrompt: user,
          temperature: config.temperature ?? 0.2,
          jsonSchema: SOLUTION_OUTPUT_SCHEMA,
        });
        rawText = geminiResult;
        hasStructuredPayload = false; // text needs parsing
      } else {
        // Legacy OpenAI / Anthropic path
        const endpoint = buildEndpoint(config.baseUrl, config.provider, config.model);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers:
            config.provider === 'openai'
              ? {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.apiKey}`,
              }
              : {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01',
              },
          body:
            config.provider === 'openai'
              ? JSON.stringify({
                model: config.model,
                temperature: config.temperature ?? 0.2,
                messages: [
                  { role: 'system', content: system },
                  { role: 'user', content: user },
                ],
              })
              : JSON.stringify({
                model: config.model,
                temperature: config.temperature ?? 0.2,
                max_tokens: 16000,
                system,
                messages: [{ role: 'user', content: user }],
              }),
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        data = await response.json();

        const dataRecord = toRecord(data);
        hasStructuredPayload =
          !!dataRecord &&
          (Array.isArray(dataRecord.solutions) ||
            Array.isArray(dataRecord.assumptions));
        rawText = extractTextByProvider(config.provider, data);
      }

      if (!hasStructuredPayload && !rawText.trim()) {
        throw new Error('AI returned empty content');
      }
      const jsonText = hasStructuredPayload
        ? ''
        : extractJsonPayload(String(rawText));
      let parsed: unknown;
      try {
        parsed = hasStructuredPayload
          ? toRecord(data)
          : parseJsonWithRepair(jsonText);
      } catch (_error) {
        console.error('❌ JSON 解析失败:', _error);
        throw new Error('解析返回内容失败，请检查模型输出格式');
      }
      const parsedObject = Array.isArray(parsed)
        ? undefined
        : (parsed as Record<string, unknown>);
      const parsedSolutions: ProjectSolution[] = Array.isArray(parsed)
        ? (parsed as ProjectSolution[])
        : Array.isArray(parsedObject?.solutions)
          ? (parsedObject?.solutions as ProjectSolution[])
          : [];
      const parsedAssumptions =
        parsedObject && Array.isArray(parsedObject.assumptions)
          ? (parsedObject.assumptions as string[])
          : [];
      if (parsedSolutions.length === 0) {
        throw new Error('未解析到方案结果');
      }

      const now = Date.now();

      const nextSolutions: ProjectSolution[] = [];
      for (let index = 0; index < Math.min(3, parsedSolutions.length); index++) {
        try {
          const normalized = normalizeSolution(
            parsedSolutions[index],
            index,
            parsedAssumptions,
            now
          );
          nextSolutions.push(normalized);
        } catch (err) {
          console.error(`❌ 第 ${index + 1} 个方案标准化失败:`, err);
          console.error('❌ 错误堆栈:', err instanceof Error ? err.stack : 'No stack trace');
          console.error('❌ 方案数据:', parsedSolutions[index]);
          throw err;
        }
      }

      setProjectSolutions(project.id, nextSolutions);
      setProjectStatus(project.id, 'draft');
      setSolutions(nextSolutions);
      setSelectedSolutionId(nextSolutions[0]?.id ?? null);
      reloadProject();
    } catch (error) {
      console.error('方案生成失败:', error);
      setGenerateError(error instanceof Error ? error.message : '生成失败');
      setProjectStatus(project.id, 'draft');
      reloadProject();
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  }, [project, reloadProject]);

  useEffect(() => {
    if (!project) {
      return;
    }
    if (action !== 'generate') {
      return;
    }
    const autoGenerateLockKey = `pcbtool.auto-generate.${project.id}`;
    if (
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem(autoGenerateLockKey) === 'done'
    ) {
      navigate(`/project-detail?projectId=${project.id}`, { replace: true });
      return;
    }
    if (solutions.length > 0 || isGenerating) {
      return;
    }
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(autoGenerateLockKey, 'done');
    }
    navigate(`/project-detail?projectId=${project.id}`, { replace: true });
    handleGenerateSolutions();
  }, [
    action,
    handleGenerateSolutions,
    isGenerating,
    navigate,
    project,
    solutions.length,
  ]);

  const selectedSolution =
    solutions.find((s) => s.id === selectedSolutionId) ?? solutions[0];
  const solutionModuleCatalog = useMemo(
    () => (selectedSolution ? convertSolutionModulesToCatalog(selectedSolution) : []),
    [selectedSolution],
  );
  const solutionWorkflow = useMemo(
    () =>
      selectedSolution
        ? convertSolutionToWorkflow(selectedSolution, solutionModuleCatalog)
        : createEmptyWorkflow(),
    [selectedSolution, solutionModuleCatalog],
  );

  return (
    <AppShell
      pageTitle="项目详情"
      breadcrumb={['工作台', '项目管理', '项目详情']}
    >
      {!project ? (
        <ProjectNotFound onBack={() => navigate('/project-list')} />
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-card rounded-xl flex items-center justify-center border border-border-primary">
                    <i className="fas fa-microchip text-primary text-xl"></i>
                  </div>
                  <div className="min-w-0">
                    <div className="text-2xl font-bold text-text-primary truncate">
                      {project.name}
                    </div>
                    <div className="text-sm text-text-secondary truncate">
                      {project.description || '—'}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-text-secondary">
                  创建：{formatDateTime(project.createdAtMs)} · 更新：
                  {formatDateTime(project.updatedAtMs)}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/project-create?projectId=${project.id}`)
                  }
                  className="px-4 py-2 bg-white border border-border-primary rounded-lg font-medium text-text-primary hover:bg-bg-secondary transition-colors"
                >
                  <i className="fas fa-edit mr-2"></i>编辑项目
                </button>
                <button
                  type="button"
                  onClick={() => handleSetStatus('in_progress')}
                  className="px-4 py-2 bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20 rounded-lg font-medium hover:bg-opacity-20 transition-colors"
                >
                  标记进行中
                </button>
                <button
                  type="button"
                  onClick={() => handleSetStatus('completed')}
                  className="px-4 py-2 bg-success bg-opacity-10 text-success border border-success border-opacity-20 rounded-lg font-medium hover:bg-opacity-20 transition-colors"
                >
                  标记已完成
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-white border border-border-primary rounded-lg font-medium text-danger hover:bg-bg-secondary transition-colors"
                >
                  <i className="fas fa-trash mr-2"></i>删除
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <TabButton
              active={activeTab === 'workflow'}
              onClick={() => setActiveTab('workflow')}
            >
              模块工作流
            </TabButton>
            <TabButton
              active={activeTab === 'requirements'}
              onClick={() => setActiveTab('requirements')}
            >
              文本需求
            </TabButton>
            <TabButton
              active={activeTab === 'schemes'}
              onClick={() => setActiveTab('schemes')}
            >
              方案输出
            </TabButton>
          </div>

          {activeTab === 'workflow' && <WorkflowSummary project={project} />}

          {activeTab === 'requirements' && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="font-semibold text-text-primary mb-3">
                需求描述
              </div>
              <pre className="whitespace-pre-wrap text-sm text-text-primary bg-bg-secondary rounded-lg p-4 border border-border-primary">
                {project.requirementsText || '—'}
              </pre>
            </div>
          )}

          {activeTab === 'schemes' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-card p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-text-primary mb-1">
                      方案输出
                    </div>
                    <div className="text-sm text-text-secondary">
                      使用用户自带算力生成多方案，并保存到本项目
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleGenerateSolutions}
                      disabled={isGenerating}
                      className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-glow transition-all duration-300 disabled:opacity-60"
                    >
                      {isGenerating ? '生成中...' : '生成 3 个方案'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/user-profile')}
                      className="px-4 py-2 bg-white border border-border-primary rounded-lg font-medium text-text-primary hover:bg-bg-secondary transition-colors"
                    >
                      配置算力
                    </button>
                  </div>
                </div>
                {generateError && (
                  <div className="mt-4 text-sm text-danger bg-danger bg-opacity-10 border border-danger border-opacity-20 rounded-lg p-3">
                    {generateError}
                  </div>
                )}
              </div>

              {(() => {
                if (isGenerating) {
                  return (
                    <div className="bg-white rounded-2xl shadow-card p-8 text-center text-text-secondary">
                      <div className="text-4xl mb-3">
                        <i className="fas fa-spinner fa-spin"></i>
                      </div>
                      <div className="text-lg font-medium text-text-primary mb-1">
                        生成中
                      </div>
                      <div className="text-sm">
                        正在请求 AI 生成方案，请稍候
                      </div>
                    </div>
                  );
                }
                if (solutions.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl shadow-card p-8 text-center text-text-secondary">
                      <div className="text-4xl mb-3">
                        <i className="fas fa-lightbulb"></i>
                      </div>
                      <div className="text-lg font-medium text-text-primary mb-1">
                        暂无方案
                      </div>
                      <div className="text-sm">
                        完成配置后即可生成 3 个可对比的方案
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {solutions.map((solution) => (
                        <button
                          key={solution.id}
                          type="button"
                          onClick={() => setSelectedSolutionId(solution.id)}
                          className={[
                            'text-left bg-white rounded-2xl shadow-card border transition-all p-6',
                            selectedSolution?.id === solution.id
                              ? 'border-primary ring-2 ring-primary ring-opacity-20'
                              : 'border-border-primary hover:border-primary hover:shadow-glow',
                          ].join(' ')}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-lg font-semibold text-text-primary">
                              {solution.name}
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-bg-secondary text-text-secondary">
                              {solution.positioning}
                            </span>
                          </div>
                          <div className="text-sm text-text-secondary mb-4">
                            {solution.highlights?.[0] ?? '—'}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs text-text-secondary">
                            <div>
                              <div className="text-text-secondary">成本</div>
                              <div className="text-text-primary font-medium">
                                {solution.costRange}
                              </div>
                            </div>
                            <div>
                              <div className="text-text-secondary">周期</div>
                              <div className="text-text-primary font-medium">
                                {solution.durationRange}
                              </div>
                            </div>
                            <div>
                              <div className="text-text-secondary">风险</div>
                              <div className="text-text-primary font-medium">
                                {formatRiskLabel(solution.riskLevel)}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedSolution && (
                      <div className="bg-white rounded-2xl shadow-card p-6 space-y-6">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="text-xl font-semibold text-text-primary">
                              {selectedSolution.name}
                            </div>
                            <div className="text-sm text-text-secondary">
                              {selectedSolution.positioning}
                            </div>
                          </div>
                          <div className="text-sm text-text-secondary">
                                生成时间：
                            {formatDateTime(selectedSolution.generatedAtMs)}
                          </div>
                        </div>

                        {/* 方案统计指标 - 包含模块数和连接数 */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div className="bg-bg-secondary rounded-lg p-4">
                            <div className="text-xs text-text-secondary mb-1">
                                  模块数
                            </div>
                            <div className="text-2xl font-bold text-text-primary">
                              {selectedSolution.modules?.length ?? 0}
                            </div>
                          </div>
                          <div className="bg-bg-secondary rounded-lg p-4">
                            <div className="text-xs text-text-secondary mb-1">
                                  连接数
                            </div>
                            <div className="text-2xl font-bold text-text-primary">
                              {selectedSolution.edges?.length ?? 0}
                            </div>
                          </div>
                          <div className="bg-bg-secondary rounded-lg p-4">
                            <div className="text-xs text-text-secondary mb-1">
                                  成本区间
                            </div>
                            <div className="text-sm font-semibold text-text-primary">
                              {selectedSolution.costRange}
                            </div>
                          </div>
                          <div className="bg-bg-secondary rounded-lg p-4">
                            <div className="text-xs text-text-secondary mb-1">
                                  周期区间
                            </div>
                            <div className="text-sm font-semibold text-text-primary">
                              {selectedSolution.durationRange}
                            </div>
                          </div>
                          <div className="bg-bg-secondary rounded-lg p-4">
                            <div className="text-xs text-text-secondary mb-1">
                                  风险等级
                            </div>
                            <div className="text-sm font-semibold text-text-primary">
                              {formatRiskLabel(selectedSolution.riskLevel)}
                            </div>
                          </div>
                        </div>

                        {/* 系统架构与工作流 - 新增三个 Tab */}
                        <div className="space-y-3">
                          <div className="font-semibold text-text-primary">
                                系统架构与研发工作流
                          </div>

                          {/* Tab 切换 */}
                          <div className="border-b border-border-primary">
                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={() => setArchViewTab('legacy')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                  archViewTab === 'legacy'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                                }`}
                              >
                                    系统架构
                              </button>
                              <button
                                type="button"
                                onClick={() => setArchViewTab('l1')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                  archViewTab === 'l1'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                                }`}
                              >
                                    L1 详细连接
                              </button>
                              <button
                                type="button"
                                onClick={() => setArchViewTab('workflow')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                  archViewTab === 'workflow'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                                }`}
                              >
                                    研发工作流
                              </button>
                            </div>
                          </div>

                          {/* Tab 内容 */}
                          <div className="border border-border-primary rounded-lg overflow-hidden h-[600px] bg-gray-50">
                            {archViewTab === 'legacy' && (
                              <WorkflowGraph
                                workflow={solutionWorkflow}
                                moduleCatalog={solutionModuleCatalog}
                              />
                            )}

                            {archViewTab === 'l1' && selectedSolution.architectureL1 ? (
                              <L1Graph data={selectedSolution.architectureL1} />
                            ) : archViewTab === 'l1' ? (
                              <div className="flex items-center justify-center h-full text-text-secondary">
                                <div className="text-center">
                                  <i className="fas fa-info-circle text-4xl mb-3"></i>
                                  <div>此方案暂无 L1 详细连接图数据</div>
                                  <div className="text-xs mt-2">请重新生成方案以获取完整数据</div>
                                </div>
                              </div>
                            ) : null}

                            {archViewTab === 'workflow' && selectedSolution.rdWorkflow ? (
                              <RDWorkflowGraph data={selectedSolution.rdWorkflow} />
                            ) : archViewTab === 'workflow' ? (
                              <div className="flex items-center justify-center h-full text-text-secondary">
                                <div className="text-center">
                                  <i className="fas fa-info-circle text-4xl mb-3"></i>
                                  <div>此方案暂无研发工作流数据</div>
                                  <div className="text-xs mt-2">请重新生成方案以获取完整数据</div>
                                </div>
                              </div>
                            ) : null}
                          </div>

                          {/* 开放问题展示 */}
                          {selectedSolution.openQuestions && selectedSolution.openQuestions.length > 0 && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="font-semibold text-sm text-yellow-900 mb-2">
                                <i className="fas fa-question-circle mr-2"></i>
                                    待确认问题
                              </div>
                              <div className="space-y-2">
                                {selectedSolution.openQuestions.map((q) => (
                                  <div key={q.id} className="text-sm">
                                    <div className="text-yellow-900 font-medium">{q.question}</div>
                                    {q.options && q.options.length > 0 && (
                                      <div className="flex gap-2 mt-1">
                                        {q.options.map((opt) => (
                                          <span key={opt} className="px-2 py-1 bg-white border border-yellow-300 rounded text-xs text-yellow-800">
                                            {opt}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="font-semibold text-text-primary">
                                  亮点
                            </div>
                            <ul className="text-sm text-text-secondary list-disc pl-5 space-y-1">
                              {(selectedSolution.highlights ?? []).map(
                                (item) => (
                                  <li key={item}>{item}</li>
                                ),
                              )}
                            </ul>
                          </div>
                          <div className="space-y-3">
                            <div className="font-semibold text-text-primary">
                                  取舍
                            </div>
                            <ul className="text-sm text-text-secondary list-disc pl-5 space-y-1">
                              {(selectedSolution.tradeoffs ?? []).map(
                                (item) => (
                                  <li key={item}>{item}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="font-semibold text-text-primary">
                                模块清单
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {(selectedSolution.modules ?? []).map((module) => (
                              <div
                                key={module.id}
                                className="border border-border-primary rounded-lg p-4"
                              >
                                <div className="font-medium text-text-primary mb-2">
                                  {module.name}
                                </div>
                                <div className="text-sm text-text-secondary mb-2">
                                  {module.summary}
                                </div>
                                <div className="text-xs text-text-secondary space-y-1">
                                  <div>
                                        输入：
                                    {module.inputs?.join(' / ') || '—'}
                                  </div>
                                  <div>
                                        输出：
                                    {module.outputs?.join(' / ') || '—'}
                                  </div>
                                  <div>
                                        依赖：
                                    {module.dependencies?.join(' / ') ||
                                          '—'}
                                  </div>
                                  <div>
                                        复杂度：{module.complexity}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="font-semibold text-text-primary">
                                模块连接图
                          </div>
                          <div className="border border-border-primary rounded-lg p-4 bg-bg-secondary text-sm text-text-secondary space-y-2">
                            {(selectedSolution.edges ?? []).length === 0 ? (
                              <div>—</div>
                            ) : (
                              selectedSolution.edges.map((edge, index) => (
                                <div
                                  key={`${edge.source}-${edge.target}-${index}`}
                                >
                                  {edge.source} → {edge.target} ·{' '}
                                  {edge.kind} · {edge.contract}
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="font-semibold text-text-primary">
                                里程碑
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {(selectedSolution.milestones ?? []).map(
                              (milestone) => (
                                <div
                                  key={milestone.name}
                                  className="border border-border-primary rounded-lg p-4"
                                >
                                  <div className="font-medium text-text-primary mb-1">
                                    {milestone.name}
                                  </div>
                                  <div className="text-xs text-text-secondary mb-2">
                                    {milestone.timeframe}
                                  </div>
                                  <ul className="text-sm text-text-secondary list-disc pl-5 space-y-1">
                                    {(milestone.deliverables ?? []).map(
                                      (item) => (
                                        <li key={item}>{item}</li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              ),
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="font-semibold text-text-primary">
                                关键页面与流程
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="border border-border-primary rounded-lg p-4">
                              <div className="text-xs text-text-secondary mb-2">
                                    流程图
                              </div>
                              <div className="text-sm text-text-primary whitespace-pre-wrap">
                                {selectedSolution.assets?.flow || '—'}
                              </div>
                            </div>
                            <div className="border border-border-primary rounded-lg p-4">
                              <div className="text-xs text-text-secondary mb-2">
                                    信息架构
                              </div>
                              <div className="text-sm text-text-primary whitespace-pre-wrap">
                                {selectedSolution.assets?.ia || '—'}
                              </div>
                            </div>
                            <div className="border border-border-primary rounded-lg p-4">
                              <div className="text-xs text-text-secondary mb-2">
                                    线框图清单
                              </div>
                              <ul className="text-sm text-text-primary list-disc pl-5 space-y-1">
                                {(
                                  selectedSolution.assets?.wireframes ?? []
                                ).map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="font-semibold text-text-primary">
                                假设清单
                          </div>
                          <ul className="text-sm text-text-secondary list-disc pl-5 space-y-1">
                            {(selectedSolution.assumptions ?? []).map(
                              (item) => (
                                <li key={item}>{item}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
};

export default ProjectDetailPage;
