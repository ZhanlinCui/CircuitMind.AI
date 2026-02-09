import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { WorkflowPortDefinition } from '../../domain/workflow';

// 定义节点数据类型
export type ModuleNodeData = {
  label: string;
  category: string;
  ports: WorkflowPortDefinition[];
};

// 端口颜色映射
const PORT_COLORS: Record<string, string> = {
  power: '#ef4444', // red-500
  bus: '#3b82f6',   // blue-500
  io: '#10b981',    // emerald-500
};

export default function ModuleNode({ data }: NodeProps<Node<ModuleNodeData>>) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 min-w-[180px] w-full h-full overflow-hidden">
      {/* 标题栏 */}
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex flex-col">
        <span className="text-sm font-bold text-gray-800 truncate" title={data.label}>
          {data.label}
        </span>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
          {data.category}
        </span>
      </div>

      {/* 端口列表 */}
      <div className="py-2">
        {data.ports.map((port: WorkflowPortDefinition) => {
          // 简单的布局策略：'in' 在左侧，其他 ('out', 'bidirectional') 在右侧
          // 这样大致符合左进右出的信号流
          const isLeft = port.direction === 'in';
          const position = isLeft ? Position.Left : Position.Right;
          
          // 端口指示器颜色
          const portColor = PORT_COLORS[port.kind] || '#9ca3af';

          return (
            <div key={port.id} className="relative py-1 min-h-[24px] flex items-center">
              {/* Handle */}
              <Handle
                type="source" // 配合 connectionMode="loose" 使用，type 不限制连接
                position={position}
                id={port.id}
                className='!w-3 !h-3 !border-2 !border-white transition-colors'
                style={{ backgroundColor: portColor }}
              />
              
              {/* 端口标签 */}
              <div 
                className={`flex-1 px-3 text-xs font-mono truncate ${
                  isLeft ? 'text-left' : 'text-right'
                }`}
                title={`${port.name} (${port.kind})`}
              >
                <span style={{ color: portColor, marginRight: '4px', fontWeight: 'bold' }}>•</span>
                {port.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
