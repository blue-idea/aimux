import { describe, it, expect, beforeEach } from 'vitest';
import { useViewportStore } from './viewportStore';

describe('useViewportStore 状态管理 (REQ-002-AC-001, REQ-002-AC-002)', () => {
  beforeEach(() => {
    // 重置 store 状态
    useViewportStore.setState({
      layoutMode: 'grid',
      activeViewports: ['chatgpt', 'claude', 'deepseek', 'gemini'],
      containerSize: { width: 1600, height: 1000 },
      splitRatio: 0.65,
      viewportBounds: {},
      isDraggingSplitter: false,
    });
  });

  it('初始状态应包含默认 grid 布局与预置活跃视口', () => {
    const state = useViewportStore.getState();
    expect(state.layoutMode).toBe('grid');
    expect(state.activeViewports).toEqual(['chatgpt', 'claude', 'deepseek', 'gemini']);
    expect(state.splitRatio).toBe(0.65);
  });

  it('切换布局模式 (REQ-002-AC-001) 应正确更新 layoutMode 并重新计算各视口 Bounds', () => {
    const { setLayoutMode } = useViewportStore.getState();

    // 切换至 dual 布局
    setLayoutMode('dual');
    let state = useViewportStore.getState();
    expect(state.layoutMode).toBe('dual');
    expect(state.viewportBounds['chatgpt']).toEqual({ x: 0, y: 0, width: 800, height: 1000 });
    expect(state.viewportBounds['claude']).toEqual({ x: 800, y: 0, width: 800, height: 1000 });

    // 切换至 single 布局
    setLayoutMode('single');
    state = useViewportStore.getState();
    expect(state.layoutMode).toBe('single');
    expect(state.viewportBounds['chatgpt']).toEqual({ x: 0, y: 0, width: 1600, height: 1000 });

    // 切换至 main-sub 布局
    setLayoutMode('main-sub');
    state = useViewportStore.getState();
    expect(state.layoutMode).toBe('main-sub');
    expect(state.viewportBounds['chatgpt']).toEqual({ x: 0, y: 0, width: 1040, height: 1000 });
  });

  it('容器尺寸变化 (resize) 时应触发 Bounds 动态重算 (REQ-002-AC-002)', () => {
    const { setLayoutMode, setContainerSize } = useViewportStore.getState();
    setLayoutMode('dual');
    setContainerSize({ width: 1200, height: 800 });

    const state = useViewportStore.getState();
    expect(state.viewportBounds['chatgpt']).toEqual({ x: 0, y: 0, width: 600, height: 800 });
    expect(state.viewportBounds['claude']).toEqual({ x: 600, y: 0, width: 600, height: 800 });
  });

  it('调整 Splitter 分割比例时应实时更新 Bounds (REQ-002-AC-002)', () => {
    const { setLayoutMode, setSplitRatio } = useViewportStore.getState();
    setLayoutMode('main-sub');

    // 调整主视口占比为 70%
    setSplitRatio(0.7);
    const state = useViewportStore.getState();
    expect(state.splitRatio).toBe(0.7);
    // 1600 * 0.7 = 1120
    expect(state.viewportBounds['chatgpt'].width).toBe(1120);
    expect(state.viewportBounds['claude'].width).toBe(480);
  });

  it('添加与移除视口时应约束 Bounds 数量', () => {
    const { addViewport, removeViewport } = useViewportStore.getState();

    removeViewport('gemini');
    let state = useViewportStore.getState();
    expect(state.activeViewports).toEqual(['chatgpt', 'claude', 'deepseek']);
    expect(state.viewportBounds['gemini']).toBeUndefined();

    addViewport('kimi');
    state = useViewportStore.getState();
    expect(state.activeViewports).toContain('kimi');
    expect(state.viewportBounds['kimi']).toBeDefined();
  });
});
