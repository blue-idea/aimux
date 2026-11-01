import { DEFAULT_APPEARANCE, THEMES, type AppearanceSettings, type ThemeId } from '@/lib/themes';
import { LOCALES, type Locale } from '@/lib/i18n';
import {
  AI_MODELS,
  DEFAULT_ACTIVE_MODELS,
  LAYOUTS,
  MAX_ACTIVE_MODELS,
  RESOLUTION_PRESETS,
  type ModelId,
} from '@/lib/workspaceConfig';

export const SHORTCUT_IDS = [
  'broadcast',
  'focusPrompt',
  'toggleRail',
  'toggleDock',
  'openSettings',
] as const;

export type ShortcutId = (typeof SHORTCUT_IDS)[number];
export type Shortcuts = Record<ShortcutId, string>;
export type DockMode = 'docked' | 'floating';

export const DEFAULT_SHORTCUTS: Shortcuts = {
  broadcast: 'Ctrl+Enter',
  focusPrompt: 'Ctrl+/',
  toggleRail: 'Ctrl+.',
  toggleDock: 'Ctrl+Shift+D',
  openSettings: 'Ctrl+,',
};

export interface WorkspaceSettings extends AppearanceSettings {
  locale: Locale;
  cloudSync: boolean;
  resolutionId: string;
  layoutId: string;
  activeModels: ModelId[];
  railCollapsed: boolean;
  dockMode: DockMode;
  shortcuts: Shortcuts;
}

function detectLocale(): Locale {
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh')
    ? 'zh'
    : 'en';
}

export function createDefaultSettings(): WorkspaceSettings {
  return {
    ...DEFAULT_APPEARANCE,
    locale: detectLocale(),
    cloudSync: true,
    resolutionId: RESOLUTION_PRESETS[0].id,
    layoutId: LAYOUTS[2].id,
    activeModels: DEFAULT_ACTIVE_MODELS,
    railCollapsed: false,
    dockMode: 'docked',
    shortcuts: DEFAULT_SHORTCUTS,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pickOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

function pickNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function pickBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

// Validates settings loaded from storage so unexpected values fall back to defaults.
export function normalizeSettings(raw: unknown): WorkspaceSettings {
  const defaults = createDefaultSettings();
  const source = isRecord(raw) ? raw : {};
  const rawModels = Array.isArray(source.activeModels) ? source.activeModels : [];
  const activeModels = AI_MODELS.map((model) => model.id)
    .filter((id) => rawModels.includes(id))
    .slice(0, MAX_ACTIVE_MODELS);
  const rawShortcuts = isRecord(source.shortcuts) ? source.shortcuts : {};
  const shortcuts = { ...DEFAULT_SHORTCUTS };
  for (const id of SHORTCUT_IDS) {
    const value = rawShortcuts[id];
    if (typeof value === 'string' && value.length <= 24) shortcuts[id] = value;
  }

  return {
    locale: pickOption(
      source.locale,
      LOCALES.map((item) => item.id),
      defaults.locale
    ),
    themeId: pickOption(
      source.themeId,
      THEMES.map((theme) => theme.id) as ThemeId[],
      defaults.themeId
    ),
    accent:
      typeof source.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(source.accent)
        ? source.accent
        : null,
    opacity: Math.round(pickNumber(source.opacity, 70, 100, defaults.opacity)),
    blur: Math.round(pickNumber(source.blur, 0, 40, defaults.blur)),
    cloudSync: pickBoolean(source.cloudSync, defaults.cloudSync),
    resolutionId: pickOption(
      source.resolutionId,
      RESOLUTION_PRESETS.map((preset) => preset.id),
      defaults.resolutionId
    ),
    layoutId: pickOption(
      source.layoutId,
      LAYOUTS.map((layout) => layout.id),
      defaults.layoutId
    ),
    activeModels: activeModels.length > 0 ? activeModels : defaults.activeModels,
    railCollapsed: pickBoolean(source.railCollapsed, defaults.railCollapsed),
    dockMode: pickOption(source.dockMode, ['docked', 'floating'] as const, defaults.dockMode),
    shortcuts,
  };
}

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta']);

function normalizeKeyName(key: string): string {
  if (key === ' ') return 'Space';
  return key.length === 1 ? key.toUpperCase() : key;
}

// Returns a canonical combo such as "Ctrl+Shift+D", or null while only modifiers are held.
export function comboFromEvent(event: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(event.key)) return null;
  const parts: string[] = [];
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.metaKey) parts.push('Meta');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  parts.push(normalizeKeyName(event.key));
  return parts.join('+');
}

export function hasModifier(combo: string): boolean {
  return /(Ctrl|Meta|Alt)\+/.test(combo);
}
