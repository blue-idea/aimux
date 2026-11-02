import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Splitter } from './Splitter';

describe('Splitter 拖拽组件 (REQ-002-AC-002)', () => {
  it('正确渲染垂直与水平分割条及 ARIA 属性', () => {
    const { rerender } = render(<Splitter orientation="vertical" />);
    const splitter = screen.getByRole('separator');
    expect(splitter).toBeInTheDocument();
    expect(splitter).toHaveAttribute('aria-orientation', 'vertical');

    rerender(<Splitter orientation="horizontal" />);
    expect(splitter).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('鼠标按下拖拽时应显示尺寸提示气泡并在松开后隐藏 (REQ-002-AC-002)', () => {
    const handleDrag = vi.fn();
    render(
      <Splitter
        orientation="vertical"
        onDrag={handleDrag}
        currentSizeTooltip="65% | 1040px"
      />
    );

    const splitter = screen.getByRole('separator');

    // 默认未拖拽时不显示气泡
    expect(screen.queryByTestId('splitter-tooltip')).not.toBeInTheDocument();

    // 触发 mousedown
    fireEvent.mouseDown(splitter, { clientX: 500, clientY: 300 });

    // 拖拽中出现尺寸提示气泡
    const tooltip = screen.getByTestId('splitter-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('65% | 1040px');

    // 移动鼠标
    fireEvent.mouseMove(window, { clientX: 550, clientY: 300 });
    expect(handleDrag).toHaveBeenCalled();

    // 释放鼠标
    fireEvent.mouseUp(window);
    expect(screen.queryByTestId('splitter-tooltip')).not.toBeInTheDocument();
  });
});
