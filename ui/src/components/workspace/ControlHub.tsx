import type { ReactNode } from 'react';
import { Check, Settings } from 'lucide-react';
import { useSettings } from '@/contexts/settingsContext';
import { AI_MODELS, LAYOUTS, MAX_ACTIVE_MODELS, type ModelId, type WorkspaceLayout } from '@/lib/workspaceConfig';

interface ControlHubProps {
  layout: WorkspaceLayout;
  onLayout: (layout: WorkspaceLayout) => void;
  activeModels: ModelId[];
  onToggleModel: (id: ModelId) => void;
  onOpenSettings: () => void;
}

export function ControlHub({ layout, onLayout, activeModels, onToggleModel, onOpenSettings }: ControlHubProps) {
  const { t } = useSettings();

  return (
    <aside className="glass-surface absolute inset-y-0 right-0 z-20 flex w-[260px] flex-col border-l border-[rgb(var(--ink-rgb)/0.08)] lg:static">
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <Section title={t('hub.layout')}>
          <div className="grid grid-cols-3 gap-2">
            {LAYOUTS.map((item) => {
              const active = item.id === layout.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onLayout(item)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-[11px] transition duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    active
                      ? 'border-[var(--accent)] bg-[rgb(var(--accent-rgb)/0.14)] text-[var(--text)]'
                      : 'panel-surface border-[rgb(var(--ink-rgb)/0.08)] text-[var(--muted)] hover:border-[rgb(var(--ink-rgb)/0.2)] hover:text-[var(--text)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-center leading-tight">{t(item.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title={t('hub.models')} hint={t('hub.modelCount', { count: activeModels.length, max: MAX_ACTIVE_MODELS })}>
          <ul className="space-y-1">
            {AI_MODELS.map((model) => {
              const checked = activeModels.includes(model.id);
              const disabled = !checked && activeModels.length >= MAX_ACTIVE_MODELS;
              return (
                <li key={model.id}>
                  <button
                    type="button"
                    aria-pressed={checked}
                    disabled={disabled}
                    onClick={() => onToggleModel(model.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition duration-150 hover:bg-[rgb(var(--ink-rgb)/0.06)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: model.color }} />
                    <span className="flex-1">{model.name}</span>
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border transition duration-150 ${
                        checked
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-slate-950'
                          : 'border-[rgb(var(--ink-rgb)/0.3)]'
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>
      </div>

      <div className="border-t border-[rgb(var(--ink-rgb)/0.08)] p-3">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition duration-150 hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <Settings className="h-4 w-4" />
          <span>{t('hub.openSettings')}</span>
        </button>
      </div>
    </aside>
  );
}

interface SectionProps {
  title: string;
  hint?: string;
  children: ReactNode;
}

function Section({ title, hint, children }: SectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{title}</h2>
        {hint && <span className="text-[11px] tabular-nums text-[var(--muted)]">{hint}</span>}
      </div>
      {children}
    </section>
  );
}
