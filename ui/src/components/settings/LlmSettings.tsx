import { useState, useEffect } from 'react';
import { Bot, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import {
  type LlmApiConfig,
  type LlmProviderType,
  loadLlmConfig,
  saveLlmConfig,
  testLlmConnection,
  DEFAULT_LLM_CONFIG,
} from '@/lib/llmApi';

const PRESETS = [
  {
    name: 'OpenAI (Official)',
    provider: 'openai' as LlmProviderType,
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  {
    name: 'DeepSeek (Official)',
    provider: 'openai' as LlmProviderType,
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
  {
    name: 'Ollama (Local default)',
    provider: 'ollama' as LlmProviderType,
    baseUrl: 'http://localhost:11434',
    model: 'llama3:latest',
  },
  {
    name: 'LM Studio (Local /v1)',
    provider: 'openai' as LlmProviderType,
    baseUrl: 'http://localhost:1234/v1',
    model: 'local-model',
  },
];

export function LlmSettings() {
  const [config, setConfig] = useState<LlmApiConfig>(DEFAULT_LLM_CONFIG);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    setConfig(loadLlmConfig());
  }, []);

  function handlePreset(preset: (typeof PRESETS)[number]) {
    setConfig((prev) => ({
      ...prev,
      provider: preset.provider,
      baseUrl: preset.baseUrl,
      model: preset.model,
    }));
    setTestResult(null);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testLlmConnection(config);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Connection failed',
      });
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    saveLlmConfig(config);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">LLM API Service</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Configure third-party (OpenAI/DeepSeek) or local (Ollama/LM Studio) LLM endpoints for
            prompt assistance.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
        >
          {savedMessage ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Quick Presets */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Quick Endpoint Presets
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handlePreset(p)}
              className="rounded-lg border border-[rgb(var(--ink-rgb)/0.12)] bg-[rgb(var(--ink-rgb)/0.03)] px-3 py-1.5 text-xs text-[var(--text)] transition hover:bg-[rgb(var(--ink-rgb)/0.08)]"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Form Settings */}
      <div className="flex flex-col gap-4 rounded-xl border border-[rgb(var(--ink-rgb)/0.1)] p-4 bg-[rgb(var(--surface-rgb)/0.5)]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-[var(--muted)]">Provider Type</label>
            <select
              value={config.provider}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  provider: e.target.value as LlmProviderType,
                }))
              }
              className="mt-1 w-full rounded-lg border border-[rgb(var(--ink-rgb)/0.12)] bg-[rgb(var(--ink-rgb)/0.04)] px-3 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="openai">
                OpenAI Compatible (OpenAI, DeepSeek, OpenRouter, LM Studio)
              </option>
              <option value="ollama">Ollama (Local /api/chat)</option>
              <option value="custom">Custom Endpoint</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--muted)]">Model Name</label>
            <input
              type="text"
              placeholder="e.g. gpt-4o-mini, deepseek-chat, llama3:latest"
              value={config.model}
              onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[rgb(var(--ink-rgb)/0.12)] bg-[rgb(var(--ink-rgb)/0.04)] px-3 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--muted)]">Base URL</label>
          <input
            type="text"
            placeholder="https://api.openai.com/v1 or http://localhost:11434"
            value={config.baseUrl}
            onChange={(e) => setConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[rgb(var(--ink-rgb)/0.12)] bg-[rgb(var(--ink-rgb)/0.04)] px-3 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--muted)]">API Key</label>
          <input
            type="password"
            placeholder="sk-... (Leave empty for local models like Ollama)"
            value={config.apiKey}
            onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[rgb(var(--ink-rgb)/0.12)] bg-[rgb(var(--ink-rgb)/0.04)] px-3 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--muted)]">
              Temperature:{' '}
              <span className="font-mono text-[var(--text)]">{config.temperature}</span>
            </label>
          </div>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.1"
            value={config.temperature}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))
            }
            className="mt-2 w-full cursor-pointer accent-[var(--accent)]"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[rgb(var(--ink-rgb)/0.08)]">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 rounded-lg border border-[rgb(var(--ink-rgb)/0.15)] bg-[rgb(var(--ink-rgb)/0.04)] px-3.5 py-1.5 text-xs font-medium text-[var(--text)] transition hover:bg-[rgb(var(--ink-rgb)/0.08)] disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
                <span>Testing Connection...</span>
              </>
            ) : (
              <>
                <Bot className="h-3.5 w-3.5" />
                <span>Test Connection</span>
              </>
            )}
          </button>

          {testResult && (
            <div className="flex items-center gap-1.5 text-xs">
              {testResult.success ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{testResult.message}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="max-w-[320px] truncate" title={testResult.error}>
                    {testResult.error}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
