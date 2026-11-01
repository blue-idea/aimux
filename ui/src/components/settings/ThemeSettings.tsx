import { Check } from 'lucide-react';
import { useSettings } from '@/contexts/settingsContext';
import { THEMES, getAccent } from '@/lib/themes';
import { SettingRow, SettingSection } from './SettingsControls';

export function ThemeSettings() {
  const { settings, updateSettings, t } = useSettings();
  const accent = getAccent(settings);

  return (
    <div className="space-y-8">
      <SettingSection title={t('appearance.theme')}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {THEMES.map((theme) => {
            const active = theme.id === settings.themeId;
            return (
              <button
                key={theme.id}
                type="button"
                aria-pressed={active}
                onClick={() => updateSettings({ themeId: theme.id })}
                className={`group relative overflow-hidden rounded-xl border text-left transition duration-200 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  active
                    ? 'border-[var(--accent)] shadow-[0_0_0_1px_var(--accent)]'
                    : 'border-[rgb(var(--ink-rgb)/0.12)] hover:-translate-y-0.5 hover:border-[rgb(var(--ink-rgb)/0.3)]'
                }`}
              >
                <span
                  className="block h-16 w-full transition duration-300 group-hover:scale-105"
                  style={{ background: theme.wallpaper }}
                  aria-hidden="true"
                />
                <span className="flex items-center justify-between gap-2 bg-[rgb(var(--surface-rgb))] px-3 py-2">
                  <span className="text-xs font-medium text-[var(--text)]">{t(theme.nameKey)}</span>
                  {active && <Check className="h-3.5 w-3.5 text-[var(--accent)]" />}
                </span>
              </button>
            );
          })}
        </div>
      </SettingSection>

      <SettingSection title={t('appearance.accent')}>
        <SettingRow label={t('appearance.accent')}>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accent}
              onChange={(event) => updateSettings({ accent: event.target.value })}
              aria-label={t('appearance.accent')}
              className="h-9 w-14 cursor-pointer rounded-md border border-[rgb(var(--ink-rgb)/0.15)] bg-transparent p-0.5"
            />
            <button
              type="button"
              onClick={() => updateSettings({ accent: null })}
              disabled={settings.accent === null}
              className="rounded-md px-3 py-1.5 text-xs text-[var(--muted)] transition duration-150 hover:bg-[rgb(var(--ink-rgb)/0.08)] hover:text-[var(--text)] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
            >
              {t('appearance.resetAccent')}
            </button>
          </div>
        </SettingRow>
      </SettingSection>
    </div>
  );
}
