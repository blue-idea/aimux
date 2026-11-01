import { useSettings } from '@/contexts/settingsContext';
import { LOCALES, type Locale } from '@/lib/i18n';
import { Segmented, SettingRow, SettingSection, Toggle } from './SettingsControls';
import type { SyncStatus } from '@/contexts/settingsContext';

const STATUS_KEYS = {
  off: 'settings.cloudStatus.off',
  idle: 'settings.cloudStatus.idle',
  saving: 'settings.cloudStatus.saving',
  saved: 'settings.cloudStatus.saved',
  error: 'settings.cloudStatus.error',
} as const satisfies Record<SyncStatus, `settings.cloudStatus.${string}`>;

export function GeneralSettings() {
  const { settings, updateSettings, syncStatus, t } = useSettings();

  return (
    <SettingSection title={t('settings.tab.general')}>
      <SettingRow label={t('settings.language')}>
        <Segmented<Locale>
          label={t('settings.language')}
          options={LOCALES.map((item) => ({ value: item.id, label: item.label }))}
          value={settings.locale}
          onChange={(locale) => updateSettings({ locale })}
        />
      </SettingRow>

      <SettingRow label={t('settings.cloud')} description={t('settings.cloudDesc')}>
        <Toggle
          label={t('settings.cloud')}
          checked={settings.cloudSync}
          onChange={(cloudSync) => updateSettings({ cloudSync })}
        />
      </SettingRow>

      <p
        role="status"
        className={`text-xs leading-relaxed ${syncStatus === 'error' ? 'font-medium text-[var(--text)]' : 'text-[var(--muted)]'}`}
      >
        {t(STATUS_KEYS[syncStatus])}
      </p>
    </SettingSection>
  );
}
