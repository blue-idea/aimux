package window

import (
	"errors"
	"fmt"
	"sync"

	"aimux/app/storage"
	"aimux/config"
)

// ManagerConfig WindowManager 运行时配置参数
type ManagerConfig struct {
	AppConfig  *storage.AppConfig
	ConfigPath string
	LRULimit   int
}

type viewportEntry struct {
	id     string
	handle WindowHandle
	state  ViewportState
	bounds Rect
}

// WindowManager 管理主工作台 Shell、Spotlight 和独立子窗口及视口生命周期
type WindowManager struct {
	mu           sync.RWMutex
	appConfig    *storage.AppConfig
	configPath   string
	activeLayout string
	lru          *LRUCache

	shellWin     WindowHandle
	spotlightWin WindowHandle
	viewports    map[string]*viewportEntry
}

// NewWindowManager 创建并初始化 WindowManager
func NewWindowManager(cfg ManagerConfig) *WindowManager {
	limit := cfg.LRULimit
	if limit <= 0 {
		limit = config.DefaultLRUCacheLimit
	}

	initialLayout := config.DefaultActiveLayout
	if cfg.AppConfig != nil && cfg.AppConfig.Layout.ActiveLayout != "" {
		if norm, err := NormalizeLayoutMode(cfg.AppConfig.Layout.ActiveLayout); err == nil {
			initialLayout = norm
		}
	}

	return &WindowManager{
		appConfig:    cfg.AppConfig,
		configPath:   cfg.ConfigPath,
		activeLayout: initialLayout,
		lru:          NewLRUCache(limit),
		viewports:    make(map[string]*viewportEntry),
	}
}

// SetShellWindow 注册 Shell 主窗口句柄
func (m *WindowManager) SetShellWindow(win WindowHandle) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.shellWin = win
}

// SetSpotlightWindow 注册 Spotlight 窗口句柄
func (m *WindowManager) SetSpotlightWindow(win WindowHandle) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.spotlightWin = win
}

// RegisterViewport 注册一个视口窗口句柄
func (m *WindowManager) RegisterViewport(id string, win WindowHandle) {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry, exists := m.viewports[id]
	if !exists {
		entry = &viewportEntry{
			id:    id,
			state: StateHidden,
		}
		m.viewports[id] = entry
	}
	entry.handle = win
}

// SetLayout 切换主工作台布局模式并持久化配置 (对应 REQ-002-AC-001)
func (m *WindowManager) SetLayout(layout string) error {
	norm, err := NormalizeLayoutMode(layout)
	if err != nil {
		return fmt.Errorf("unsupported layout: %w", err)
	}

	m.mu.Lock()
	m.activeLayout = norm
	cfg := m.appConfig
	cfgPath := m.configPath
	m.mu.Unlock()

	if cfg != nil {
		cfg.Layout.ActiveLayout = norm
		if cfgPath != "" {
			if err := storage.SaveConfig(cfg, cfgPath); err != nil {
				return fmt.Errorf("failed to persist layout configuration: %w", err)
			}
		}
	}

	return nil
}

// GetActiveLayout 获取当前生效的布局模式
func (m *WindowManager) GetActiveLayout() string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.activeLayout
}

// SetViewportBounds 下发物理像素坐标给指定视口 (对应 REQ-002-AC-002)
func (m *WindowManager) SetViewportBounds(id string, bounds Rect) error {
	if bounds.Width < 0 || bounds.Height < 0 {
		return fmt.Errorf("invalid bounds dimensions: width=%d, height=%d", bounds.Width, bounds.Height)
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	entry, ok := m.viewports[id]
	if !ok {
		return fmt.Errorf("viewport not found: %s", id)
	}

	entry.bounds = bounds
	if entry.handle != nil {
		entry.handle.SetBounds(bounds)
	}
	return nil
}

// DetachViewport 将视口分离为独立桌面窗口 (对应 REQ-002-AC-004)
func (m *WindowManager) DetachViewport(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry, ok := m.viewports[id]
	if !ok {
		return fmt.Errorf("viewport not found: %s", id)
	}

	if entry.state == StateDetached {
		return fmt.Errorf("viewport is already detached: %s", id)
	}

	entry.state = StateDetached
	m.lru.Remove(id)
	return nil
}

// AttachViewport 将分离的独立桌面窗口重新附着回主工作台
func (m *WindowManager) AttachViewport(id string) error {
	m.mu.Lock()
	entry, ok := m.viewports[id]
	if !ok {
		m.mu.Unlock()
		return fmt.Errorf("viewport not found: %s", id)
	}
	m.mu.Unlock()

	return m.ActivateViewport(entry.id)
}

// ShowSpotlight 显示或隐藏 Spotlight 悬浮窗
func (m *WindowManager) ShowSpotlight(visible bool) error {
	m.mu.RLock()
	win := m.spotlightWin
	m.mu.RUnlock()

	if win == nil {
		return errors.New("spotlight window is not registered")
	}

	if visible {
		win.Show()
		win.Focus()
	} else {
		win.Hide()
	}
	return nil
}

// ActivateViewport 激活视口并更新 LRU 状态（超过上限时自动挂起最旧视口）
func (m *WindowManager) ActivateViewport(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	entry, ok := m.viewports[id]
	if !ok {
		return fmt.Errorf("viewport not found: %s", id)
	}

	evictedID, evicted := m.lru.Access(id)
	entry.state = StateVisible
	if entry.handle != nil {
		entry.handle.Show()
	}

	if evicted && evictedID != "" {
		if evEntry, exists := m.viewports[evictedID]; exists {
			evEntry.state = StateSuspended
			if evEntry.handle != nil {
				evEntry.handle.Hide()
			}
		}
	}

	return nil
}

// GetViewportState 获取视口当前生命周期状态
func (m *WindowManager) GetViewportState(id string) (ViewportState, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	entry, ok := m.viewports[id]
	if !ok {
		return "", fmt.Errorf("viewport not found: %s", id)
	}
	return entry.state, nil
}
