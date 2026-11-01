export type LlmProviderType = 'openai' | 'ollama' | 'custom';

export interface LlmApiConfig {
  provider: LlmProviderType;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmConnectionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export const DEFAULT_LLM_CONFIG: LlmApiConfig = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.7,
};

const LLM_STORAGE_KEY = 'aimux_llm_config';

/**
 * 格式化 Base URL，消除末尾冗余的斜杠
 */
function cleanBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/**
 * 校验并测试 LLM API 连通性
 */
export async function testLlmConnection(
  config: LlmApiConfig,
  fetchImpl: typeof fetch = fetch
): Promise<LlmConnectionResult> {
  const baseUrl = cleanBaseUrl(config.baseUrl);
  const model = config.model.trim();

  if (!baseUrl || !model) {
    return {
      success: false,
      error: 'Base URL and Model name are required',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    if (config.provider === 'ollama' && !baseUrl.endsWith('/v1')) {
      const endpoint = `${baseUrl}/api/chat`;
      const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'ping' }],
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return {
          success: false,
          error: `HTTP error ${res.status} (${res.statusText}): ${text || 'Failed to connect to Ollama'}`,
        };
      }

      return {
        success: true,
        message: `Connected successfully to Ollama model '${model}'.`,
      };
    }

    // OpenAI 兼容接口（包括 DeepSeek, OpenAI, LM Studio, Ollama /v1 等）
    const endpoint = `${baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.apiKey.trim()) {
      headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
    }

    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
        temperature: config.temperature,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      if (res.status === 401) {
        return {
          success: false,
          error: 'Unauthorized (401): Invalid API Key or authentication failed.',
        };
      }
      const text = await res.text().catch(() => '');
      return {
        success: false,
        error: `HTTP error ${res.status} (${res.statusText}): ${text || 'Connection failed'}`,
      };
    }

    return {
      success: true,
      message: `Connected successfully to model '${model}'.`,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        error: 'Connection timed out after 15 seconds. Please check your URL and network.',
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown connection error occurred',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 发送 Chat Completion 请求并提取生成文本
 */
export async function sendChatCompletion(
  config: LlmApiConfig,
  messages: ChatMessage[],
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const baseUrl = cleanBaseUrl(config.baseUrl);
  const model = config.model.trim();

  if (!baseUrl || !model) {
    throw new Error('Base URL and Model name are required in LLM settings.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    if (config.provider === 'ollama' && !baseUrl.endsWith('/v1')) {
      const endpoint = `${baseUrl}/api/chat`;
      const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: { temperature: config.temperature },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Ollama request failed (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      return data?.message?.content || '';
    }

    // OpenAI 兼容请求
    const endpoint = `${baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.apiKey.trim()) {
      headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
    }

    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: config.temperature,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`LLM API request failed (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Invalid response structure received from LLM API.');
    }
    return content;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 校验并规范化 LLM 配置
 */
export function normalizeLlmConfig(raw: unknown): LlmApiConfig {
  if (typeof raw !== 'object' || raw === null) {
    return { ...DEFAULT_LLM_CONFIG };
  }
  const r = raw as Record<string, unknown>;
  const provider = r.provider === 'ollama' || r.provider === 'custom' ? r.provider : 'openai';
  const baseUrl = typeof r.baseUrl === 'string' ? r.baseUrl : DEFAULT_LLM_CONFIG.baseUrl;
  const apiKey = typeof r.apiKey === 'string' ? r.apiKey : '';
  const model = typeof r.model === 'string' ? r.model : DEFAULT_LLM_CONFIG.model;
  const temp = typeof r.temperature === 'number' ? Math.max(0, Math.min(2, r.temperature)) : 0.7;

  return {
    provider,
    baseUrl,
    apiKey,
    model,
    temperature: temp,
  };
}

/**
 * 从本地存储加载 LLM 配置
 */
export function loadLlmConfig(): LlmApiConfig {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_LLM_CONFIG };
  }
  try {
    const raw = window.localStorage.getItem(LLM_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LLM_CONFIG };
    return normalizeLlmConfig(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_LLM_CONFIG };
  }
}

/**
 * 保存 LLM 配置到本地存储
 */
export function saveLlmConfig(config: LlmApiConfig): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // 忽略存储异常
  }
}
