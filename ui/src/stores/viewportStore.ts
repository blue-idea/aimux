import { create } from 'zustand';
import {
  computeViewportBounds,
  type Rect,
  type ViewportContainer,
} from '../utils/viewport';
import {
  DEFAULT_MAIN_SUB_SPLIT_RATIO,
  type LayoutMode,
} from '../config/viewport';

export interface ViewportState {
  layoutMode: LayoutMode;
  activeViewports: string[];
  containerSize: ViewportContainer;
  splitRatio: number;
  viewportBounds: Record<string, Rect>;
  isDraggingSplitter: boolean;

  setLayoutMode: (mode: LayoutMode) => void;
  setContainerSize: (size: ViewportContainer) => void;
  setSplitRatio: (ratio: number) => void;
  setActiveViewports: (ids: string[]) => void;
  addViewport: (id: string) => void;
  removeViewport: (id: string) => void;
  reorderViewports: (ids: string[]) => void;
  setDraggingSplitter: (dragging: boolean) => void;
  syncWithBackend: () => Promise<void>;
}

function calculateBoundsMap(
  mode: LayoutMode,
  container: ViewportContainer,
  viewports: string[],
  splitRatio: number
): Record<string, Rect> {
  const effectiveRatio = mode === 'main-sub' ? splitRatio : undefined;
  const bounds = computeViewportBounds(mode, container, viewports.length, effectiveRatio);
  const result: Record<string, Rect> = {};
  viewports.forEach((id, index) => {
    if (bounds[index]) {
      result[id] = bounds[index];
    }
  });
  return result;
}

export const useViewportStore = create<ViewportState>((set, get) => ({
  layoutMode: 'grid',
  activeViewports: ['chatgpt', 'claude', 'deepseek', 'gemini'],
  containerSize: { width: 1600, height: 1000 },
  splitRatio: DEFAULT_MAIN_SUB_SPLIT_RATIO,
  viewportBounds: calculateBoundsMap(
    'grid',
    { width: 1600, height: 1000 },
    ['chatgpt', 'claude', 'deepseek', 'gemini'],
    DEFAULT_MAIN_SUB_SPLIT_RATIO
  ),
  isDraggingSplitter: false,

  setLayoutMode: (mode) => {
    const { containerSize, activeViewports, splitRatio } = get();
    const newBounds = calculateBoundsMap(mode, containerSize, activeViewports, splitRatio);
    set({ layoutMode: mode, viewportBounds: newBounds });
    get().syncWithBackend().catch(() => {});
  },

  setContainerSize: (size) => {
    const { layoutMode, activeViewports, splitRatio } = get();
    const newBounds = calculateBoundsMap(layoutMode, size, activeViewports, splitRatio);
    set({ containerSize: size, viewportBounds: newBounds });
    get().syncWithBackend().catch(() => {});
  },

  setSplitRatio: (ratio) => {
    const clamped = Math.max(0.1, Math.min(0.9, ratio));
    const { layoutMode, containerSize, activeViewports } = get();
    const newBounds = calculateBoundsMap(layoutMode, containerSize, activeViewports, clamped);
    set({ splitRatio: clamped, viewportBounds: newBounds });
    get().syncWithBackend().catch(() => {});
  },

  setActiveViewports: (ids) => {
    const { layoutMode, containerSize, splitRatio } = get();
    const newBounds = calculateBoundsMap(layoutMode, containerSize, ids, splitRatio);
    set({ activeViewports: ids, viewportBounds: newBounds });
    get().syncWithBackend().catch(() => {});
  },

  addViewport: (id) => {
    const { activeViewports, layoutMode, containerSize, splitRatio } = get();
    if (activeViewports.includes(id)) return;
    const updated = [...activeViewports, id];
    const newBounds = calculateBoundsMap(layoutMode, containerSize, updated, splitRatio);
    set({ activeViewports: updated, viewportBounds: newBounds });
    get().syncWithBackend().catch(() => {});
  },

  removeViewport: (id) => {
    const { activeViewports, layoutMode, containerSize, splitRatio } = get();
    const updated = activeViewports.filter((item) => item !== id);
    const newBounds = calculateBoundsMap(layoutMode, containerSize, updated, splitRatio);
    set({ activeViewports: updated, viewportBounds: newBounds });
    get().syncWithBackend().catch(() => {});
  },

  reorderViewports: (ids) => {
    const { layoutMode, containerSize, splitRatio } = get();
    const newBounds = calculateBoundsMap(layoutMode, containerSize, ids, splitRatio);
    set({ activeViewports: ids, viewportBounds: newBounds });
    get().syncWithBackend().catch(() => {});
  },

  setDraggingSplitter: (dragging) => {
    set({ isDraggingSplitter: dragging });
  },

  syncWithBackend: async () => {
    const { viewportBounds } = get();
    // 如果在 Wails 桌面环境中，调用 Wails 暴露的 SetViewportBounds
    const wailsWindow = window as unknown as {
      go?: {
        main?: {
          App?: {
            SetViewportBounds?: (id: string, bounds: Rect) => Promise<void>;
          };
        };
      };
    };

    const fn = wailsWindow.go?.main?.App?.SetViewportBounds;
    if (typeof fn === 'function') {
      for (const [id, bounds] of Object.entries(viewportBounds)) {
        await fn(id, bounds).catch(() => {});
      }
    }
  },
}));
