export type WorkflowPortKind = 'power' | 'bus' | 'io';

export type WorkflowPortDirection = 'in' | 'out' | 'bidirectional';

export type WorkflowBusType = 'i2c' | 'spi' | 'uart' | 'usb' | 'gpio';

export type WorkflowIssueSeverity = 'error' | 'warning' | 'info';

export interface WorkflowPortBase {
  id: string;
  name: string;
  kind: WorkflowPortKind;
  direction: WorkflowPortDirection;
}

export interface WorkflowPowerPort extends WorkflowPortBase {
  kind: 'power';
  voltage: number;
  maxCurrentMa?: number;
  railName?: string;
}

export interface WorkflowBusPort extends WorkflowPortBase {
  kind: 'bus';
  bus: WorkflowBusType;
}

export interface WorkflowIoPort extends WorkflowPortBase {
  kind: 'io';
  io: 'gpio' | 'adc' | 'pwm' | 'int';
  levelV?: number;
}

export type WorkflowPortDefinition = WorkflowPowerPort | WorkflowBusPort | WorkflowIoPort;

export interface WorkflowModuleDefinition {
  id: string;
  name: string;
  category: 'power' | 'mcu' | 'sensor' | 'interface' | 'glue' | 'other';
  ports: WorkflowPortDefinition[];
}

export interface WorkflowNode {
  id: string;
  moduleId: string;
  label: string;
  parentId?: string;
  extent?: 'parent';
}

export interface WorkflowConnectionEnd {
  nodeId: string;
  portId: string;
}

export interface WorkflowConnection {
  id: string;
  from: WorkflowConnectionEnd;
  to: WorkflowConnectionEnd;
}

export interface Workflow {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

export interface WorkflowIssue {
  id: string;
  severity: WorkflowIssueSeverity;
  message: string;
  nodeIds?: string[];
  connectionId?: string;
}

export function createEmptyWorkflow(): Workflow {
  return { nodes: [], connections: [] };
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getModuleById(
  catalog: readonly WorkflowModuleDefinition[],
  moduleId: string,
): WorkflowModuleDefinition | undefined {
  return catalog.find((m) => m.id === moduleId);
}

export function getPortById(
  moduleDefinition: WorkflowModuleDefinition,
  portId: string,
): WorkflowPortDefinition | undefined {
  return moduleDefinition.ports.find((p) => p.id === portId);
}

export function validateWorkflow(
  workflow: Workflow,
  catalog: readonly WorkflowModuleDefinition[],
): WorkflowIssue[] {
  const issues: WorkflowIssue[] = [];
  const nodesById = new Map(workflow.nodes.map((n) => [n.id, n]));

  for (const connection of workflow.connections) {
    const fromNode = nodesById.get(connection.from.nodeId);
    const toNode = nodesById.get(connection.to.nodeId);
    if (!fromNode || !toNode) {
      issues.push({
        id: `missing-node:${connection.id}`,
        severity: 'error',
        message: '连接引用了不存在的模块实例',
        connectionId: connection.id,
      });
      continue;
    }

    const fromModule = getModuleById(catalog, fromNode.moduleId);
    const toModule = getModuleById(catalog, toNode.moduleId);
    if (!fromModule || !toModule) {
      issues.push({
        id: `missing-module:${connection.id}`,
        severity: 'error',
        message: '连接引用了不存在的模块定义',
        connectionId: connection.id,
      });
      continue;
    }

    const fromPort = getPortById(fromModule, connection.from.portId);
    const toPort = getPortById(toModule, connection.to.portId);
    if (!fromPort || !toPort) {
      issues.push({
        id: `missing-port:${connection.id}`,
        severity: 'error',
        message: '连接引用了不存在的端口',
        connectionId: connection.id,
      });
      continue;
    }

    if (fromPort.kind !== toPort.kind) {
      issues.push({
        id: `kind-mismatch:${connection.id}`,
        severity: 'error',
        message: `端口类型不匹配：${fromPort.kind} → ${toPort.kind}`,
        connectionId: connection.id,
        nodeIds: [fromNode.id, toNode.id],
      });
      continue;
    }

    if (fromPort.kind === 'power' && toPort.kind === 'power') {
      const voltageDelta = Math.abs(fromPort.voltage - toPort.voltage);
      if (voltageDelta > 0.01) {
        issues.push({
          id: `power-voltage-mismatch:${connection.id}`,
          severity: 'error',
          message: `电源电压不匹配：${fromPort.voltage}V → ${toPort.voltage}V`,
          connectionId: connection.id,
          nodeIds: [fromNode.id, toNode.id],
        });
      }

      if (fromPort.direction === 'in') {
        issues.push({
          id: `power-direction:${connection.id}`,
          severity: 'warning',
          message: '建议从“输出”端口连接到“输入”端口（当前来源端口为输入）',
          connectionId: connection.id,
        });
      }
    }

    if (fromPort.kind === 'bus' && toPort.kind === 'bus') {
      if (fromPort.bus !== toPort.bus) {
        issues.push({
          id: `bus-mismatch:${connection.id}`,
          severity: 'error',
          message: `总线类型不匹配：${fromPort.bus} → ${toPort.bus}`,
          connectionId: connection.id,
          nodeIds: [fromNode.id, toNode.id],
        });
      }
    }
  }

  const usesI2c = workflow.connections.some((c) => {
    const fromNode = nodesById.get(c.from.nodeId);
    const toNode = nodesById.get(c.to.nodeId);
    if (!fromNode || !toNode) {
      return false;
    }
    const fromModule = getModuleById(catalog, fromNode.moduleId);
    const toModule = getModuleById(catalog, toNode.moduleId);
    if (!fromModule || !toModule) {
      return false;
    }
    const fromPort = getPortById(fromModule, c.from.portId);
    const toPort = getPortById(toModule, c.to.portId);
    return (
      fromPort?.kind === 'bus' &&
      toPort?.kind === 'bus' &&
      fromPort.bus === 'i2c' &&
      toPort.bus === 'i2c'
    );
  });

  if (usesI2c) {
    const hasPullup = workflow.nodes.some((n) => n.moduleId === 'glue_i2c_pullup');
    if (!hasPullup) {
      issues.push({
        id: 'i2c-pullup-missing',
        severity: 'warning',
        message: '检测到 I2C 连接，建议添加上拉电阻（I2C Pull-up）模块',
      });
    }
  }

  return issues;
}
