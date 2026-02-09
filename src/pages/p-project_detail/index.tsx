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
import { runAgenticPipeline, type PipelineProgress } from '../../lib/gemini';

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
  if (raw.includes('low') || raw.includes('low')) {
    return 'low';
  }
  if (raw.includes('high') || raw.includes('high')) {
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
    name: toString(record.name) ?? 'Module',
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

// normalize L0/L1 architecture andR&D Workflow ==========

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
  // Process additional fields
  const openQuestions = Array.isArray(record.openQuestions) ? record.openQuestions : [];

  return {
    id: toString(record.id) ?? createId(`sol_${index + 1}`),
    name: toString(record.name) ?? `Solution ${index + 1}`,
    positioning: toString(record.positioning ?? record.position) ?? 'Balanced',
    costRange: toString(record.costRange ?? record.cost) ?? 'TBD',
    durationRange:
      toString(record.durationRange ?? record.duration) ?? 'TBD',
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

    // ========== Additional fields ==========
    architectureL0: normalizeGraphDTO(record.architectureL0),
    architectureL1: normalizeGraphDTO(record.architectureL1),
    interfaceTable: Array.isArray(record.interfaceTable)
      ? record.interfaceTable.map(normalizeGraphEdge)
      : undefined,
    rdWorkflow: normalizeWorkflowDTO(record.rdWorkflow),
    openQuestions: openQuestions.map(normalizeOpenQuestion).slice(0, 8), // max 8
  };
}

function buildSolutionPrompt(project: Project) {
  const system = [
    'You are a senior hardware systems architect.',
    'Output strictly valid JSON, no Markdown code blocks, no comments, compact format.',
    'Output 3 clearly differentiated solutions (MCU/power/comms/cost/consumption/scalability).',
    'Each solution covers: power, MCU, sensor/actuator, comms, interface, storage, debug, protection.',
    '',
    'Quantity constraints: modules=6-8 edges=8-12 milestones=3 highlights<=5 tradeoffs<=4 assumptions<=3',
    '',
    '[KEY] architectureL1 must map hierarchically to modules:',
    '1. Define functional modules in modules (e.g. Power Module id=M_POWER, MCU Module id=M_MCU)',
    '2. In architectureL1.nodes, each device parentId must point to its parent module ID',
    '   Example: {id:U1,label:AMS1117,nodeType:submodule,parentId:M_POWER}',
    '3. Group nodes (nodeType=group) represent module boundaries, id must match module.id',
    '   Example: {id:M_POWER,label:Power Module,nodeType:group,summary:5V to 3.3V}',
    '',
    'architectureL1 structure (nodes=12-20 edges=15-25):',
    '- Group nodes (4-6): correspond to modules, no ports field',
    '- Submodule nodes (8-14): specific chips/devices, must have parentId and ports',
    '- Each submodule node has 2-6 ports',
    '',
    'Required Groups and their Submodules:',
    '1. Power Module (M_POWER): USB connector, LDO chip, filter caps',
    '2. MCU Module (M_MCU): MCU chip, crystal, reset circuit',
    '3. Comms Module (M_COMM): UART interface, USB_DM/DP',
    '4. Debug Module (M_DEBUG): SWD interface, debug connector',
    '',
    'Port direction rules:',
    '  in=signal input(VDD/RX) out=signal output(VOUT/TX) bidirectional=both(SDA/SWDIO)',
    '',
    '【rdWorkflow R&D Workflowgeneration rules】',
    'Constraints: lanes=3-5 nodes=6-12 edges=6-14 gates=1-3',
    '',
    'Required swim lanes (3-5):',
    '1. Hardware Design (L_HW): requirements, schematic, PCB, component selection',
    '2. Software Dev (L_SW): BSP/drivers, firmware, application',
    '3. Test & Verify (L_TEST): functional test, reliability test, certification',
    '4. Project Mgmt (L_PM): optional, reviews, gate management',
    '5. Supply Chain (L_SCM): optional, procurement, production prep',
    '',
    'Node design requirements:',
    '- Must cover full cycle: requirements->design->develop->test->acceptance',
    '- Each node must have specific deliverables (outputs) and acceptance criteria',
    '- Must specify ownerRole and durationEstimate',
    '- Node names must be specific: use Schematic Design, PCB Layout, Driver Dev',
    '',
    'Edge (dependency) design:',
    '- relation values: depends_on, produces, verifies',
    '- Must have cross-lane collaboration edges (HW-SW-Test coordination)',
    '- Example: Schematic->PCB(produces), PCB+Firmware->FuncTest(depends_on)',
    '',
    'Gate design:',
    '- At least 1 key review gate (EVT, DVT, PVT)',
    '- Each gate must include criteria and evidence',
    '- Example: EVT gate->criteria=[schematic review passed, key components confirmed]',
    '',
    'openQuestions<=8 wireframes<=6 flow/ia<=200 chars each',
  ].join('');

  const user = [
    `Requirements: ${project.requirementsText || 'None'}`,
    `Additional: ${project.description || 'None'}`,
    '',
    'Output JSON structure (compact, no comments, no ```json):',
    '{',
    '  "assumptions":["assumption1","assumption2"],',
    '  "solutions":[{',
    '    "id":"S1","name":"Solution Name","positioning":"cost-effective|balanced|scalable",',
    '    "costRange":"$X-Y per board","durationRange":"N-M weeks","riskLevel":"low|medium|high",',
    '    "highlights":["Highlights1"],"tradeoffs":["tradeoff1"],"assumptions":["assumption"],',
    '',
    '    "modules":[',
    '      {"id":"M_POWER","name":"Power Module","summary":"USB 5V to 3.3V","inputs":["5V"],"outputs":["3.3V"],"dependencies":[],"complexity":"low","risks":[]},',
    '      {"id":"M_MCU","name":"MCU Module","summary":"STM32 MCU","inputs":["3.3V"],"outputs":["GPIO"],"dependencies":["M_POWER"],"complexity":"medium","risks":[]}',
    '    ],',
    '    "edges":[{"source":"M_POWER","target":"M_MCU","kind":"power","contract":"3.3V/500mA","criticality":"high"}],',
    '',
    '    "architectureL1":{',
    '      "nodes":[',
    '        {"id":"M_POWER","label":"Power Module","nodeType":"group","summary":"5V to 3.3V power"},',
    '        {"id":"U_USB","label":"USB_C","nodeType":"submodule","parentId":"M_POWER","ports":[',
    '          {"id":"P1","name":"VBUS","kind":"power","direction":"out","voltage":"5V"},',
    '          {"id":"P2","name":"D+","kind":"io","direction":"bidirectional"},',
    '          {"id":"P3","name":"D-","kind":"io","direction":"bidirectional"}',
    '        ]},',
    '        {"id":"U_LDO","label":"AMS1117-3.3","nodeType":"submodule","parentId":"M_POWER","ports":[',
    '          {"id":"P4","name":"VIN","kind":"power","direction":"in","voltage":"5V"},',
    '          {"id":"P5","name":"VOUT","kind":"power","direction":"out","voltage":"3.3V"}',
    '        ]},',
    '        {"id":"M_MCU","label":"MCU Module","nodeType":"group","summary":"STM32 MCU"},',
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
    '    "milestones":[{"name":"EVT","deliverables":["schematic"],"timeframe":"week 2"}],',
    '    "assets":{"flow":"USB->LDO->MCU","ia":"board layout","wireframes":[]},',
    '',
    '    "rdWorkflow":{',
    '      "lanes":[',
    '        {"id":"L_HW","name":"Hardware Design"},',
    '        {"id":"L_SW","name":"Software Dev"},',
    '        {"id":"L_TEST","name":"Test & Verify"}',
    '      ],',
    '      "nodes":[',
    '        {"id":"N1","laneId":"L_HW","name":"Requirements Analysis","inputs":[],"outputs":["req spec","component list"],"acceptance":["req review passed","components available"],"ownerRole":"HW Lead","durationEstimate":"2-3 days"},',
    '        {"id":"N2","laneId":"L_HW","name":"Schematic Design","inputs":["req spec","component list"],"outputs":["schematic","BOM"],"acceptance":["schematic review passed","signal simulation verified"],"ownerRole":"HW Engineer","durationEstimate":"5-7 days"},',
    '        {"id":"N3","laneId":"L_HW","name":"PCB Layout","inputs":["schematic"],"outputs":["PCB files","Gerber files"],"acceptance":["DRC/DFM passed","stackup review"],"ownerRole":"Layout Engineer","durationEstimate":"5-7 days"},',
    '        {"id":"N4","laneId":"L_SW","name":"BSP Development","inputs":["schematic"],"outputs":["driver code","HAL layer"],"acceptance":["compiles","unit test >80%"],"ownerRole":"Embedded Engineer","durationEstimate":"1-2 weeks"},',
    '        {"id":"N5","laneId":"L_SW","name":"App Development","inputs":["req spec","driver code"],"outputs":["firmware"],"acceptance":["module self-test passed"],"ownerRole":"SW Engineer","durationEstimate":"1-2 weeks"},',
    '        {"id":"N6","laneId":"L_TEST","name":"Functional Test","inputs":["PCB sample","firmware"],"outputs":["test report"],"acceptance":["100% test cases executed","key functions verified"],"ownerRole":"Test Engineer","durationEstimate":"3-5 days"},',
    '        {"id":"N7","laneId":"L_TEST","name":"Reliability Test","inputs":["PCB sample","firmware"],"outputs":["reliability report"],"acceptance":["temp cycling passed","EMC pre-test passed"],"ownerRole":"Test Engineer","durationEstimate":"1 week"}',
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
    '        {"id":"G1","name":"EVT Review","criteria":["schematic reviewed","key components confirmed","cost analysis done"],"evidence":["review minutes","component cert list","cost report"]},',
    '        {"id":"G2","name":"DVT Review","criteria":["functional test passed","reliability test passed","code frozen"],"evidence":["func test report","reliability report","code commit log"]}',
    '      ]',
    '    },',
    '',
    '    "openQuestions":[]',
    '  }]',
    '}',
    '',
    '[KEY] Each module must have a corresponding group node in architectureL1 (same id), with devices having parentId pointing to group',
    'typeoptions: power bus io rf net debug',
  ].join('\n');

  return { system, user };
}

/**
 * Convert AI-generated solution modules to WorkflowModuleDefinition format
 */
function convertSolutionModulesToCatalog(
  solution: ProjectSolution,
): WorkflowModuleDefinition[] {
  return (solution.modules ?? []).map((module) => {
    // Create IO port definitions for each input
    const inputPorts: WorkflowPortDefinition[] = (module.inputs ?? []).map(
      (input, index) => ({
        id: `input_${index}`,
        name: input,
        kind: 'io' as const,
        direction: 'in' as const,
        io: 'gpio' as const,
      }),
    );

    // Create IO port definitions for each output
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
 * Convert AI-generated solution to Workflow format for visualization
 */
function convertSolutionToWorkflow(
  solution: ProjectSolution,
  moduleCatalog: WorkflowModuleDefinition[],
): Workflow {
  // 1. Convert SolutionModule to WorkflowNode
  const nodes: WorkflowNode[] = (solution.modules ?? []).map((module) => ({
    id: module.id,
    moduleId: module.id,
    label: module.name,
  }));

  // 2. Convert SolutionEdge to WorkflowConnection
  const connections: WorkflowConnection[] = (solution.edges ?? []).map(
    (edge, index) => {
      // Find source and target modules
      const sourceModule = moduleCatalog.find((m) => m.id === edge.source);
      const targetModule = moduleCatalog.find((m) => m.id === edge.target);

      // Use first output port and first input port
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
          <div className="text-sm text-text-secondary">Modules</div>
          <div className="text-3xl font-bold text-text-primary mt-1">
            {project.workflow.nodes.length}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="text-sm text-text-secondary">Connections</div>
          <div className="text-3xl font-bold text-text-primary mt-1">
            {project.workflow.connections.length}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="text-sm text-text-secondary">Validation Issues</div>
          <div className="text-3xl font-bold text-text-primary mt-1">
            {issues.length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden h-[600px] border border-border-primary">
        <div className="p-4 border-b border-border-primary bg-gray-50 font-semibold text-text-primary">
          System Topology
        </div>
        <WorkflowGraph workflow={project.workflow} />
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-border-primary flex items-center justify-between">
          <div className="font-semibold text-text-primary">Module List</div>
        </div>
        {project.workflow.nodes.length === 0 ? (
          <div className="p-6 text-text-secondary text-sm">
            No workflow modules，可以去“Edit project”start building。
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
          <div className="font-semibold text-text-primary">Validation Results</div>
        </div>
        {issues.length === 0 ? (
          <div className="p-6 text-sm text-success">No issues found</div>
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
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null);
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
    if (!confirm('Delete this project? This cannot be undone.')) {
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
        // Use 4-step Agentic Pipeline for Gemini 3
        setPipelineProgress(null);
        const geminiResult = await runAgenticPipeline({
          apiKey: config.apiKey,
          model: config.model,
          proModel: 'gemini-3-pro-preview',
          systemPrompt: system,
          userPrompt: user,
          temperature: config.temperature ?? 0.2,
          onProgress: (progress) => setPipelineProgress({ ...progress }),
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
        console.error('❌ JSON parse failed:', _error);
        throw new Error('Failed to parse AI response');
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
        throw new Error('No solutions found in response');
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
          console.error(`❌ Solution ${index + 1} solution normalization failed:`, err);
          console.error('❌ Stack trace:', err instanceof Error ? err.stack : 'No stack trace');
          console.error('❌ Solution data:', parsedSolutions[index]);
          throw err;
        }
      }

      setProjectSolutions(project.id, nextSolutions);
      setProjectStatus(project.id, 'draft');
      setSolutions(nextSolutions);
      setSelectedSolutionId(nextSolutions[0]?.id ?? null);
      reloadProject();
    } catch (error) {
      console.error('Solution generation failed:', error);
      setGenerateError(error instanceof Error ? error.message : 'Generation failed');
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
      pageTitle="Project Detail"
      breadcrumb={['Dashboard', 'Projects', 'Project Detail']}
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
                  Created: {formatDateTime(project.createdAtMs)} · Updated: 
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
                  <i className="fas fa-edit mr-2"></i>Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleSetStatus('in_progress')}
                  className="px-4 py-2 bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20 rounded-lg font-medium hover:bg-opacity-20 transition-colors"
                >
                  Mark In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleSetStatus('completed')}
                  className="px-4 py-2 bg-success bg-opacity-10 text-success border border-success border-opacity-20 rounded-lg font-medium hover:bg-opacity-20 transition-colors"
                >
                  Mark Completed
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-white border border-border-primary rounded-lg font-medium text-danger hover:bg-bg-secondary transition-colors"
                >
                  <i className="fas fa-trash mr-2"></i>Delete
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <TabButton
              active={activeTab === 'workflow'}
              onClick={() => setActiveTab('workflow')}
            >
              Module Workflow
            </TabButton>
            <TabButton
              active={activeTab === 'requirements'}
              onClick={() => setActiveTab('requirements')}
            >
              Requirements
            </TabButton>
            <TabButton
              active={activeTab === 'schemes'}
              onClick={() => setActiveTab('schemes')}
            >
              Solutions
            </TabButton>
          </div>

          {activeTab === 'workflow' && <WorkflowSummary project={project} />}

          {activeTab === 'requirements' && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="font-semibold text-text-primary mb-3">
                Requirements
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
                      Solutions
                    </div>
                    <div className="text-sm text-text-secondary">
                      Generate multiple AI solutions and save to this project
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleGenerateSolutions}
                      disabled={isGenerating}
                      className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-glow transition-all duration-300 disabled:opacity-60"
                    >
                      {isGenerating ? 'Generating...' : 'Generate 3 Solutions'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/user-profile')}
                      className="px-4 py-2 bg-white border border-border-primary rounded-lg font-medium text-text-primary hover:bg-bg-secondary transition-colors"
                    >
                      AI Settings
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
                  const stepLabels = [
                    { key: 'perceive', label: 'Requirement Analysis', icon: 'fa-search' },
                    { key: 'generate', label: 'Solution Generation', icon: 'fa-magic' },
                    { key: 'validate', label: 'AI Self-Validation', icon: 'fa-check-circle' },
                    { key: 'iterate', label: 'Auto-Fix Issues', icon: 'fa-wrench' },
                  ];
                  const currentStepIdx = pipelineProgress
                    ? stepLabels.findIndex(s => s.key === pipelineProgress.currentStep)
                    : 0;
                  return (
                    <div className="bg-white rounded-2xl shadow-card p-8">
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5 mb-4">
                          <i className="fas fa-robot text-indigo-600"></i>
                          <span className="text-sm font-medium text-indigo-700">Agentic Design Pipeline</span>
                        </div>
                        <div className="text-lg font-semibold text-text-primary">
                          {pipelineProgress?.message || 'Initializing AI pipeline...'}
                        </div>
                      </div>
                      {/* Step progress bar */}
                      <div className="flex items-center justify-between max-w-xl mx-auto mb-6">
                        {stepLabels.map((step, idx) => {
                          const isActive = idx === currentStepIdx;
                          const isDone = idx < currentStepIdx || pipelineProgress?.currentStep === 'done';
                          return (
                            <div key={step.key} className="flex flex-col items-center flex-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all duration-500 ${
                                isDone ? 'bg-emerald-500 text-white' :
                                isActive ? 'bg-indigo-600 text-white animate-pulse' :
                                'bg-slate-200 text-slate-400'
                              }`}>
                                {isDone ? <i className="fas fa-check"></i> :
                                 isActive ? <i className={`fas ${step.icon} fa-spin`}></i> :
                                 idx + 1}
                              </div>
                              <div className={`text-xs font-medium text-center ${
                                isDone ? 'text-emerald-600' :
                                isActive ? 'text-indigo-600' :
                                'text-slate-400'
                              }`}>{step.label}</div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2 max-w-xl mx-auto">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-700"
                          style={{ width: `${pipelineProgress?.currentStep === 'done' ? 100 : ((pipelineProgress?.stepNumber ?? 1) / 4) * 100}%` }}
                        />
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
                        No Solutions Yet
                      </div>
                      <div className="text-sm">
                        Generate 3 comparable circuit solutions with one click
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
                              <div className="text-text-secondary">Cost</div>
                              <div className="text-text-primary font-medium">
                                {solution.costRange}
                              </div>
                            </div>
                            <div>
                              <div className="text-text-secondary">Duration</div>
                              <div className="text-text-primary font-medium">
                                {solution.durationRange}
                              </div>
                            </div>
                            <div>
                              <div className="text-text-secondary">Risk</div>
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
                                Generated: 
                            {formatDateTime(selectedSolution.generatedAtMs)}
                          </div>
                        </div>

                        {/* Solution metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div className="bg-bg-secondary rounded-lg p-4">
                            <div className="text-xs text-text-secondary mb-1">
                                  Modules
                            </div>
                            <div className="text-2xl font-bold text-text-primary">
                              {selectedSolution.modules?.length ?? 0}
                            </div>
                          </div>
                          <div className="bg-bg-secondary rounded-lg p-4">
                            <div className="text-xs text-text-secondary mb-1">
                                  Connections
                            </div>
                            <div className="text-2xl font-bold text-text-primary">
                              {selectedSolution.edges?.length ?? 0}
                            </div>
                          </div>
                          <div className="bg-bg-secondary rounded-lg p-4">
                            <div className="text-xs text-text-secondary mb-1">
                                  Cost区间
                            </div>
                            <div className="text-sm font-semibold text-text-primary">
                              {selectedSolution.costRange}
                            </div>
                          </div>
                          <div className="bg-bg-secondary rounded-lg p-4">
                            <div className="text-xs text-text-secondary mb-1">
                                  Duration区间
                            </div>
                            <div className="text-sm font-semibold text-text-primary">
                              {selectedSolution.durationRange}
                            </div>
                          </div>
                          <div className="bg-bg-secondary rounded-lg p-4">
                            <div className="text-xs text-text-secondary mb-1">
                                  Risk等级
                            </div>
                            <div className="text-sm font-semibold text-text-primary">
                              {formatRiskLabel(selectedSolution.riskLevel)}
                            </div>
                          </div>
                        </div>

                        {/* Architecture与工作流 - 新增三个 Tab */}
                        <div className="space-y-3">
                          <div className="font-semibold text-text-primary">
                                Architecture & R&D Workflow
                          </div>

                          {/* Tab switch */}
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
                                    Architecture
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
                                    L1 Detail
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
                                    R&D Workflow
                              </button>
                            </div>
                          </div>

                          {/* Tab content */}
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
                                  <div>此方案暂无 L1 Detail图数据</div>
                                  <div className="text-xs mt-2">Regenerate to get complete data</div>
                                </div>
                              </div>
                            ) : null}

                            {archViewTab === 'workflow' && selectedSolution.rdWorkflow ? (
                              <RDWorkflowGraph data={selectedSolution.rdWorkflow} />
                            ) : archViewTab === 'workflow' ? (
                              <div className="flex items-center justify-center h-full text-text-secondary">
                                <div className="text-center">
                                  <i className="fas fa-info-circle text-4xl mb-3"></i>
                                  <div>此方案暂无R&D Workflow数据</div>
                                  <div className="text-xs mt-2">Regenerate to get complete data</div>
                                </div>
                              </div>
                            ) : null}
                          </div>

                          {/* Open questions */}
                          {selectedSolution.openQuestions && selectedSolution.openQuestions.length > 0 && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="font-semibold text-sm text-yellow-900 mb-2">
                                <i className="fas fa-question-circle mr-2"></i>
                                    Open Questions
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
                                  Highlights
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
                                  Trade-offs
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
                                Module List
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
                                        In: 
                                    {module.inputs?.join(' / ') || '—'}
                                  </div>
                                  <div>
                                        Out: 
                                    {module.outputs?.join(' / ') || '—'}
                                  </div>
                                  <div>
                                        Deps: 
                                    {module.dependencies?.join(' / ') ||
                                          '—'}
                                  </div>
                                  <div>
                                        Complexity: {module.complexity}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="font-semibold text-text-primary">
                                Module Connections
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
                                Milestones
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
                                Key Flows & Assets
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="border border-border-primary rounded-lg p-4">
                              <div className="text-xs text-text-secondary mb-2">
                                    Flow
                              </div>
                              <div className="text-sm text-text-primary whitespace-pre-wrap">
                                {selectedSolution.assets?.flow || '—'}
                              </div>
                            </div>
                            <div className="border border-border-primary rounded-lg p-4">
                              <div className="text-xs text-text-secondary mb-2">
                                    Info Architecture
                              </div>
                              <div className="text-sm text-text-primary whitespace-pre-wrap">
                                {selectedSolution.assets?.ia || '—'}
                              </div>
                            </div>
                            <div className="border border-border-primary rounded-lg p-4">
                              <div className="text-xs text-text-secondary mb-2">
                                    Wireframes
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
                                Assumptions
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
