import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SITE_SOURCES,
  addCustomSiteSource,
  updateSiteSource,
  deleteSiteSource,
  normalizeSiteSources,
  getEnabledSiteSources,
  type AiSiteSource,
} from './siteSources';

describe('siteSources', () => {
  it('should provide default AI site sources', () => {
    expect(DEFAULT_SITE_SOURCES.length).toBeGreaterThanOrEqual(6);
    const ids = DEFAULT_SITE_SOURCES.map((s) => s.id);
    expect(ids).toContain('chatgpt');
    expect(ids).toContain('claude');
    expect(ids).toContain('deepseek');
    expect(ids).toContain('gemini');
  });

  it('should add a valid custom site source', () => {
    const initial: AiSiteSource[] = [...DEFAULT_SITE_SOURCES];
    const newSource = addCustomSiteSource(initial, {
      name: 'Custom WebUI',
      url: 'http://localhost:8080',
      color: '#00AAFF',
    });

    expect(newSource.isCustom).toBe(true);
    expect(newSource.enabled).toBe(true);
    expect(newSource.name).toBe('Custom WebUI');
    expect(newSource.url).toBe('http://localhost:8080');
    expect(newSource.id).toMatch(/^custom-/);
  });

  it('should reject invalid custom site source without name or url', () => {
    const initial: AiSiteSource[] = [...DEFAULT_SITE_SOURCES];
    expect(() =>
      addCustomSiteSource(initial, {
        name: '',
        url: 'http://localhost:8080',
        color: '#00AAFF',
      })
    ).toThrow('Source name and URL are required');
  });

  it('should update an existing site source', () => {
    const initial: AiSiteSource[] = [...DEFAULT_SITE_SOURCES];
    const updated = updateSiteSource(initial, 'chatgpt', { enabled: false });
    const target = updated.find((s) => s.id === 'chatgpt');
    expect(target?.enabled).toBe(false);
  });

  it('should delete a custom site source but protect built-in sources', () => {
    const initial: AiSiteSource[] = [
      ...DEFAULT_SITE_SOURCES,
      {
        id: 'custom-1',
        name: 'My Model',
        url: 'https://example.com',
        color: '#123456',
        enabled: true,
        isCustom: true,
      },
    ];

    // Deleting custom source succeeds
    const afterDelete = deleteSiteSource(initial, 'custom-1');
    expect(afterDelete.find((s) => s.id === 'custom-1')).toBeUndefined();

    // Deleting built-in source throws error
    expect(() => deleteSiteSource(initial, 'chatgpt')).toThrow(
      'Cannot delete built-in site source'
    );
  });

  it('should normalize site sources fallback if corrupted', () => {
    expect(normalizeSiteSources(null)).toEqual(DEFAULT_SITE_SOURCES);
    expect(normalizeSiteSources([])).toEqual(DEFAULT_SITE_SOURCES);
    expect(normalizeSiteSources('invalid')).toEqual(DEFAULT_SITE_SOURCES);
  });

  it('should filter enabled site sources correctly', () => {
    const mixed: AiSiteSource[] = [
      {
        id: 's1',
        name: 'S1',
        url: 'https://s1.com',
        color: '#111',
        enabled: true,
        isCustom: false,
      },
      {
        id: 's2',
        name: 'S2',
        url: 'https://s2.com',
        color: '#222',
        enabled: false,
        isCustom: false,
      },
    ];
    const enabled = getEnabledSiteSources(mixed);
    expect(enabled.length).toBe(1);
    expect(enabled[0].id).toBe('s1');
  });
});
