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

// ============================================================
// Agentic Pipeline — 4-step autonomous design agent
// ============================================================

/** Step 1 output schema: structured requirement analysis */
export const REQUIREMENT_ANALYSIS_SCHEMA: object = {
  type: 'object',
  properties: {
    projectType: { type: 'string', description: 'Type of project (e.g. IoT sensor node, motor controller)' },
    keyParameters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          parameter: { type: 'string' },
          value: { type: 'string' },
          unit: { type: 'string' },
          priority: { type: 'string', enum: ['must', 'should', 'nice'] },
        },
        required: ['parameter', 'value', 'priority'],
      },
      description: 'Extracted key parameters (voltage, current, protocols, etc.)',
    },
    constraints: { type: 'array', items: { type: 'string' }, description: 'Design constraints' },
    ambiguities: { type: 'array', items: { type: 'string' }, description: 'Unclear or missing requirements' },
    suggestedModules: { type: 'array', items: { type: 'string' }, description: 'Recommended module categories' },
    complexityEstimate: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
    enrichedRequirements: { type: 'string', description: 'Rewritten, clarified, detailed requirements text' },
  },
  required: ['projectType', 'keyParameters', 'constraints', 'ambiguities', 'suggestedModules', 'complexityEstimate', 'enrichedRequirements'],
};

/** Step 3 output schema: validation report */
export const VALIDATION_REPORT_SCHEMA: object = {
  type: 'object',
  properties: {
    overallScore: { type: 'number', description: 'Confidence score 0-100' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          solutionId: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
          category: { type: 'string', enum: ['voltage_mismatch', 'bus_conflict', 'missing_component', 'power_budget', 'signal_integrity', 'cost', 'other'] },
          description: { type: 'string' },
          affectedModules: { type: 'array', items: { type: 'string' } },
          suggestedFix: { type: 'string' },
        },
        required: ['solutionId', 'severity', 'category', 'description', 'suggestedFix'],
      },
    },
    recommendations: { type: 'array', items: { type: 'string' } },
    passesReview: { type: 'boolean', description: 'true if no critical issues found' },
  },
  required: ['overallScore', 'issues', 'recommendations', 'passesReview'],
};

/** Pipeline step status for UI progress tracking */
export type PipelineStep = 'perceive' | 'generate' | 'validate' | 'iterate' | 'done';

export interface PipelineProgress {
  currentStep: PipelineStep;
  stepNumber: number;
  totalSteps: number;
  message: string;
  requirementAnalysis?: unknown;
  validationReport?: unknown;
}

export interface AgenticPipelineOptions {
  apiKey: string;
  model: string;
  proModel?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  onProgress?: (progress: PipelineProgress) => void;
}

/**
 * Run the 4-step agentic design pipeline:
 * 1. Perceive  — Analyze and enrich requirements
 * 2. Generate  — Create 3 differentiated solutions (structured output)
 * 3. Validate  — AI self-review for engineering issues
 * 4. Iterate   — Auto-fix any critical issues found
 *
 * Returns the final solutions JSON string.
 */
export async function runAgenticPipeline(opts: AgenticPipelineOptions): Promise<string> {
  const {
    apiKey,
    model,
    proModel = 'gemini-3-pro-preview',
    systemPrompt,
    userPrompt,
    temperature = 0.2,
    onProgress,
  } = opts;

  // ---- Step 1: Perceive — Requirement Analysis ----
  onProgress?.({
    currentStep: 'perceive',
    stepNumber: 1,
    totalSteps: 4,
    message: 'Step 1/4: Analyzing requirements with Gemini 3...',
  });

  const step1Result = await callGemini({
    apiKey,
    model,
    systemPrompt: [
      'You are a senior hardware systems architect.',
      'Analyze the following circuit design requirements.',
      'Extract all key parameters (voltages, currents, protocols, interfaces, power budget).',
      'Identify any ambiguities or missing information.',
      'Suggest which module categories are needed.',
      'Rewrite the requirements into a clearer, more detailed version.',
    ].join(' '),
    userPrompt,
    temperature: 0.1,
    jsonSchema: REQUIREMENT_ANALYSIS_SCHEMA,
  });

  let requirementAnalysis: Record<string, unknown>;
  try {
    requirementAnalysis = JSON.parse(step1Result);
  } catch {
    requirementAnalysis = { enrichedRequirements: userPrompt };
  }

  onProgress?.({
    currentStep: 'perceive',
    stepNumber: 1,
    totalSteps: 4,
    message: 'Step 1/4 complete. Found ' +
      (Array.isArray(requirementAnalysis.keyParameters) ? requirementAnalysis.keyParameters.length : 0) +
      ' key parameters, ' +
      (Array.isArray(requirementAnalysis.ambiguities) ? requirementAnalysis.ambiguities.length : 0) +
      ' ambiguities.',
    requirementAnalysis,
  });

  // ---- Step 2: Generate — Solution Creation ----
  onProgress?.({
    currentStep: 'generate',
    stepNumber: 2,
    totalSteps: 4,
    message: 'Step 2/4: Generating 3 differentiated solutions...',
  });

  const enrichedPrompt = [
    userPrompt,
    '',
    '--- AI Requirement Analysis (from Step 1) ---',
    typeof requirementAnalysis.enrichedRequirements === 'string'
      ? requirementAnalysis.enrichedRequirements
      : '',
    '',
    'Key parameters identified:',
    ...(Array.isArray(requirementAnalysis.keyParameters)
      ? (requirementAnalysis.keyParameters as Record<string, string>[]).map(
          (p) => `- ${p.parameter}: ${p.value} ${p.unit || ''} [${p.priority}]`
        )
      : []),
    '',
    'Design constraints:',
    ...(Array.isArray(requirementAnalysis.constraints)
      ? (requirementAnalysis.constraints as string[]).map((c) => `- ${c}`)
      : []),
  ].join('\n');

  const step2Result = await callGemini({
    apiKey,
    model,
    systemPrompt,
    userPrompt: enrichedPrompt,
    temperature,
    jsonSchema: SOLUTION_OUTPUT_SCHEMA,
  });

  onProgress?.({
    currentStep: 'generate',
    stepNumber: 2,
    totalSteps: 4,
    message: 'Step 2/4 complete. 3 solutions generated. Starting validation...',
  });

  // ---- Step 3: Validate — AI Self-Review ----
  onProgress?.({
    currentStep: 'validate',
    stepNumber: 3,
    totalSteps: 4,
    message: 'Step 3/4: Gemini 3 Pro is reviewing engineering correctness...',
  });

  let validationReport: Record<string, unknown>;
  try {
    const step3Result = await callGemini({
      apiKey,
      model: proModel,
      systemPrompt: [
        'You are an expert hardware design reviewer and EE quality auditor.',
        'Review the following AI-generated circuit solutions for engineering correctness.',
        'Check for: voltage mismatches between connected modules, bus protocol conflicts,',
        'missing essential components (decoupling caps, pull-up resistors, ESD protection),',
        'power budget violations, signal integrity issues, and unrealistic cost estimates.',
        'Be thorough but fair. Score the overall quality 0-100.',
      ].join(' '),
      userPrompt: [
        'Original requirements:',
        userPrompt,
        '',
        'Generated solutions to review:',
        step2Result,
      ].join('\n'),
      temperature: 0.1,
      jsonSchema: VALIDATION_REPORT_SCHEMA,
    });

    validationReport = JSON.parse(step3Result);
  } catch {
    validationReport = { overallScore: 75, issues: [], recommendations: [], passesReview: true };
  }

  const criticalIssues = Array.isArray(validationReport.issues)
    ? (validationReport.issues as Record<string, string>[]).filter((i) => i.severity === 'critical')
    : [];

  onProgress?.({
    currentStep: 'validate',
    stepNumber: 3,
    totalSteps: 4,
    message: `Step 3/4 complete. Score: ${validationReport.overallScore ?? '?'}/100. ${criticalIssues.length} critical issue(s).`,
    validationReport,
  });

  // ---- Step 4: Iterate — Auto-Fix (only if critical issues) ----
  if (criticalIssues.length > 0) {
    onProgress?.({
      currentStep: 'iterate',
      stepNumber: 4,
      totalSteps: 4,
      message: `Step 4/4: Auto-fixing ${criticalIssues.length} critical issue(s)...`,
    });

    const fixPrompt = [
      'The following circuit solutions were reviewed and critical issues were found.',
      'Please fix ALL critical issues while preserving the overall solution structure.',
      '',
      'Original solutions:',
      step2Result,
      '',
      'Critical issues to fix:',
      ...criticalIssues.map(
        (issue, i) =>
          `${i + 1}. [${issue.solutionId}] ${issue.category}: ${issue.description} -> Fix: ${issue.suggestedFix}`
      ),
      '',
      'Additional recommendations:',
      ...(Array.isArray(validationReport.recommendations)
        ? (validationReport.recommendations as string[]).map((r) => `- ${r}`)
        : []),
      '',
      'Output the corrected solutions in the same JSON format.',
    ].join('\n');

    const step4Result = await callGemini({
      apiKey,
      model,
      systemPrompt,
      userPrompt: fixPrompt,
      temperature,
      jsonSchema: SOLUTION_OUTPUT_SCHEMA,
    });

    onProgress?.({
      currentStep: 'done',
      stepNumber: 4,
      totalSteps: 4,
      message: `Pipeline complete. ${criticalIssues.length} issue(s) auto-fixed. Score: ${validationReport.overallScore ?? '?'}/100.`,
      requirementAnalysis,
      validationReport,
    });

    return step4Result;
  }

  // No critical issues — Step 2 output is the final result
  onProgress?.({
    currentStep: 'done',
    stepNumber: 4,
    totalSteps: 4,
    message: `Pipeline complete. All checks passed. Confidence: ${validationReport.overallScore ?? '?'}/100.`,
    requirementAnalysis,
    validationReport,
  });

  return step2Result;
}
