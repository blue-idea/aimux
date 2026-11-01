import { normalizeSettings, type WorkspaceSettings } from '@/lib/settings';
import { getDeviceId, supabase } from '@/lib/supabase';

const LOCAL_KEY = 'aimux.settings';

export function loadLocalSettings(): WorkspaceSettings | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? normalizeSettings(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveLocalSettings(settings: WorkspaceSettings): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be full or disabled; the in-memory settings still apply.
  }
}

export async function loadCloudSettings(): Promise<WorkspaceSettings | null> {
  const { data, error } = await supabase
    .from('workspace_settings')
    .select('settings')
    .eq('device_id', getDeviceId())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeSettings(data.settings) : null;
}

export async function saveCloudSettings(settings: WorkspaceSettings): Promise<void> {
  const { error } = await supabase.from('workspace_settings').upsert(
    {
      device_id: getDeviceId(),
      settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'device_id' }
  );
  if (error) throw new Error(error.message);
}
