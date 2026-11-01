import { PanelRight, Settings } from 'lucide-react';
import { useSettings } from '@/contexts/settingsContext';
import { AI_MODELS, LAYOUTS, MAX_ACTIVE_MODELS, type ModelId, type WorkspaceLayout } from '@/lib/workspaceConfig';

interface ControlRailProps {
  layout: WorkspaceLayout;
  onLayout: (layout: WorkspaceLayout) => void;
  activeModels: ModelId[];
  onToggleModel: (id: ModelId) => void;
  onExpand: () => void;
  onOpenSettings: () => void;
}

const railButton =
  'flex h-9 w-9 items-center justify-center rounded-lg transition duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40';

export function ControlRail({
  layout,
  onLayout,
  activeModels,
  onToggleModel,
  onExpand,
  onOpenSettings,
}: ControlRailProps) {
  const { t } = useSettings();

  return (
    <aside className="glass-surface relative z-20 flex w-14 shrink-0 flex-col items-center gap-2 border-l border-[rgb(var(--ink-rgb)/0.08)] py-3">
      <button
        type="button"
        title={t('header.expandPanel')}
        aria-label={t('header.expandPanel')}
        onClick={onExpand}
        className={`${railButton} text-[var(--muted)] hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)]`}
      >
        <PanelRight className="h-4 w-4" />
      </button>

      <span className="my-1 h-px w-6 bg-[rgb(var(--ink-rgb)/0.12)]" />

      {LAYOUTS.map((item) => {
        const active = item.id === layout.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            title={t(item.labelKey)}
            aria-label={t(item.labelKey)}
            aria-pressed={active}
            onClick={() => onLayout(item)}
            className={`${railButton} ${
              active
                ? 'bg-[rgb(var(--accent-rgb)/0.18)] text-[var(--accent)]'
                : 'text-[var(--muted)] hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)]'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}

      <span className="my-1 h-px w-6 bg-[rgb(var(--ink-rgb)/0.12)]" />

      {AI_MODELS.map((model) => {
        const checked = activeModels.includes(model.id);
        const disabled = !checked && activeModels.length >= MAX_ACTIVE_MODELS;
        return (
          <button
            key={model.id}
            type="button"
            title={model.name}
            aria-label={model.name}
            aria-pressed={checked}
            disabled={disabled}
            onClick={() => onToggleModel(model.id)}
            className={`${railButton} ${
              checked ? 'bg-[rgb(var(--ink-rgb)/0.1)]' : 'hover:bg-[rgb(var(--ink-rgb)/0.08)]'
            }`}
          >
            <span
              className={`h-3 w-3 rounded-full transition duration-150 ${checked ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-transparent' : 'opacity-50'}`}
              style={{ backgroundColor: model.color }}
            />
          </button>
        );
      })}

      <div className="mt-auto">
        <button
          type="button"
          title={t('header.settings')}
          aria-label={t('header.settings')}
          onClick={onOpenSettings}
          className={`${railButton} text-[var(--muted)] hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)]`}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
