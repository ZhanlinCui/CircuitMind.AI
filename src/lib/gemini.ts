/**
 * Gemini 3 API client for CircuitMind.
 * Supports multimodal input, structured output (JSON Schema), and streaming.
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ---- Types ----

export type GeminiTextPart = { text: string };
export type GeminiInlineDataPart = { inlineData: { mimeType: string; data: string } };
export type GeminiPart = GeminiTextPart | GeminiInlineDataPart;

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface GeminiRequest {
  systemInstruction?: { parts: GeminiTextPart[] };
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
    responseSchema?: object;
  };
}

export interface GeminiCandidate {
  content: { parts: GeminiTextPart[]; role: string };
  finishReason: string;
}

export interface GeminiResponse {
  candidates: GeminiCandidate[];
}

// ---- Core API call ----

export interface CallGeminiOptions {
  apiKey: string;
  model: string;
  systemPrompt?: string;
  userPrompt: string;
  images?: { mimeType: string; base64: string }[];
  temperature?: number;
  maxOutputTokens?: number;
  jsonSchema?: object;
}

export async function callGemini(opts: CallGeminiOptions): Promise<string> {
  const {
    apiKey,
    model,
    systemPrompt,
    userPrompt,
    images,
    temperature = 0.2,
    maxOutputTokens = 65536,
    jsonSchema,
  } = opts;

  const endpoint = `${GEMINI_BASE}/models/${model}:generateContent`;

  // Build user parts: images first, then text
  const userParts: GeminiPart[] = [];
  if (images && images.length > 0) {
    for (const img of images) {
      userParts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
    }
  }
  userParts.push({ text: userPrompt });

  const body: GeminiRequest = {
    contents: [{ role: 'user', parts: userParts }],
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  };

  // System instruction
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  // Structured output
  if (jsonSchema && body.generationConfig) {
    body.generationConfig.responseMimeType = 'application/json';
    body.generationConfig.responseSchema = jsonSchema;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Gemini API error ${response.status}: ${errorBody.slice(0, 500)}`);
  }

  const data: GeminiResponse = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Gemini returned no candidates');
  }

  const parts = data.candidates[0].content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error('Gemini returned empty content');
  }

  return parts.map((p) => p.text).join('');
}

// ---- Test connection ----

export async function testGeminiConnection(apiKey: string, model: string): Promise<void> {
  await callGemini({
    apiKey,
    model,
    userPrompt: 'Respond with exactly: ok',
    temperature: 0,
    maxOutputTokens: 8,
  });
}

// ---- Solution generation JSON Schema ----
// This schema ensures Gemini 3 returns strictly typed JSON matching ProjectSolution[]

export const SOLUTION_OUTPUT_SCHEMA: object = {
  type: 'object',
  properties: {
    assumptions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Global assumptions shared by all solutions',
    },
    solutions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          positioning: { type: 'string' },
          costRange: { type: 'string' },
          durationRange: { type: 'string' },
          riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
          highlights: { type: 'array', items: { type: 'string' } },
          tradeoffs: { type: 'array', items: { type: 'string' } },
          assumptions: { type: 'array', items: { type: 'string' } },
          modules: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                summary: { type: 'string' },
                inputs: { type: 'array', items: { type: 'string' } },
                outputs: { type: 'array', items: { type: 'string' } },
                dependencies: { type: 'array', items: { type: 'string' } },
                complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
                risks: { type: 'array', items: { type: 'string' } },
              },
              required: ['id', 'name', 'summary', 'inputs', 'outputs', 'dependencies', 'complexity', 'risks'],
            },
          },
          edges: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                source: { type: 'string' },
                target: { type: 'string' },
                kind: { type: 'string' },
                contract: { type: 'string' },
                criticality: { type: 'string' },
              },
              required: ['source', 'target', 'kind', 'contract', 'criticality'],
            },
          },
          architectureL1: {
            type: 'object',
            properties: {
              nodes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    label: { type: 'string' },
                    nodeType: { type: 'string', enum: ['group', 'module', 'submodule'] },
                    parentId: { type: 'string' },
                    summary: { type: 'string' },
                    category: { type: 'string' },
                    ports: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          kind: { type: 'string' },
                          direction: { type: 'string', enum: ['in', 'out', 'bidirectional'] },
                          voltage: { type: 'string' },
                          maxCurrent: { type: 'string' },
                          busType: { type: 'string' },
                        },
                        required: ['id', 'name', 'kind', 'direction'],
                      },
                    },
                  },
                  required: ['id', 'label', 'nodeType'],
                },
              },
              edges: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    from: {
                      type: 'object',
                      properties: { nodeId: { type: 'string' }, portId: { type: 'string' } },
                      required: ['nodeId'],
                    },
                    to: {
                      type: 'object',
                      properties: { nodeId: { type: 'string' }, portId: { type: 'string' } },
                      required: ['nodeId'],
                    },
                    type: { type: 'string' },
                    protocolOrSignal: { type: 'string' },
                    criticality: { type: 'string', enum: ['low', 'medium', 'high'] },
                  },
                  required: ['id', 'from', 'to', 'type', 'protocolOrSignal', 'criticality'],
                },
              },
            },
            required: ['nodes', 'edges'],
          },
          rdWorkflow: {
            type: 'object',
            properties: {
              lanes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { id: { type: 'string' }, name: { type: 'string' } },
                  required: ['id', 'name'],
                },
              },
              nodes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    laneId: { type: 'string' },
                    name: { type: 'string' },
                    inputs: { type: 'array', items: { type: 'string' } },
                    outputs: { type: 'array', items: { type: 'string' } },
                    acceptance: { type: 'array', items: { type: 'string' } },
                    ownerRole: { type: 'string' },
                    durationEstimate: { type: 'string' },
                  },
                  required: ['id', 'laneId', 'name', 'inputs', 'outputs', 'acceptance'],
                },
              },
              edges: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    fromNodeId: { type: 'string' },
                    toNodeId: { type: 'string' },
                    relation: { type: 'string', enum: ['depends_on', 'produces', 'verifies'] },
                  },
                  required: ['fromNodeId', 'toNodeId', 'relation'],
                },
              },
              gates: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    criteria: { type: 'array', items: { type: 'string' } },
                    evidence: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['id', 'name', 'criteria', 'evidence'],
                },
              },
            },
            required: ['lanes', 'nodes', 'edges', 'gates'],
          },
          milestones: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                deliverables: { type: 'array', items: { type: 'string' } },
                timeframe: { type: 'string' },
              },
              required: ['name', 'deliverables', 'timeframe'],
            },
          },
          assets: {
            type: 'object',
            properties: {
              flow: { type: 'string' },
              ia: { type: 'string' },
              wireframes: { type: 'array', items: { type: 'string' } },
            },
            required: ['flow', 'ia', 'wireframes'],
          },
          openQuestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                question: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                category: { type: 'string' },
              },
              required: ['id', 'question'],
            },
          },
        },
        required: ['id', 'name', 'positioning', 'costRange', 'durationRange', 'riskLevel', 'highlights', 'tradeoffs', 'assumptions', 'modules', 'edges', 'architectureL1', 'rdWorkflow', 'milestones', 'assets', 'openQuestions'],
      },
    },
  },
  required: ['assumptions', 'solutions'],
};

// ---- Sketch analysis JSON Schema ----

export const SKETCH_ANALYSIS_SCHEMA: object = {
  type: 'object',
  properties: {
    projectName: { type: 'string', description: 'Suggested project name based on the sketch' },
    description: { type: 'string', description: 'Brief project description' },
    requirementsText: { type: 'string', description: 'Detailed requirements text extracted from the sketch' },
    modules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string', enum: ['power', 'mcu', 'sensor', 'interface', 'glue', 'other'] },
        },
        required: ['id', 'name', 'category'],
      },
      description: 'Identified circuit modules/components',
    },
    connections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fromModuleId: { type: 'string' },
          toModuleId: { type: 'string' },
          type: { type: 'string', enum: ['power', 'bus', 'io'] },
          label: { type: 'string' },
        },
        required: ['fromModuleId', 'toModuleId', 'type', 'label'],
      },
      description: 'Connections between modules',
    },
  },
  required: ['projectName', 'description', 'requirementsText', 'modules', 'connections'],
};

// ---- Smart generate (one-liner -> full project) JSON Schema ----

export const SMART_GENERATE_SCHEMA: object = {
  type: 'object',
  properties: {
    projectName: { type: 'string' },
    description: { type: 'string' },
    requirementsText: { type: 'string', description: 'Detailed circuit design requirements' },
    modules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string', enum: ['power', 'mcu', 'sensor', 'interface', 'glue', 'other'] },
        },
        required: ['id', 'name', 'category'],
      },
    },
    connections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fromModuleId: { type: 'string' },
          toModuleId: { type: 'string' },
          type: { type: 'string', enum: ['power', 'bus', 'io'] },
          label: { type: 'string' },
        },
        required: ['fromModuleId', 'toModuleId', 'type', 'label'],
      },
    },
  },
  required: ['projectName', 'description', 'requirementsText', 'modules', 'connections'],
};
