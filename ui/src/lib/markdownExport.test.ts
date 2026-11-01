import { describe, it, expect } from 'vitest';
import {
  formatSingleViewportMarkdown,
  formatAllViewportsMarkdown,
  sanitizeFilename,
} from './markdownExport';

describe('markdownExport', () => {
  it('should format single viewport messages into structured markdown', () => {
    const md = formatSingleViewportMarkdown({
      modelName: 'ChatGPT',
      messages: ['Hello world', '```ts\nconst x = 1;\n```'],
      timestamp: '2026-11-01T20:00:00Z',
    });

    expect(md).toContain('# Aimux Conversation Export - ChatGPT');
    expect(md).toContain('**Model**: ChatGPT');
    expect(md).toContain('**Export Time**: 2026-11-01T20:00:00Z');
    expect(md).toContain('Hello world');
    expect(md).toContain('```ts\nconst x = 1;\n```');
  });

  it('should handle empty messages gracefully', () => {
    const md = formatSingleViewportMarkdown({
      modelName: 'Claude',
      messages: [],
      timestamp: '2026-11-01T20:00:00Z',
    });

    expect(md).toContain('*No conversation records recorded.*');
  });

  it('should format all viewports into unified markdown report', () => {
    const viewports = [
      { modelName: 'ChatGPT', messages: ['Prompt 1'] },
      { modelName: 'DeepSeek', messages: ['Response 1', 'Response 2'] },
    ];
    const md = formatAllViewportsMarkdown(viewports, '2026-11-01T20:00:00Z');

    expect(md).toContain('# Aimux Multi-Viewport Workspace Export');
    expect(md).toContain('## 1. ChatGPT');
    expect(md).toContain('## 2. DeepSeek');
    expect(md).toContain('Prompt 1');
    expect(md).toContain('Response 2');
  });

  it('should sanitize filename for cross-platform safe file saving', () => {
    expect(sanitizeFilename('aimux:export/2026*?.md')).toBe('aimux-export-2026--.md');
  });
});
