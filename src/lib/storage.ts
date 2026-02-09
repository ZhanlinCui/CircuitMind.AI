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

const DEFAULT_AI_CONFIG: AiConfig = {
  provider: 'gemini',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  apiKey: 'AIzaSyAQckzDi-6lagl6m1eTTqhNuEx6zJyU-gk',
  model: 'gemini-3-flash-preview',
  temperature: 0.2,
};

export function loadAiConfig(): AiConfig | undefined {
  const saved = loadFromLocalStorage<AiConfig>(AI_CONFIG_STORAGE_KEY);
  if (saved && saved.apiKey) return saved;
  // Auto-initialize with demo key for hackathon judges
  saveToLocalStorage(AI_CONFIG_STORAGE_KEY, DEFAULT_AI_CONFIG);
  return DEFAULT_AI_CONFIG;
}

export function saveAiConfig(config: AiConfig): void {
  saveToLocalStorage(AI_CONFIG_STORAGE_KEY, config);
}
