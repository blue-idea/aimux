export interface AiSiteSource {
  id: string;
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  isCustom: boolean;
  notes?: string;
}

export const DEFAULT_SITE_SOURCES: AiSiteSource[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com',
    color: '#10A37F',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai',
    color: '#E07A4F',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com',
    color: '#38BDF8',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com',
    color: '#FACC15',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'kimi',
    name: 'Kimi',
    url: 'https://kimi.moonshot.cn',
    color: '#2DD4BF',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    url: 'https://www.perplexity.ai',
    color: '#A3E635',
    enabled: true,
    isCustom: false,
  },
];

const SITE_SOURCES_STORAGE_KEY = 'aimux_site_sources';

/**
 * 添加自定义 AI 站点源
 */
export function addCustomSiteSource(
  sources: AiSiteSource[],
  input: { name: string; url: string; color?: string; notes?: string },
): AiSiteSource {
  const name = input.name.trim();
  const url = input.url.trim();

  if (!name || !url) {
    throw new Error('Source name and URL are required');
  }

  const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newSource: AiSiteSource = {
    id,
    name,
    url,
    color: input.color?.trim() || '#38BDF8',
    enabled: true,
    isCustom: true,
    notes: input.notes?.trim(),
  };

  sources.push(newSource);
  return newSource;
}

/**
 * 更新现有 AI 站点源
 */
export function updateSiteSource(
  sources: AiSiteSource[],
  id: string,
  updates: Partial<Omit<AiSiteSource, 'id' | 'isCustom'>>,
): AiSiteSource[] {
  return sources.map((source) => {
    if (source.id === id) {
      return {
        ...source,
        ...updates,
      };
    }
    return source;
  });
}

/**
 * 删除自定义站点源（内置源受保护不可删除）
 */
export function deleteSiteSource(sources: AiSiteSource[], id: string): AiSiteSource[] {
  const target = sources.find((s) => s.id === id);
  if (!target) {
    return sources;
  }
  if (!target.isCustom) {
    throw new Error('Cannot delete built-in site source');
  }
  return sources.filter((s) => s.id !== id);
}

/**
 * 校验并规范化站点源数据，若损坏则安全降级回默认源
 */
export function normalizeSiteSources(raw: unknown): AiSiteSource[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [...DEFAULT_SITE_SOURCES];
  }

  const validSources: AiSiteSource[] = [];
  for (const item of raw) {
    if (
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.url === 'string'
    ) {
      validSources.push({
        id: item.id,
        name: item.name,
        url: item.url,
        color: typeof item.color === 'string' ? item.color : '#38BDF8',
        enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
        isCustom: typeof item.isCustom === 'boolean' ? item.isCustom : true,
        notes: typeof item.notes === 'string' ? item.notes : undefined,
      });
    }
  }

  if (validSources.length === 0) {
    return [...DEFAULT_SITE_SOURCES];
  }

  // 保证内置默认源不丢失
  for (const def of DEFAULT_SITE_SOURCES) {
    if (!validSources.some((s) => s.id === def.id)) {
      validSources.push(def);
    }
  }

  return validSources;
}

/**
 * 从本地存储加载 AI 站点源
 */
export function loadSiteSources(): AiSiteSource[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [...DEFAULT_SITE_SOURCES];
  }
  try {
    const raw = window.localStorage.getItem(SITE_SOURCES_STORAGE_KEY);
    if (!raw) return [...DEFAULT_SITE_SOURCES];
    return normalizeSiteSources(JSON.parse(raw));
  } catch {
    return [...DEFAULT_SITE_SOURCES];
  }
}

/**
 * 获取当前所有已启用的站点源
 */
export function getEnabledSiteSources(sources?: AiSiteSource[]): AiSiteSource[] {
  const list = sources || loadSiteSources();
  return list.filter((s) => s.enabled);
}

/**
 * 保存 AI 站点源至本地存储
 */
export function saveSiteSources(sources: AiSiteSource[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(SITE_SOURCES_STORAGE_KEY, JSON.stringify(sources));
  } catch {
    // 忽略存储异常
  }
}

