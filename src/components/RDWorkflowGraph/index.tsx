import React from 'react';
import { WorkflowDTO } from '../../domain/project';

interface RDWorkflowGraphProps {
  data: WorkflowDTO;
  className?: string;
}

const RDWorkflowGraph: React.FC<RDWorkflowGraphProps> = ({ data, className }) => {
  // 计算每个泳道的节点
  const getLaneNodes = (laneId: string) => {
    return data.nodes.filter(node => node.laneId === laneId);
  };

  return (
    <div className={`w-full h-full bg-white overflow-auto p-6 ${className || ''}`}>
      {/* 门禁展示 */}
      {data.gates && data.gates.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3">阶段门禁</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.gates.map((gate) => (
              <div key={gate.id} className="border-2 border-purple-500 rounded-lg p-3 bg-purple-50">
                <div className="font-semibold text-purple-900 mb-2">{gate.name}</div>
                <div className="text-xs space-y-1">
                  <div className="font-medium text-gray-700">验收标准：</div>
                  <ul className="list-disc list-inside text-gray-600">
                    {gate.criteria.map((criterion, idx) => (
                      <li key={idx}>{criterion}</li>
                    ))}
                  </ul>
                  {gate.evidence.length > 0 && (
                    <>
                      <div className="font-medium text-gray-700 mt-2">证据：</div>
                      <ul className="list-disc list-inside text-gray-600">
                        {gate.evidence.map((ev, idx) => (
                          <li key={idx}>{ev}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 泳道图 */}
      <div className="border rounded-lg overflow-hidden">
        <h3 className="font-semibold text-lg p-4 bg-gray-50 border-b">研发工作流</h3>

        <div className="relative">
          {data.lanes.map((lane, laneIdx) => {
            const laneNodes = getLaneNodes(lane.id);

            return (
              <div key={lane.id} className={`border-b last:border-b-0 ${laneIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                {/* 泳道标题 */}
                <div className="flex">
                  <div className="w-32 p-4 border-r bg-gradient-to-r from-blue-100 to-blue-50 flex items-center justify-center">
                    <div className="font-semibold text-sm text-blue-900 text-center">
                      {lane.name}
                    </div>
                  </div>

                  {/* 泳道内容 */}
                  <div className="flex-1 p-4">
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {laneNodes.length === 0 ? (
                        <div className="text-gray-400 text-sm italic">无任务</div>
                      ) : (
                        laneNodes.map((node, nodeIdx) => {
                          return (
                            <div key={node.id} className="flex items-center gap-2">
                              {/* 节点卡片 */}
                              <div className="border-2 border-blue-500 rounded-lg p-3 bg-white shadow-sm min-w-[200px] max-w-[280px]">
                                <div className="font-semibold text-sm text-gray-900 mb-2">
                                  {node.name}
                                </div>

                                {/* 输入 */}
                                {node.inputs.length > 0 && (
                                  <div className="mb-2">
                                    <div className="text-xs font-medium text-gray-600">输入：</div>
                                    <div className="text-xs text-gray-700">
                                      {node.inputs.join(', ')}
                                    </div>
                                  </div>
                                )}

                                {/* 输出 */}
                                {node.outputs.length > 0 && (
                                  <div className="mb-2">
                                    <div className="text-xs font-medium text-gray-600">输出：</div>
                                    <div className="text-xs text-gray-700">
                                      {node.outputs.join(', ')}
                                    </div>
                                  </div>
                                )}

                                {/* 验收标准 */}
                                {node.acceptance.length > 0 && (
                                  <div className="mb-2">
                                    <div className="text-xs font-medium text-gray-600">验收：</div>
                                    <ul className="text-xs text-gray-700 list-disc list-inside">
                                      {node.acceptance.map((acc, idx) => (
                                        <li key={idx}>{acc}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* 负责人和工期 */}
                                <div className="flex gap-2 text-xs text-gray-500 mt-2 pt-2 border-t">
                                  {node.ownerRole && <span>👤 {node.ownerRole}</span>}
                                  {node.durationEstimate && <span>⏱ {node.durationEstimate}</span>}
                                </div>
                              </div>

                              {/* 连接箭头 */}
                              {nodeIdx < laneNodes.length - 1 && (
                                <div className="text-blue-500 text-xl">→</div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 依赖关系说明 */}
      {data.edges.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-sm mb-2 text-gray-700">依赖关系</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {data.edges.map((edge, idx) => {
              const fromNode = data.nodes.find(n => n.id === edge.fromNodeId);
              const toNode = data.nodes.find(n => n.id === edge.toNodeId);

              const relationText = {
                depends_on: '依赖',
                produces: '产出',
                verifies: '验证',
              }[edge.relation];

              return (
                <div key={idx} className="border rounded p-2 bg-gray-50">
                  <span className="text-gray-700">{fromNode?.name || '?'}</span>
                  <span className="mx-2 text-blue-600">{relationText}</span>
                  <span className="text-gray-700">{toNode?.name || '?'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RDWorkflowGraph;
