export const DESKTOP_BREAKPOINT_WIDTH = 850;
export const MIN_ZOOM_FACTOR = 0.75;
export const MAX_ZOOM_FACTOR = 1.0;

/**
 * 智能抗折叠动态缩放算法
 * 当视口可用宽度小于 850px 时，动态计算最佳缩放因子：max(0.75, width / 850)
 * 避免各大 AI 网页因宽度不足自动坍塌为移动端抽屉菜单
 */
export function calculateDynamicZoom(
  width: number,
  breakpoint = DESKTOP_BREAKPOINT_WIDTH,
  minZoom = MIN_ZOOM_FACTOR
): number {
  if (width <= 0) {
    return MAX_ZOOM_FACTOR;
  }
  if (width >= breakpoint) {
    return MAX_ZOOM_FACTOR;
  }
  const factor = width / breakpoint;
  return Math.max(minZoom, Math.min(MAX_ZOOM_FACTOR, factor));
}

/**
 * 将浮点缩放比例转换为整型百分比数字 (例如 0.85 -> 85)
 */
export function formatZoomPercentage(zoomFactor: number): number {
  return Math.round(zoomFactor * 100);
}
