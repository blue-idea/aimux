import type { CSSProperties } from 'react';
import type { MessageKey } from '@/lib/i18n';

export type ThemeId = 'obsidian' | 'light' | 'cyberpunk' | 'midnight' | 'sunset' | 'sage';

export interface Theme {
  id: ThemeId;
  nameKey: MessageKey;
  surfaceRgb: string;
  inkRgb: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  wallpaper: string;
}

export const THEMES: Theme[] = [
  {
    id: 'obsidian',
    nameKey: 'theme.obsidian',
    surfaceRgb: '18 18 24',
    inkRgb: '243 244 246',
    text: '#F3F4F6',
    muted: '#9CA3AF',
    accent: '#3B82F6',
    accent2: '#06B6D4',
    wallpaper:
      'radial-gradient(circle at 20% 10%, rgba(59,130,246,0.35), transparent 45%), radial-gradient(circle at 85% 90%, rgba(6,182,212,0.22), transparent 40%), #0b0b10',
  },
  {
    id: 'light',
    nameKey: 'theme.light',
    surfaceRgb: '248 250 252',
    inkRgb: '15 23 42',
    text: '#0F172A',
    muted: '#475569',
    accent: '#2563EB',
    accent2: '#0EA5E9',
    wallpaper: 'radial-gradient(circle at 15% 10%, rgba(37,99,235,0.18), transparent 45%), #e2e8f0',
  },
  {
    id: 'cyberpunk',
    nameKey: 'theme.cyberpunk',
    surfaceRgb: '13 10 26',
    inkRgb: '253 242 248',
    text: '#FDF2F8',
    muted: '#67E8F9',
    accent: '#06B6D4',
    accent2: '#EC4899',
    wallpaper:
      'radial-gradient(circle at 15% 15%, rgba(6,182,212,0.3), transparent 42%), radial-gradient(circle at 85% 85%, rgba(236,72,153,0.28), transparent 42%), #07050f',
  },
  {
    id: 'midnight',
    nameKey: 'theme.midnight',
    surfaceRgb: '15 23 42',
    inkRgb: '248 250 252',
    text: '#F8FAFC',
    muted: '#94A3B8',
    accent: '#38BDF8',
    accent2: '#22D3EE',
    wallpaper:
      'radial-gradient(circle at 25% 15%, rgba(56,189,248,0.25), transparent 45%), #060b18',
  },
  {
    id: 'sunset',
    nameKey: 'theme.sunset',
    surfaceRgb: '28 18 24',
    inkRgb: '255 247 237',
    text: '#FFF7ED',
    muted: '#FDBA74',
    accent: '#F97316',
    accent2: '#FB7185',
    wallpaper: 'radial-gradient(circle at 80% 15%, rgba(249,115,22,0.3), transparent 45%), #140c10',
  },
  {
    id: 'sage',
    nameKey: 'theme.sage',
    surfaceRgb: '14 24 20',
    inkRgb: '236 253 245',
    text: '#ECFDF5',
    muted: '#6EE7B7',
    accent: '#10B981',
    accent2: '#34D399',
    wallpaper:
      'radial-gradient(circle at 20% 80%, rgba(16,185,129,0.25), transparent 45%), #07110d',
  },
];

export interface AppearanceSettings {
  themeId: ThemeId;
  accent: string | null;
  opacity: number;
  blur: number;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  themeId: 'obsidian',
  accent: null,
  opacity: 88,
  blur: 20,
};

export function findTheme(id: ThemeId): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

export function getAccent(settings: AppearanceSettings): string {
  return settings.accent ?? findTheme(settings.themeId).accent;
}

function hexToRgbTriplet(hex: string): string {
  const value = parseInt(hex.slice(1), 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
}

export function getThemeStyle(settings: AppearanceSettings): CSSProperties {
  const theme = findTheme(settings.themeId);
  const accent = getAccent(settings);
  const vars: Record<string, string> = {
    '--surface-rgb': theme.surfaceRgb,
    '--ink-rgb': theme.inkRgb,
    '--text': theme.text,
    '--muted': theme.muted,
    '--accent': accent,
    '--accent-rgb': hexToRgbTriplet(accent),
    '--accent-2': theme.accent2,
    '--surface-alpha': String(settings.opacity / 100),
    '--blur': `${settings.blur}px`,
    '--wallpaper': theme.wallpaper,
  };
  return vars as CSSProperties;
}
