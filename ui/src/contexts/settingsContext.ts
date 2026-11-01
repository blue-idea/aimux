import { createContext, useContext } from 'react';
import type { WorkspaceSettings } from '@/lib/settings';
import type { MessageKey } from '@/lib/i18n';

export type SyncStatus = 'off' | 'idle' | 'saving' | 'saved' | 'error';

export interface SettingsContextValue {
  settings: WorkspaceSettings;
  updateSettings: (patch: Partial<WorkspaceSettings>) => void;
  syncStatus: SyncStatus;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used within SettingsProvider');
  return value;
}
