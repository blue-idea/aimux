import type { MessageKey } from '@/lib/i18n';
import type { LucideIcon } from 'lucide-react';
import { Columns2, GalleryHorizontal, LayoutGrid, LayoutPanelLeft, Square } from 'lucide-react';

export type ModelId = 'chatgpt' | 'claude' | 'deepseek' | 'gemini' | 'kimi' | 'perplexity';

export interface AiModel {
  id: ModelId;
  name: string;
  color: string;
}

export const AI_MODELS: AiModel[] = [
  { id: 'chatgpt', name: 'ChatGPT', color: '#10A37F' },
  { id: 'claude', name: 'Claude', color: '#E07A4F' },
  { id: 'deepseek', name: 'DeepSeek', color: '#38BDF8' },
  { id: 'gemini', name: 'Gemini', color: '#FACC15' },
  { id: 'kimi', name: 'Kimi', color: '#2DD4BF' },
  { id: 'perplexity', name: 'Perplexity', color: '#A3E635' },
];

export const MAX_ACTIVE_MODELS = 4;

export const DEFAULT_ACTIVE_MODELS: ModelId[] = ['chatgpt', 'claude', 'deepseek', 'gemini'];

export interface GridTemplate {
  columns: string;
  rows: string;
}

export interface WorkspaceLayout {
  id: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  capacity: number;
  template: (count: number) => GridTemplate;
  stackedLead: boolean;
}

const EQUAL_COLUMNS = (count: number) => `repeat(${count}, minmax(0, 1fr))`;

export const LAYOUTS: WorkspaceLayout[] = [
  {
    id: 'single',
    labelKey: 'layout.single',
    icon: Square,
    capacity: 1,
    template: () => ({ columns: '1fr', rows: '1fr' }),
    stackedLead: false,
  },
  {
    id: 'split',
    labelKey: 'layout.split',
    icon: Columns2,
    capacity: 2,
    template: (count) => ({ columns: EQUAL_COLUMNS(count), rows: '1fr' }),
    stackedLead: false,
  },
  {
    id: 'grid',
    labelKey: 'layout.grid',
    icon: LayoutGrid,
    capacity: 4,
    template: (count) =>
      count <= 2
        ? { columns: EQUAL_COLUMNS(count), rows: '1fr' }
        : { columns: EQUAL_COLUMNS(2), rows: 'repeat(2, minmax(0, 1fr))' },
    stackedLead: false,
  },
  {
    id: 'wide',
    labelKey: 'layout.wide',
    icon: GalleryHorizontal,
    capacity: 4,
    template: (count) => ({ columns: EQUAL_COLUMNS(count), rows: '1fr' }),
    stackedLead: false,
  },
  {
    id: 'main',
    labelKey: 'layout.main',
    icon: LayoutPanelLeft,
    capacity: 4,
    template: (count) =>
      count <= 1
        ? { columns: '1fr', rows: '1fr' }
        : { columns: 'minmax(0, 2fr) minmax(0, 1fr)', rows: `repeat(${count - 1}, minmax(0, 1fr))` },
    stackedLead: true,
  },
];

export interface ResolutionPreset {
  id: string;
  labelKey: MessageKey;
  width: number | null;
  height: number | null;
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { id: 'fill', labelKey: 'res.fill', width: null, height: null },
  { id: 'laptop', labelKey: 'res.laptop', width: 1440, height: 900 },
  { id: 'fhd', labelKey: 'res.fhd', width: 1920, height: 1080 },
  { id: '2k', labelKey: 'res.2k', width: 1600, height: 1000 },
  { id: '4k', labelKey: 'res.4k', width: 2560, height: 1600 },
];
