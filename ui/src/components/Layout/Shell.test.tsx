import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Shell } from './Shell';
import { SettingsProvider } from '@/contexts/SettingsProvider';

describe('Shell 主工作台 Glassmorphic 外壳 (REQ-002-AC-001)', () => {
  it('正确渲染无边框外壳结构（Header、控制栏、底栏与主工作台区）', () => {
    render(
      <SettingsProvider>
        <Shell />
      </SettingsProvider>
    );

    // 验证 Header 区域与布局切换器
    expect(screen.getByRole('group', { name: /layout options/i })).toBeInTheDocument();

    // 验证主视口网格与视口存在
    expect(screen.getByTestId('workspace-shell')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-content')).toBeInTheDocument();

    // 验证底栏与控制栏存在
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
