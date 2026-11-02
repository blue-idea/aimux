import { useRef, useState, type CSSProperties } from 'react';
import { getThemeStyle } from '@/lib/themes';
import {
  AI_MODELS,
  RESOLUTION_PRESETS,
  type ModelId,
} from '@/lib/workspaceConfig';
import { useSettings } from '@/contexts/settingsContext';
import { useShortcutListener } from '@/hooks/useShortcutListener';
import { formatAllViewportsMarkdown, downloadMarkdownFile } from '@/lib/markdownExport';
import { LayoutSwitcher } from './LayoutSwitcher';
import { WorkspaceGrid } from './WorkspaceGrid';
import { BroadcastDock } from '../workspace/BroadcastDock';
import { FloatingPromptWindow } from '../workspace/FloatingPromptWindow';
import { ControlHub } from '../workspace/ControlHub';
import { ControlRail } from '../workspace/ControlRail';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { useViewportStore } from '../../stores/viewportStore';
import { Sparkles, Download, PanelRight, PanelRightClose, Settings } from 'lucide-react';
import { LAYOUT_OPTIONS } from '../../config/layoutOptions';

type Conversations = Partial<Record<ModelId, string[]>>;

export function Shell() {
  const { settings, updateSettings, t } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [conversations, setConversations] = useState<Conversations>({});
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const { layoutMode, setLayoutMode } = useViewportStore();
  const resolution =
    RESOLUTION_PRESETS.find((item) => item.id === settings.resolutionId) ?? RESOLUTION_PRESETS[0];

  const models = AI_MODELS.filter((model) => settings.activeModels.includes(model.id));

  // 映射当前 layout
  const currentLayoutOption = LAYOUT_OPTIONS.find((opt) => opt.id === layoutMode) ?? LAYOUT_OPTIONS[2];

  function toggleModel(id: ModelId) {
    const { activeModels } = settings;
    if (activeModels.includes(id)) {
      if (activeModels.length > 1) {
        updateSettings({ activeModels: activeModels.filter((item) => item !== id) });
      }
      return;
    }
    updateSettings({ activeModels: [...activeModels, id] });
  }

  function broadcast() {
    const text = draft.trim();
    if (!text) return;
    setConversations((prev) => {
      const next = { ...prev };
      for (const id of settings.activeModels) {
        next[id] = [...(prev[id] ?? []), text];
      }
      return next;
    });
    setDraft('');
  }

  function clearConversation(id: ModelId) {
    setConversations((prev) => ({ ...prev, [id]: [] }));
  }

  function handleExportAll() {
    const items = models.map((m) => ({
      modelName: m.name,
      messages: conversations[m.id] ?? [],
    }));
    const content = formatAllViewportsMarkdown(items);
    downloadMarkdownFile(content, `aimux-workspace-export-${Date.now()}.md`);
  }

  useShortcutListener(
    settings.shortcuts,
    {
      broadcast,
      focusPrompt: () => promptRef.current?.focus(),
      toggleRail: () => updateSettings({ railCollapsed: !settings.railCollapsed }),
      toggleDock: () =>
        updateSettings({ dockMode: settings.dockMode === 'docked' ? 'floating' : 'docked' }),
      openSettings: () => setSettingsOpen(true),
    },
    !settingsOpen
  );

  const frameStyle: CSSProperties =
    resolution.width && resolution.height
      ? {
          width: `min(100%, ${resolution.width}px)`,
          height: `min(100%, ${resolution.height}px)`,
        }
      : { width: '100%', height: '100%' };

  const dock = (
    <BroadcastDock
      draft={draft}
      onDraftChange={setDraft}
      onSend={broadcast}
      targetCount={settings.activeModels.length}
      textareaRef={promptRef}
      dockMode={settings.dockMode}
      onToggleMode={() =>
        updateSettings({ dockMode: settings.dockMode === 'docked' ? 'floating' : 'docked' })
      }
    />
  );

  const iconButton =
    'flex h-7 w-7 items-center justify-center rounded-md transition duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)]';

  return (
    <div
      data-testid="workspace-shell"
      className="relative h-screen w-full overflow-hidden select-none"
      style={getThemeStyle(settings)}
    >
      <div className="absolute inset-0" style={{ background: 'var(--wallpaper)' }} />
      <div className="relative flex h-full items-center justify-center p-3 sm:p-6">
        <div className="window-frame relative flex min-h-0 flex-col" style={frameStyle}>
          {/* Header 区域 */}
          <header className="flex h-11 shrink-0 items-center justify-between border-b border-[rgb(var(--ink-rgb)/0.08)] px-3 sm:px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)] text-slate-950 shadow-[0_0_18px_rgb(var(--accent-rgb)/0.45)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold tracking-tight">AIMux</span>
            </div>

            {/* 布局切换控件 (REQ-002-AC-001) */}
            <div className="flex items-center gap-3">
              <LayoutSwitcher current={layoutMode} onSelect={setLayoutMode} />

              <select
                aria-label={t('header.resolution')}
                value={resolution.id}
                onChange={(e) => updateSettings({ resolutionId: e.target.value })}
                className="max-w-[200px] cursor-pointer truncate rounded-md bg-[rgb(var(--ink-rgb)/0.06)] px-2.5 py-1 text-xs text-[var(--text)] outline-none transition duration-150 hover:bg-[rgb(var(--ink-rgb)/0.1)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
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

            {/* 窗口与右侧动作 */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Export Markdown"
                aria-label="Export Markdown"
                onClick={handleExportAll}
                className={`${iconButton} text-[var(--muted)] hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)]`}
              >
                <Download className="h-4 w-4" />
              </button>

              <button
                type="button"
                title={settings.railCollapsed ? t('header.expandPanel') : t('header.collapsePanel')}
                aria-label={settings.railCollapsed ? t('header.expandPanel') : t('header.collapsePanel')}
                onClick={() => updateSettings({ railCollapsed: !settings.railCollapsed })}
                className={`${iconButton} text-[var(--muted)] hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)]`}
              >
                {settings.railCollapsed ? (
                  <PanelRight className="h-4 w-4" />
                ) : (
                  <PanelRightClose className="h-4 w-4" />
                )}
              </button>

              <button
                type="button"
                title={t('header.settings')}
                aria-label={t('header.settings')}
                onClick={() => setSettingsOpen(true)}
                className={`${iconButton} text-[var(--muted)] hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)]`}
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* 主工作台与控制栏区域 */}
          <div data-testid="workspace-content" className="relative flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              <WorkspaceGrid
                models={models}
                conversations={conversations}
                onClear={clearConversation}
              />
              {settings.dockMode === 'docked' && (
                <div className="shrink-0 px-3 pb-3 sm:px-4 sm:pb-4">{dock}</div>
              )}
            </div>

            {settings.dockMode === 'floating' && (
              <FloatingPromptWindow>{dock}</FloatingPromptWindow>
            )}

            {/* 右侧控制栏 (260px) */}
            {settings.railCollapsed ? (
              <ControlRail
                layout={{
                  id: currentLayoutOption.id,
                  labelKey: 'layout.grid',
                  icon: currentLayoutOption.icon,
                  capacity: 4,
                  template: () => ({ columns: '1fr', rows: '1fr' }),
                  stackedLead: false,
                }}
                onLayout={() => {}}
                activeModels={settings.activeModels}
                onToggleModel={toggleModel}
                onExpand={() => updateSettings({ railCollapsed: false })}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            ) : (
              <ControlHub
                layout={{
                  id: currentLayoutOption.id,
                  labelKey: 'layout.grid',
                  icon: currentLayoutOption.icon,
                  capacity: 4,
                  template: () => ({ columns: '1fr', rows: '1fr' }),
                  stackedLead: false,
                }}
                onLayout={() => {}}
                activeModels={settings.activeModels}
                onToggleModel={toggleModel}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            )}
          </div>
        </div>
      </div>

      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
