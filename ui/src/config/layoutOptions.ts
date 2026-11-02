import {
  Square,
  Columns2,
  LayoutGrid,
  GalleryHorizontal,
  LayoutPanelLeft,
} from 'lucide-react';
import type { LayoutMode } from './viewport';

export interface LayoutOption {
  id: LayoutMode;
  label: string;
  shortcut: string;
  icon: typeof Square;
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: 'single', label: 'Single', shortcut: 'Ctrl+1', icon: Square },
  { id: 'dual', label: 'Dual', shortcut: 'Ctrl+2', icon: Columns2 },
  { id: 'grid', label: 'Grid', shortcut: 'Ctrl+3', icon: LayoutGrid },
  { id: 'ultrawide', label: 'Ultrawide', shortcut: 'Ctrl+4', icon: GalleryHorizontal },
  { id: 'main-sub', label: 'Main-Sub', shortcut: 'Ctrl+5', icon: LayoutPanelLeft },
];
