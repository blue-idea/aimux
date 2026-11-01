import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Download, RotateCw } from 'lucide-react';
import type { AiModel } from '@/lib/workspaceConfig';
import { useSettings } from '@/contexts/settingsContext';
import { formatSingleViewportMarkdown, downloadMarkdownFile } from '@/lib/markdownExport';

const COMPACT_WIDTH = 850;

interface ViewportProps {
  model: AiModel;
  messages: string[];
  onClear: () => void;
  style?: CSSProperties;
}

export function Viewport({ model, messages, onClear, style }: ViewportProps) {
  const { t } = useSettings();
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const zoom = width > 0 && width < COMPACT_WIDTH ? 78 : 100;

  return (
    <section
      ref={rootRef}
      style={style}
      className="panel-surface flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[8px] border border-[rgb(var(--ink-rgb)/0.08)]"
    >
      <div className="flex h-7 shrink-0 items-center justify-between gap-2 border-b border-[rgb(var(--ink-rgb)/0.08)] px-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: model.color }}
          />
          <span className="truncate text-xs font-medium">{model.name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[11px] tabular-nums text-[var(--muted)]">
            {t('viewport.zoom', { zoom })}
          </span>
          <button
            type="button"
            title={`Export ${model.name} to Markdown`}
            aria-label={`Export ${model.name} to Markdown`}
            onClick={() => {
              const content = formatSingleViewportMarkdown({
                modelName: model.name,
                messages,
              });
              downloadMarkdownFile(content, `${model.name.toLowerCase()}-export.md`);
            }}
            className="flex h-5 w-5 items-center justify-center rounded text-[var(--muted)] transition duration-150 hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Download className="h-3 w-3" />
          </button>
          <button
            type="button"
            title={t('viewport.clear', { name: model.name })}
            aria-label={t('viewport.clear', { name: model.name })}
            onClick={onClear}
            className="flex h-5 w-5 items-center justify-center rounded text-[var(--muted)] transition duration-150 hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <RotateCw className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div ref={bodyRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="m-auto text-center">
            <div
              className="mx-auto mb-3 h-8 w-8 rounded-xl"
              style={{ backgroundColor: model.color }}
            />
            <p className="text-sm font-medium">{t('viewport.ready', { name: model.name })}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{t('viewport.empty')}</p>
          </div>
        ) : (
          <div className="mt-auto flex flex-col gap-2">
            {messages.map((text, index) => (
              <div
                key={index}
                className="ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-xl rounded-br-sm bg-[rgb(var(--accent-rgb)/0.18)] px-3 py-2 text-sm leading-relaxed"
              >
                {text}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
