import { useRef, useState, type CSSProperties } from 'react';
import { getThemeStyle } from '@/lib/themes';
import {
  AI_MODELS,
  LAYOUTS,
  MAX_ACTIVE_MODELS,
  RESOLUTION_PRESETS,
  type ModelId,
} from '@/lib/workspaceConfig';
import { useSettings } from '@/contexts/settingsContext';
import { useShortcutListener } from '@/hooks/useShortcutListener';
import { formatAllViewportsMarkdown, downloadMarkdownFile } from '@/lib/markdownExport';
import { WorkspaceHeader } from './WorkspaceHeader';
import { ViewportGrid } from './ViewportGrid';
import { BroadcastDock } from './BroadcastDock';
import { FloatingPromptWindow } from './FloatingPromptWindow';
import { ControlHub } from './ControlHub';
import { ControlRail } from './ControlRail';
import { SettingsDialog } from '@/components/settings/SettingsDialog';

type Conversations = Partial<Record<ModelId, string[]>>;

export function Workspace() {
  const { settings, updateSettings } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [conversations, setConversations] = useState<Conversations>({});
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const layout = LAYOUTS.find((item) => item.id === settings.layoutId) ?? LAYOUTS[0];
  const resolution =
    RESOLUTION_PRESETS.find((item) => item.id === settings.resolutionId) ?? RESOLUTION_PRESETS[0];
  const models = AI_MODELS.filter((model) => settings.activeModels.includes(model.id));
  const visibleModels = models.slice(0, layout.capacity);

  function toggleModel(id: ModelId) {
    const { activeModels } = settings;
    if (activeModels.includes(id)) {
      if (activeModels.length > 1)
        updateSettings({ activeModels: activeModels.filter((item) => item !== id) });
      return;
    }
    if (activeModels.length < MAX_ACTIVE_MODELS) {
      updateSettings({ activeModels: [...activeModels, id] });
    }
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
    const items = visibleModels.map((m) => ({
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

  return (
    <div className="relative h-screen w-full overflow-hidden" style={getThemeStyle(settings)}>
      <div className="absolute inset-0" style={{ background: 'var(--wallpaper)' }} />
      <div className="relative flex h-full items-center justify-center p-3 sm:p-6">
        <div className="window-frame relative flex min-h-0 flex-col" style={frameStyle}>
          <WorkspaceHeader
            layout={layout}
            onLayout={(item) => updateSettings({ layoutId: item.id })}
            resolutionId={resolution.id}
            onResolution={(id) => updateSettings({ resolutionId: id })}
            railCollapsed={settings.railCollapsed}
            onToggleRail={() => updateSettings({ railCollapsed: !settings.railCollapsed })}
            onOpenSettings={() => setSettingsOpen(true)}
            onExportAll={handleExportAll}
          />
          <div className="relative flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              <ViewportGrid
                models={visibleModels}
                layout={layout}
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
            {settings.railCollapsed ? (
              <ControlRail
                layout={layout}
                onLayout={(item) => updateSettings({ layoutId: item.id })}
                activeModels={settings.activeModels}
                onToggleModel={toggleModel}
                onExpand={() => updateSettings({ railCollapsed: false })}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            ) : (
              <ControlHub
                layout={layout}
                onLayout={(item) => updateSettings({ layoutId: item.id })}
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
