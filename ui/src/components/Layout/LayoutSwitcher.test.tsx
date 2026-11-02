import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayoutSwitcher } from './LayoutSwitcher';

describe('LayoutSwitcher 布局切换控件 (REQ-002-AC-001)', () => {
  it('渲染全部 5 种布局模式选项 (single, dual, grid, ultrawide, main-sub)', () => {
    const handleSelect = vi.fn();
    render(<LayoutSwitcher current="grid" onSelect={handleSelect} />);

    expect(screen.getByRole('button', { name: /single/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dual/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /grid/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ultrawide/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /main-sub/i })).toBeInTheDocument();
  });

  it('正确高亮当前活跃布局，并在点击其他选项时触发回调 (REQ-002-AC-001)', () => {
    const handleSelect = vi.fn();
    render(<LayoutSwitcher current="dual" onSelect={handleSelect} />);

    const dualBtn = screen.getByRole('button', { name: /dual/i });
    expect(dualBtn).toHaveAttribute('data-active', 'true');

    const ultrawideBtn = screen.getByRole('button', { name: /ultrawide/i });
    expect(ultrawideBtn).toHaveAttribute('data-active', 'false');

    fireEvent.click(ultrawideBtn);
    expect(handleSelect).toHaveBeenCalledWith('ultrawide');
  });
});
