import { describe, it, expect, vi } from 'vitest';
import {
  DEFAULT_LLM_CONFIG,
  testLlmConnection,
  sendChatCompletion,
  type LlmApiConfig,
} from './llmApi';

describe('llmApi', () => {
  it('should provide sensible default LLM configuration', () => {
    expect(DEFAULT_LLM_CONFIG.provider).toBe('openai');
    expect(DEFAULT_LLM_CONFIG.baseUrl).toBe('https://api.openai.com/v1');
    expect(DEFAULT_LLM_CONFIG.temperature).toBe(0.7);
  });

  it('should validate missing baseUrl or model when testing connection', async () => {
    const invalidConfig: LlmApiConfig = {
      provider: 'openai',
      baseUrl: '',
      apiKey: '',
      model: '',
      temperature: 0.7,
    };

    const res = await testLlmConnection(invalidConfig);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Base URL and Model name are required');
  });

  it('should handle successful connection test for OpenAI provider', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'pong' } }],
      }),
    });

    const config: LlmApiConfig = {
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test',
      model: 'gpt-4o-mini',
      temperature: 0.7,
    };

    const res = await testLlmConnection(config, mockFetch as unknown as typeof fetch);
    expect(res.success).toBe(true);
    expect(res.message).toContain('Connected successfully');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      }),
    );
  });

  it('should handle API authentication failure gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid API key provided',
    });

    const config: LlmApiConfig = {
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-invalid',
      model: 'gpt-4o-mini',
      temperature: 0.7,
    };

    const res = await testLlmConnection(config, mockFetch as unknown as typeof fetch);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Unauthorized (401)');
  });

  it('should send chat completion and return content', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'Optimized response text' } }],
      }),
    });

    const config: LlmApiConfig = {
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test',
      model: 'gpt-4o-mini',
      temperature: 0.7,
    };

    const reply = await sendChatCompletion(
      config,
      [{ role: 'user', content: 'hello' }],
      mockFetch as unknown as typeof fetch,
    );

    expect(reply).toBe('Optimized response text');
  });

  it('should support local Ollama connection and payload structure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: { content: 'ollama response' },
      }),
    });

    const config: LlmApiConfig = {
      provider: 'ollama',
      baseUrl: 'http://localhost:11434',
      apiKey: '',
      model: 'llama3:latest',
      temperature: 0.7,
    };

    const reply = await sendChatCompletion(
      config,
      [{ role: 'user', content: 'test local' }],
      mockFetch as unknown as typeof fetch,
    );

    expect(reply).toBe('ollama response');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });
});

