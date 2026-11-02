package window

import (
	"fmt"
	"path/filepath"
	"testing"

	"aimux/app/storage"
	"aimux/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockWindowHandle struct {
	id         uint
	name       string
	visible    bool
	bounds     Rect
	zoom       float64
	closed     bool
	showCount  int
	hideCount  int
}

func newMockWindow(id uint, name string) *mockWindowHandle {
	return &mockWindowHandle{
		id:      id,
		name:    name,
		visible: false,
	}
}

func (m *mockWindowHandle) ID() uint               { return m.id }
func (m *mockWindowHandle) Name() string           { return m.name }
func (m *mockWindowHandle) Show()                  { m.visible = true; m.showCount++ }
func (m *mockWindowHandle) Hide()                  { m.visible = false; m.hideCount++ }
func (m *mockWindowHandle) Close()                 { m.closed = true }
func (m *mockWindowHandle) Focus()                 {}
func (m *mockWindowHandle) Bounds() Rect           { return m.bounds }
func (m *mockWindowHandle) SetBounds(bounds Rect)  { m.bounds = bounds }
func (m *mockWindowHandle) IsVisible() bool        { return m.visible }
func (m *mockWindowHandle) SetZoom(zoom float64)   { m.zoom = zoom }

func setupTestManager(t *testing.T) (*WindowManager, string) {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "config.json")
	cfg := storage.DefaultAppConfig()

	mgr := NewWindowManager(ManagerConfig{
		AppConfig:  cfg,
		ConfigPath: configPath,
	})
	return mgr, configPath
}

func TestWindowManager_SetLayout(t *testing.T) {
	mgr, configPath := setupTestManager(t)

	t.Run("成功切换标准布局模式并持久化到文件 (REQ-002-AC-001)", func(t *testing.T) {
		err := mgr.SetLayout(config.LayoutDual)
		require.NoError(t, err)
		assert.Equal(t, config.LayoutDual, mgr.GetActiveLayout())

		// 验证文件持久化
		savedCfg, err := storage.LoadConfig(configPath)
		require.NoError(t, err)
		assert.Equal(t, config.LayoutDual, savedCfg.Layout.ActiveLayout)
	})

	t.Run("兼容别名自动映射", func(t *testing.T) {
		err := mgr.SetLayout("grid4")
		require.NoError(t, err)
		assert.Equal(t, config.LayoutGrid, mgr.GetActiveLayout())
	})

	t.Run("非法布局报错拒绝", func(t *testing.T) {
		err := mgr.SetLayout("non-existent-layout")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "unsupported layout")
	})
}

func TestWindowManager_SetViewportBounds(t *testing.T) {
	mgr, _ := setupTestManager(t)
	win := newMockWindow(1, "chatgpt")
	mgr.RegisterViewport("chatgpt", win)

	t.Run("成功为已注册视口设置物理像素坐标 (REQ-002-AC-002)", func(t *testing.T) {
		targetRect := Rect{X: 100, Y: 100, Width: 800, Height: 600}
		err := mgr.SetViewportBounds("chatgpt", targetRect)
		require.NoError(t, err)
		assert.Equal(t, targetRect, win.Bounds())
	})

	t.Run("未注册视口报错", func(t *testing.T) {
		err := mgr.SetViewportBounds("unknown-vp", Rect{Width: 100, Height: 100})
		require.Error(t, err)
		assert.Contains(t, err.Error(), "viewport not found")
	})

	t.Run("非法负尺寸拒绝", func(t *testing.T) {
		err := mgr.SetViewportBounds("chatgpt", Rect{Width: -10, Height: 100})
		require.Error(t, err)
		assert.Contains(t, err.Error(), "invalid bounds dimensions")
	})
}

func TestWindowManager_DetachAndAttachViewport(t *testing.T) {
	mgr, _ := setupTestManager(t)
	win := newMockWindow(1, "claude")
	mgr.RegisterViewport("claude", win)

	err := mgr.ActivateViewport("claude")
	require.NoError(t, err)

	state, err := mgr.GetViewportState("claude")
	require.NoError(t, err)
	assert.Equal(t, StateVisible, state)

	t.Run("视口分离为独立桌面窗口 (REQ-002-AC-004)", func(t *testing.T) {
		err := mgr.DetachViewport("claude")
		require.NoError(t, err)

		state, err := mgr.GetViewportState("claude")
		require.NoError(t, err)
		assert.Equal(t, StateDetached, state)
	})

	t.Run("重复分离已分离视口报错", func(t *testing.T) {
		err := mgr.DetachViewport("claude")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "already detached")
	})

	t.Run("重新附着回主工作台恢复为 Visible", func(t *testing.T) {
		err := mgr.AttachViewport("claude")
		require.NoError(t, err)

		state, err := mgr.GetViewportState("claude")
		require.NoError(t, err)
		assert.Equal(t, StateVisible, state)
	})

	t.Run("不存在的视口附着或分离或查询报错", func(t *testing.T) {
		err := mgr.AttachViewport("not-found")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "viewport not found")

		err = mgr.DetachViewport("not-found")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "viewport not found")

		err = mgr.ActivateViewport("not-found")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "viewport not found")

		_, err = mgr.GetViewportState("not-found")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "viewport not found")
	})

	t.Run("设置 ShellWindow 句柄不崩溃", func(t *testing.T) {
		shellWin := newMockWindow(100, "shell")
		mgr.SetShellWindow(shellWin)
		assert.Equal(t, uint(100), shellWin.ID())
	})
}

func TestWindowManager_ShowSpotlight(t *testing.T) {
	mgr, _ := setupTestManager(t)
	spotlightWin := newMockWindow(99, "spotlight")
	mgr.SetSpotlightWindow(spotlightWin)

	t.Run("显示 Spotlight 悬浮窗", func(t *testing.T) {
		err := mgr.ShowSpotlight(true)
		require.NoError(t, err)
		assert.True(t, spotlightWin.IsVisible())
	})

	t.Run("隐藏 Spotlight 悬浮窗", func(t *testing.T) {
		err := mgr.ShowSpotlight(false)
		require.NoError(t, err)
		assert.False(t, spotlightWin.IsVisible())
	})

	t.Run("未注册 Spotlight 窗口时报错", func(t *testing.T) {
		emptyMgr := NewWindowManager(ManagerConfig{})
		err := emptyMgr.ShowSpotlight(true)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "spotlight window is not registered")
	})
}

func TestWindowManager_LRUSuspension(t *testing.T) {
	mgr, _ := setupTestManager(t)

	// 注册 11 个视口
	windows := make([]*mockWindowHandle, 11)
	for i := 0; i < 11; i++ {
		id := fmt.Sprintf("vp-%d", i+1)
		win := newMockWindow(uint(i+1), id)
		windows[i] = win
		mgr.RegisterViewport(id, win)
	}

	// 激活前 10 个视口
	for i := 0; i < 10; i++ {
		id := fmt.Sprintf("vp-%d", i+1)
		err := mgr.ActivateViewport(id)
		require.NoError(t, err)
		assert.True(t, windows[i].IsVisible())
	}

	t.Run("激活第 11 个视口自动挂起最旧视口 (vp-1)", func(t *testing.T) {
		err := mgr.ActivateViewport("vp-11")
		require.NoError(t, err)

		// vp-1 应当被挂起并隐藏
		state1, err := mgr.GetViewportState("vp-1")
		require.NoError(t, err)
		assert.Equal(t, StateSuspended, state1)
		assert.False(t, windows[0].IsVisible())

		// vp-11 应当可见
		state11, err := mgr.GetViewportState("vp-11")
		require.NoError(t, err)
		assert.Equal(t, StateVisible, state11)
		assert.True(t, windows[10].IsVisible())
	})

	t.Run("重新激活被挂起的 vp-1 恢复可见并驱逐当前最旧视口 (vp-2)", func(t *testing.T) {
		err := mgr.ActivateViewport("vp-1")
		require.NoError(t, err)

		state1, err := mgr.GetViewportState("vp-1")
		require.NoError(t, err)
		assert.Equal(t, StateVisible, state1)
		assert.True(t, windows[0].IsVisible())

		// vp-2 变为最旧，应当被挂起
		state2, err := mgr.GetViewportState("vp-2")
		require.NoError(t, err)
		assert.Equal(t, StateSuspended, state2)
		assert.False(t, windows[1].IsVisible())
	})
}
