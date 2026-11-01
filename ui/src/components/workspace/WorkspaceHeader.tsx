import { Download, PanelRight, PanelRightClose, Settings, Sparkles } from 'lucide-react';
import { LAYOUTS, RESOLUTION_PRESETS, type WorkspaceLayout } from '@/lib/workspaceConfig';
import { useSettings } from '@/contexts/settingsContext';

interface WorkspaceHeaderProps {
  layout: WorkspaceLayout;
  onLayout: (layout: WorkspaceLayout) => void;
  resolutionId: string;
  onResolution: (id: string) => void;
  railCollapsed: boolean;
  onToggleRail: () => void;
  onOpenSettings: () => void;
  onExportAll?: () => void;
}

const iconButton =
  'flex h-7 w-7 items-center justify-center rounded-md transition duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)]';

export function WorkspaceHeader({
  layout,
  onLayout,
  resolutionId,
  onResolution,
  railCollapsed,
  onToggleRail,
  onOpenSettings,
  onExportAll,
}: WorkspaceHeaderProps) {
  const { t } = useSettings();
  const railLabel = railCollapsed ? t('header.expandPanel') : t('header.collapsePanel');

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-[rgb(var(--ink-rgb)/0.08)] px-3 sm:px-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)] text-slate-950 shadow-[0_0_18px_rgb(var(--accent-rgb)/0.45)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">aimux</span>
      </div>

      <div className="mx-auto flex min-w-0 items-center">
        <select
          aria-label={t('header.resolution')}
          value={resolutionId}
          onChange={(event) => onResolution(event.target.value)}
          className="max-w-[240px] cursor-pointer truncate rounded-md bg-[rgb(var(--ink-rgb)/0.06)] px-2.5 py-1 text-xs text-[var(--text)] outline-none transition duration-150 hover:bg-[rgb(var(--ink-rgb)/0.1)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          {RESOLUTION_PRESETS.map((preset) => (
            <option
              key={preset.id}
              value={preset.id}
              className="bg-[rgb(var(--surface-rgb))] text-[var(--text)]"
            >
              {t(preset.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
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
              className={`${iconButton} ${
                active
                  ? 'bg-[rgb(var(--accent-rgb)/0.18)] text-[var(--accent)]'
                  : 'text-[var(--muted)] hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)]'
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
        <span className="mx-1.5 h-4 w-px bg-[rgb(var(--ink-rgb)/0.12)]" />
        {onExportAll && (
          <button
            type="button"
            title="Export all viewports to Markdown"
            aria-label="Export all viewports to Markdown"
            onClick={onExportAll}
            className={`${iconButton} text-[var(--muted)] hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)]`}
          >
            <Download className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          title={railLabel}
          aria-label={railLabel}
          aria-pressed={railCollapsed}
          onClick={onToggleRail}
          className={`${iconButton} text-[var(--muted)] hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)]`}
        >
          {railCollapsed ? (
            <PanelRight className="h-4 w-4" />
          ) : (
            <PanelRightClose className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          title={t('header.settings')}
          aria-label={t('header.settings')}
          onClick={onOpenSettings}
          className={`${iconButton} text-[var(--muted)] hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)]`}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
