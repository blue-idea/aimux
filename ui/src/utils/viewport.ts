import {
  DEFAULT_ZOOM_BREAKPOINT,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_MAIN_SUB_SPLIT_RATIO,
  type LayoutMode,
} from '../config/viewport';

export {
  DEFAULT_ZOOM_BREAKPOINT,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_MAIN_SUB_SPLIT_RATIO,
  type LayoutMode,
};

/**
 * 视口物理坐标与尺寸定义
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 视口容器可用区域尺寸
 */
export interface ViewportContainer {
  width: number;
  height: number;
}

/**
 * 自适应 Zoom 算法（对应 v1.REQ-002-AC-003）
 * 当视口可用宽度低于 breakpoint (默认 850px) 时，按比例缩小，保底 minZoom (0.75)；
 * 当宽度达到或超过 breakpoint 时，保持 1.0 (原始尺寸)。
 *
 * @param width 视口当前分配的宽度 (px)
 * @param breakpoint 触发自适应缩放的断点阈值，默认 850
 * @param minZoom 最小允许缩放比例，默认 0.75
 * @returns 缩放系数 number (0.75 ~ 1.0)
 */
export function calculateAdaptiveZoom(
  width: number,
  breakpoint: number = DEFAULT_ZOOM_BREAKPOINT,
  minZoom: number = MIN_ZOOM
): number {
  if (width >= breakpoint) {
    return MAX_ZOOM;
  }
  const factor = width / breakpoint;
  return Math.max(minZoom, Math.min(MAX_ZOOM, factor));
}

/**
 * 计算多视口在容器内的物理布局 Bounds（对应 v1.REQ-002-AC-001）
 * 支持 5 种布局模式：single、dual、grid、ultrawide、main-sub，
 * 计算结果进行整数像素取整并消除缝隙。
 *
 * @param mode 布局模式
 * @param container 容器可用宽高
 * @param count 视口数量（用于 ultrawide 或 main-sub 自定义视口数）
 * @returns 视口物理坐标矩形列表
 */
export function computeViewportBounds(
  mode: LayoutMode,
  container: ViewportContainer,
  count?: number,
  splitRatio?: number
): Rect[] {
  const { width, height } = container;

  // 容器尺寸异常时的防御性保护
  if (width <= 0 || height <= 0) {
    return [{ x: 0, y: 0, width: 0, height: 0 }];
  }

  switch (mode) {
    case 'single': {
      return [{ x: 0, y: 0, width, height }];
    }

    case 'dual': {
      const ratio = splitRatio && splitRatio > 0 && splitRatio < 1 ? splitRatio : 0.5;
      const w1 = Math.round(width * ratio);
      const w2 = width - w1;
      return [
        { x: 0, y: 0, width: w1, height },
        { x: w1, y: 0, width: w2, height },
      ];
    }

    case 'grid': {
      const w1 = Math.floor(width / 2);
      const w2 = width - w1;
      const h1 = Math.floor(height / 2);
      const h2 = height - h1;
      return [
        { x: 0, y: 0, width: w1, height: h1 },
        { x: w1, y: 0, width: w2, height: h1 },
        { x: 0, y: h1, width: w1, height: h2 },
        { x: w1, y: h1, width: w2, height: h2 },
      ];
    }

    case 'ultrawide': {
      const n = count && count > 0 ? count : 4;
      const bounds: Rect[] = [];
      const baseWidth = Math.floor(width / n);
      let currentX = 0;

      for (let i = 0; i < n; i++) {
        const isLast = i === n - 1;
        const colWidth = isLast ? width - currentX : baseWidth;
        bounds.push({
          x: currentX,
          y: 0,
          width: colWidth,
          height,
        });
        currentX += colWidth;
      }
      return bounds;
    }

    case 'main-sub': {
      const totalCount = count && count > 1 ? count : 2;
      const ratio = splitRatio && splitRatio > 0 && splitRatio < 1 ? splitRatio : DEFAULT_MAIN_SUB_SPLIT_RATIO;
      const mainWidth = Math.round(width * ratio);
      const subWidth = width - mainWidth;
      const subCount = totalCount - 1;

      const bounds: Rect[] = [
        { x: 0, y: 0, width: mainWidth, height },
      ];

      const baseSubHeight = Math.floor(height / subCount);
      let currentY = 0;

      for (let i = 0; i < subCount; i++) {
        const isLast = i === subCount - 1;
        const subH = isLast ? height - currentY : baseSubHeight;
        bounds.push({
          x: mainWidth,
          y: currentY,
          width: subWidth,
          height: subH,
        });
        currentY += subH;
      }

      return bounds;
    }

    default: {
      return [{ x: 0, y: 0, width, height }];
    }
  }
}
