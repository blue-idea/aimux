import { useSettings } from '@/contexts/settingsContext';
import { RESOLUTION_PRESETS } from '@/lib/workspaceConfig';
import type { DockMode } from '@/lib/settings';
import { Segmented, SettingRow, SettingSection, Toggle } from './SettingsControls';

const SLIDER_CLASS =
  'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[rgb(var(--ink-rgb)/0.15)] accent-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]';

export function WindowSettings() {
  const { settings, updateSettings, t } = useSettings();

  return (
    <div className="space-y-8">
      <SettingSection title={t('window.size')}>
        <SettingRow label={t('window.size')} description={t('header.resolution')}>
          <select
            value={settings.resolutionId}
            onChange={(event) => updateSettings({ resolutionId: event.target.value })}
            aria-label={t('window.size')}
            className="w-full rounded-lg border border-[rgb(var(--ink-rgb)/0.15)] bg-[rgb(var(--ink-rgb)/0.06)] px-3 py-2 text-sm text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:w-64"
          >
            {RESOLUTION_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id} className="bg-[rgb(var(--surface-rgb))]">
                {t(preset.labelKey)}
              </option>
            ))}
          </select>
        </SettingRow>
      </SettingSection>

      <SettingSection title={t('window.opacity')}>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <label htmlFor="window-opacity">{t('window.opacity')}</label>
            <span className="tabular-nums text-[var(--text)]">{settings.opacity}%</span>
          </div>
          <input
            id="window-opacity"
            type="range"
            min={70}
            max={100}
            step={1}
            value={settings.opacity}
            onChange={(event) => updateSettings({ opacity: Number(event.target.value) })}
            className={SLIDER_CLASS}
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <label htmlFor="window-blur">{t('window.blur')}</label>
            <span className="tabular-nums text-[var(--text)]">{settings.blur}px</span>
          </div>
          <input
            id="window-blur"
            type="range"
            min={0}
            max={40}
            step={1}
            value={settings.blur}
            onChange={(event) => updateSettings({ blur: Number(event.target.value) })}
            className={SLIDER_CLASS}
          />
        </div>
      </SettingSection>

      <SettingSection title={t('settings.tab.window')}>
        <SettingRow label={t('window.railCollapsed')}>
          <Toggle
            label={t('window.railCollapsed')}
            checked={settings.railCollapsed}
            onChange={(railCollapsed) => updateSettings({ railCollapsed })}
          />
        </SettingRow>
        <SettingRow label={t('window.dockMode')}>
          <Segmented<DockMode>
            label={t('window.dockMode')}
            options={[
              { value: 'docked', label: t('window.docked') },
              { value: 'floating', label: t('window.floating') },
            ]}
            value={settings.dockMode}
            onChange={(dockMode) => updateSettings({ dockMode })}
          />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
