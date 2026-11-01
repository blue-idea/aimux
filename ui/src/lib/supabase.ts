import { createClient } from '@supabase/supabase-js';

const DEVICE_ID_KEY = 'aimux.deviceId';

function createDeviceId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getDeviceId(): string {
  const stored = localStorage.getItem(DEVICE_ID_KEY);
  if (stored && stored.length >= 16) return stored;
  const created = createDeviceId();
  localStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    global: {
      headers: { 'x-device-id': getDeviceId() },
    },
  },
);
