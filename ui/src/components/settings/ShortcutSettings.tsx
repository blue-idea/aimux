import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useSettings } from '@/contexts/settingsContext';
import type { MessageKey } from '@/lib/i18n';
import { comboFromEvent, DEFAULT_SHORTCUTS, hasModifier, SHORTCUT_IDS, type ShortcutId } from '@/lib/settings';
import { SettingSection } from './SettingsControls';

const SHORTCUT_LABEL_KEYS: Record<ShortcutId, MessageKey> = {
  broadcast: 'shortcut.broadcast',
  focusPrompt: 'shortcut.focusPrompt',
  toggleRail: 'shortcut.toggleRail',
  toggleDock: 'shortcut.toggleDock',
  openSettings: 'shortcut.openSettings',
};

export function ShortcutSettings() {
  const { settings, updateSettings, t } = useSettings();
  const [recording, setRecording] = useState<ShortcutId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!recording) return;
    const target = recording;

    function handleKeyDown(event: KeyboardEvent) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') {
        setRecording(null);
        setNotice(null);
        return;
      }
      const combo = comboFromEvent(event);
      if (!combo) return;
      if (!hasModifier(combo)) {
        setNotice(t('settings.shortcuts.needModifier'));
        return;
      }
      const previous = settings.shortcuts[target];
      const conflict = SHORTCUT_IDS.find((id) => id !== target && settings.shortcuts[id] === combo);
      const shortcuts = { ...settings.shortcuts, [target]: combo };
      if (conflict) shortcuts[conflict] = previous;
      updateSettings({ shortcuts });
      setRecording(null);
      setNotice(null);
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [recording, settings.shortcuts, updateSettings, t]);

  function restoreDefaults() {
    setRecording(null);
    setNotice(null);
    updateSettings({ shortcuts: DEFAULT_SHORTCUTS });
  }

  return (
    <SettingSection title={t('settings.tab.shortcuts')}>
      <p className="text-xs leading-relaxed text-[var(--muted)]">{t('settings.shortcuts.help')}</p>

      <ul className="divide-y divide-[rgb(var(--ink-rgb)/0.08)] rounded-xl border border-[rgb(var(--ink-rgb)/0.1)]">
        {SHORTCUT_IDS.map((id) => {
          const isRecording = recording === id;
          const combo = settings.shortcuts[id];
          return (
            <li key={id} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-sm">{t(SHORTCUT_LABEL_KEYS[id])}</span>
              <button
                type="button"
                onClick={() => {
                  setNotice(null);
                  setRecording(isRecording ? null : id);
                }}
                aria-label={`${t(SHORTCUT_LABEL_KEYS[id])}: ${combo || t('settings.shortcuts.unset')}`}
                className={`min-w-[7.5rem] rounded-md border px-3 py-1.5 text-center font-mono text-xs transition duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  isRecording
                    ? 'animate-pulse border-[var(--accent)] bg-[rgb(var(--accent-rgb)/0.16)] text-[var(--text)]'
                    : 'border-[rgb(var(--ink-rgb)/0.15)] bg-[rgb(var(--ink-rgb)/0.06)] text-[var(--text)] hover:border-[var(--accent)]'
                }`}
              >
                {isRecording ? t('settings.shortcuts.recording') : combo || t('settings.shortcuts.unset')}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex min-h-5 flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-xs font-medium text-[var(--text)]">
          {notice}
        </p>
        <button
          type="button"
          onClick={restoreDefaults}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-[var(--muted)] transition duration-150 hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t('settings.shortcuts.reset')}
        </button>
      </div>
    </SettingSection>
  );
}
