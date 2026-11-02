import { describe, it, expect } from 'vitest';
import {
  calculateAdaptiveZoom,
  computeViewportBounds,
  DEFAULT_ZOOM_BREAKPOINT,
  MIN_ZOOM,
} from './viewport';

describe('自适应 Zoom 算法 (calculateAdaptiveZoom)', () => {
  // REQ-002-AC-003: 当视口可用宽度达到或超过断点(850px)时，保持 1.0 原始缩放
  it('当宽度大于或等于 850px 时，返回 1.0', () => {
    expect(calculateAdaptiveZoom(850)).toBe(1.0);
    expect(calculateAdaptiveZoom(1000)).toBe(1.0);
    expect(calculateAdaptiveZoom(1920)).toBe(1.0);
  });

  // REQ-002-AC-003: 当视口可用宽度小于 850px 时，线性计算缩放比例 width / 850
  it('当宽度在 850px 以下且计算值大于 0.75 时，按比例缩小', () => {
    // 849 / 850 ≈ 0.9988
    expect(calculateAdaptiveZoom(849)).toBeCloseTo(849 / 850, 4);
    // 680 / 850 = 0.8
    expect(calculateAdaptiveZoom(680)).toBeCloseTo(0.8, 4);
    // 765 / 850 = 0.9
    expect(calculateAdaptiveZoom(765)).toBeCloseTo(0.9, 4);
  });

  // REQ-002-AC-003: 缩放因子不低于 0.75，防止页面折叠为移动端抽屉
  it('当宽度计算比例低于 0.75 时，保底返回 0.75', () => {
    // 600 / 850 ≈ 0.7058 -> clamp to 0.75
    expect(calculateAdaptiveZoom(600)).toBe(0.75);
    // 300 / 850 ≈ 0.3529 -> clamp to 0.75
    expect(calculateAdaptiveZoom(300)).toBe(0.75);
  });

  // 边界保护与异常值处理
  it('当宽度为 0 或负数等极端值时，保底返回 0.75', () => {
    expect(calculateAdaptiveZoom(0)).toBe(0.75);
    expect(calculateAdaptiveZoom(-100)).toBe(0.75);
  });

  // 自定义断点与最小缩放参数
  it('支持自定义 breakpoint 与 minZoom 参数', () => {
    expect(calculateAdaptiveZoom(700, 1000, 0.5)).toBeCloseTo(0.7, 4);
    expect(calculateAdaptiveZoom(400, 1000, 0.5)).toBe(0.5);
    expect(calculateAdaptiveZoom(1200, 1000, 0.5)).toBe(1.0);
  });

  it('默认导出配置常量与设计规范一致', () => {
    expect(DEFAULT_ZOOM_BREAKPOINT).toBe(850);
    expect(MIN_ZOOM).toBe(0.75);
  });
});

describe('视口物理尺寸计算 (computeViewportBounds)', () => {
  const container = { width: 1600, height: 900 };

  it('单视口布局 (single) 应完全铺满可用区域', () => {
    const bounds = computeViewportBounds('single', container);
    expect(bounds).toHaveLength(1);
    expect(bounds[0]).toEqual({
      x: 0,
      y: 0,
      width: 1600,
      height: 900,
    });
  });

  it('双视口分栏布局 (dual) 应左右等分铺满', () => {
    const bounds = computeViewportBounds('dual', container);
    expect(bounds).toHaveLength(2);
    expect(bounds[0]).toEqual({
      x: 0,
      y: 0,
      width: 800,
      height: 900,
    });
    expect(bounds[1]).toEqual({
      x: 800,
      y: 0,
      width: 800,
      height: 900,
    });
  });

  it('四宫格布局 (grid) 应 2x2 四等分铺满', () => {
    const bounds = computeViewportBounds('grid', container);
    expect(bounds).toHaveLength(4);
    expect(bounds[0]).toEqual({ x: 0, y: 0, width: 800, height: 450 });
    expect(bounds[1]).toEqual({ x: 800, y: 0, width: 800, height: 450 });
    expect(bounds[2]).toEqual({ x: 0, y: 450, width: 800, height: 450 });
    expect(bounds[3]).toEqual({ x: 800, y: 450, width: 800, height: 450 });
  });

  it('带鱼屏布局 (ultrawide) 应按视口数量水平等分', () => {
    const bounds = computeViewportBounds('ultrawide', container, 4);
    expect(bounds).toHaveLength(4);
    expect(bounds[0]).toEqual({ x: 0, y: 0, width: 400, height: 900 });
    expect(bounds[1]).toEqual({ x: 400, y: 0, width: 400, height: 900 });
    expect(bounds[2]).toEqual({ x: 800, y: 0, width: 400, height: 900 });
    expect(bounds[3]).toEqual({ x: 1200, y: 0, width: 400, height: 900 });
  });

  it('主辅布局 (main-sub) 应分配左侧主屏与右侧垂直辅屏', () => {
    // 3 个视口：1 主 + 2 辅
    const bounds = computeViewportBounds('main-sub', container, 3);
    expect(bounds).toHaveLength(3);
    // 主视口占据 65% 宽: 1600 * 0.65 = 1040
    expect(bounds[0]).toEqual({ x: 0, y: 0, width: 1040, height: 900 });
    // 辅视口占据剩余 35% 宽: 560，垂直平分 900 为 450
    expect(bounds[1]).toEqual({ x: 1040, y: 0, width: 560, height: 450 });
    expect(bounds[2]).toEqual({ x: 1040, y: 450, width: 560, height: 450 });
  });

  it('奇数像素尺寸时应无缝拼接，无像素间隙与重叠', () => {
    const oddContainer = { width: 1601, height: 901 };
    const dualBounds = computeViewportBounds('dual', oddContainer);
    expect(dualBounds[0].width + dualBounds[1].width).toBe(1601);
    expect(dualBounds[1].x).toBe(dualBounds[0].width);

    const gridBounds = computeViewportBounds('grid', oddContainer);
    expect(gridBounds[0].width + gridBounds[1].width).toBe(1601);
    expect(gridBounds[0].height + gridBounds[2].height).toBe(901);
  });

  it('当容器尺寸小于等于 0 时应安全防御，返回空或 0 尺寸视口', () => {
    const zeroBounds = computeViewportBounds('single', { width: 0, height: 0 });
    expect(zeroBounds).toEqual([{ x: 0, y: 0, width: 0, height: 0 }]);
  });
});
