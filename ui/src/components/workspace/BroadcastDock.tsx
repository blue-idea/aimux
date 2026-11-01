import { useState, type RefObject } from 'react';
import {
  Eraser,
  Loader2,
  Maximize2,
  PanelBottom,
  PictureInPicture2,
  Send,
  Sparkles,
} from 'lucide-react';
import { useSettings } from '@/contexts/settingsContext';
import type { DockMode } from '@/lib/settings';
import { loadLlmConfig } from '@/lib/llmApi';
import { optimizePrompt, expandPrompt } from '@/lib/promptOptimizer';

interface BroadcastDockProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  targetCount: number;
  textareaRef: RefObject<HTMLTextAreaElement>;
  dockMode: DockMode;
  onToggleMode: () => void;
}

export function BroadcastDock({
  draft,
  onDraftChange,
  onSend,
  targetCount,
  textareaRef,
  dockMode,
  onToggleMode,
}: BroadcastDockProps) {
  const { t } = useSettings();
  const [loadingAction, setLoadingAction] = useState<'optimize' | 'expand' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSend = draft.trim().length > 0;
  const modeLabel = dockMode === 'docked' ? t('dock.float') : t('dock.dock');
  const ModeIcon = dockMode === 'docked' ? PictureInPicture2 : PanelBottom;

  async function handleOptimize() {
    if (!canSend) return;
    setLoadingAction('optimize');
    setErrorMessage(null);
    try {
      const config = loadLlmConfig();
      const optimized = await optimizePrompt(draft, config);
      onDraftChange(optimized);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleExpand() {
    if (!canSend) return;
    setLoadingAction('expand');
    setErrorMessage(null);
    try {
      const config = loadLlmConfig();
      const expanded = await expandPrompt(draft, config);
      onDraftChange(expanded);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Expansion failed');
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {errorMessage && (
        <div className="flex items-center justify-between rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 border border-red-500/20">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="hover:text-red-300 ml-2 font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="panel-surface flex items-end gap-2 rounded-2xl border border-[rgb(var(--ink-rgb)/0.1)] p-2 pl-4 shadow-[0_12px_36px_rgba(0,0,0,0.25)]">
        <div className="flex min-w-0 flex-1 flex-col py-1">
          <p className="mb-1 flex items-center gap-2 text-[11px] text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {t('dock.target', { count: targetCount })}
          </p>
          <textarea
            ref={textareaRef}
            rows={2}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder={t('dock.placeholder')}
            aria-label={t('dock.title')}
            className="max-h-40 min-h-[40px] w-full resize-none bg-transparent text-sm leading-relaxed text-[var(--text)] placeholder:text-[var(--muted)] outline-none"
          />
        </div>

        {/* Prompt Optimize Button */}
        <button
          type="button"
          title="Optimize prompt with LLM"
          aria-label="Optimize prompt with LLM"
          onClick={handleOptimize}
          disabled={!canSend || loadingAction !== null}
          className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs text-[var(--muted)] transition duration-150 hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          {loadingAction === 'optimize' ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
          ) : (
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          )}
          <span className="hidden sm:inline">Optimize</span>
        </button>

        {/* Prompt Expand Button */}
        <button
          type="button"
          title="Expand prompt with details using LLM"
          aria-label="Expand prompt with details using LLM"
          onClick={handleExpand}
          disabled={!canSend || loadingAction !== null}
          className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs text-[var(--muted)] transition duration-150 hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          {loadingAction === 'expand' ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Expand</span>
        </button>

        <button
          type="button"
          title={modeLabel}
          aria-label={modeLabel}
          onClick={onToggleMode}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--muted)] transition duration-150 hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <ModeIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          title={t('dock.clear')}
          aria-label={t('dock.clear')}
          onClick={() => onDraftChange('')}
          disabled={!canSend}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--muted)] transition duration-150 hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <Eraser className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] px-4 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgb(var(--accent-rgb)/0.35)] transition duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <Send className="h-4 w-4" />
          <span>{t('dock.send')}</span>
        </button>
      </div>
    </div>
  );
}
