export function safeJsonParse<T>(value: string): T | undefined {
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

export function loadFromLocalStorage<T>(key: string): T | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return undefined;
  }
  return safeJsonParse<T>(raw);
}

export function saveToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeFromLocalStorage(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(key);
}

export type AiProvider = 'openai' | 'anthropic' | 'gemini';

export interface AiConfig {
  provider: AiProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
  lastTestOk?: boolean;
  lastTestedAt?: number;
  lastTestError?: string;
}

const AI_CONFIG_STORAGE_KEY = 'pcbtool.aiConfig.v1';

export function loadAiConfig(): AiConfig | undefined {
  return loadFromLocalStorage<AiConfig>(AI_CONFIG_STORAGE_KEY);
}

export function saveAiConfig(config: AiConfig): void {
  saveToLocalStorage(AI_CONFIG_STORAGE_KEY, config);
}
