import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createDefaultSettings, type WorkspaceSettings } from '@/lib/settings';
import { translate, type MessageKey } from '@/lib/i18n';
import {
  loadCloudSettings,
  loadLocalSettings,
  saveCloudSettings,
  saveLocalSettings,
} from '@/lib/settingsStorage';
import { SettingsContext, type SyncStatus, type SettingsContextValue } from './settingsContext';

const CLOUD_SAVE_DELAY_MS = 800;

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<WorkspaceSettings>(
    () => loadLocalSettings() ?? createDefaultSettings()
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const cloudLoaded = useRef(false);

  useEffect(() => {
    if (!settings.cloudSync) {
      cloudLoaded.current = true;
      setSyncStatus('off');
      return;
    }
    if (cloudLoaded.current) return;

    let cancelled = false;
    loadCloudSettings()
      .then((cloud) => {
        if (cancelled) return;
        if (cloud) setSettings((prev) => ({ ...cloud, cloudSync: prev.cloudSync }));
        cloudLoaded.current = true;
        setSyncStatus('saved');
      })
      .catch(() => {
        if (cancelled) return;
        cloudLoaded.current = true;
        setSyncStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [settings.cloudSync]);

  useEffect(() => {
    saveLocalSettings(settings);
    document.documentElement.lang = settings.locale;
    if (!settings.cloudSync || !cloudLoaded.current) return;

    setSyncStatus('saving');
    const timer = window.setTimeout(() => {
      saveCloudSettings(settings)
        .then(() => setSyncStatus('saved'))
        .catch(() => setSyncStatus('error'));
    }, CLOUD_SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<WorkspaceSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const t = useCallback(
    (key: MessageKey, params?: Record<string, string | number>) =>
      translate(settings.locale, key, params),
    [settings.locale]
  );

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, updateSettings, syncStatus, t }),
    [settings, updateSettings, syncStatus, t]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
