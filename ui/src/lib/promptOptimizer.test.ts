import { describe, it, expect, vi } from 'vitest';
import { optimizePrompt, expandPrompt } from './promptOptimizer';
import type { LlmApiConfig } from './llmApi';

describe('promptOptimizer', () => {
  const dummyConfig: LlmApiConfig = {
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-test',
    model: 'gpt-4o-mini',
    temperature: 0.7,
  };

  it('should throw an error if the input prompt is empty', async () => {
    await expect(optimizePrompt('', dummyConfig)).rejects.toThrow('Prompt text cannot be empty');
    await expect(expandPrompt('   ', dummyConfig)).rejects.toThrow('Prompt text cannot be empty');
  });

  it('should call completion with optimization prompt and return polished text', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'Act as an expert developer...' } }],
      }),
    });

    const result = await optimizePrompt(
      'write a python function',
      dummyConfig,
      mockFetch as unknown as typeof fetch
    );

    expect(result).toBe('Act as an expert developer...');
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should call completion with expansion prompt and return detailed text', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'Detailed background, objectives, and steps...' } }],
      }),
    });

    const result = await expandPrompt(
      'explain react hooks',
      dummyConfig,
      mockFetch as unknown as typeof fetch
    );

    expect(result).toBe('Detailed background, objectives, and steps...');
    expect(mockFetch).toHaveBeenCalled();
  });
});
