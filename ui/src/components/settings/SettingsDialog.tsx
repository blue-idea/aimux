import { useEffect, useState } from 'react';
import { AppWindow, Bot, Globe, Keyboard, Layers, Palette, X } from 'lucide-react';
import { useSettings } from '@/contexts/settingsContext';
import type { MessageKey } from '@/lib/i18n';
import { GeneralSettings } from './GeneralSettings';
import { ThemeSettings } from './ThemeSettings';
import { WindowSettings } from './WindowSettings';
import { ShortcutSettings } from './ShortcutSettings';
import { SiteSourcesSettings } from './SiteSourcesSettings';
import { LlmSettings } from './LlmSettings';

type TabId = 'general' | 'sites' | 'llm' | 'appearance' | 'window' | 'shortcuts';

const TABS: { id: TabId; labelKey: MessageKey; icon: typeof Globe }[] = [
  { id: 'general', labelKey: 'settings.tab.general', icon: Globe },
  { id: 'sites', labelKey: 'settings.tab.sites', icon: Layers },
  { id: 'llm', labelKey: 'settings.tab.llm', icon: Bot },
  { id: 'appearance', labelKey: 'settings.tab.appearance', icon: Palette },
  { id: 'window', labelKey: 'settings.tab.window', icon: AppWindow },
  { id: 'shortcuts', labelKey: 'settings.tab.shortcuts', icon: Keyboard },
];

interface SettingsDialogProps {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const { t } = useSettings();
  const [tab, setTab] = useState<TabId>('general');

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.title')}
        className="flex h-[min(640px,calc(100vh-24px))] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[rgb(var(--ink-rgb)/0.12)] bg-[rgb(var(--surface-rgb))] text-[var(--text)] shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[rgb(var(--ink-rgb)/0.08)] px-4 sm:px-5">
          <h2 className="text-sm font-semibold">{t('settings.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('settings.close')}
            title={t('settings.close')}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted)] transition duration-150 hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-[rgb(var(--ink-rgb)/0.08)] p-2 sm:w-48 sm:flex-col sm:border-b-0 sm:border-r sm:p-3">
            {TABS.map(({ id, labelKey, icon: Icon }) => {
              const active = id === tab;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setTab(id)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    active
                      ? 'bg-[rgb(var(--accent-rgb)/0.16)] font-semibold text-[var(--text)]'
                      : 'text-[var(--muted)] hover:bg-[rgb(var(--ink-rgb)/0.06)] hover:text-[var(--text)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t(labelKey)}</span>
                </button>
              );
            })}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            {tab === 'general' && <GeneralSettings />}
            {tab === 'sites' && <SiteSourcesSettings />}
            {tab === 'llm' && <LlmSettings />}
            {tab === 'appearance' && <ThemeSettings />}
            {tab === 'window' && <WindowSettings />}
            {tab === 'shortcuts' && <ShortcutSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
