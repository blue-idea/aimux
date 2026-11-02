package hotkey

import (
	"fmt"
	"sync"

	"aimux/app/storage"
	"aimux/config"
)

// ManagerConfig 管理器创建配置参数
type ManagerConfig struct {
	Registrar  HotkeyRegistrar
	AppConfig  *storage.AppConfig
	ConfigPath string
	OnTrigger  func(action string)
}

// Manager 统一全局快捷键管理器
type Manager struct {
	mu         sync.RWMutex
	registrar  HotkeyRegistrar
	actions    map[string]*HotkeyBinding // action -> HotkeyBinding
	combos     map[string]string         // normalized combo -> action
	nextID     int
	onTrigger  func(action string)
	appConfig  *storage.AppConfig
	configPath string
}

// NewManager 创建全局快捷键管理器实例
func NewManager(cfg ManagerConfig) *Manager {
	return &Manager{
		registrar:  cfg.Registrar,
		actions:    make(map[string]*HotkeyBinding),
		combos:     make(map[string]string),
		nextID:     1,
		onTrigger:  cfg.OnTrigger,
		appConfig:  cfg.AppConfig,
		configPath: cfg.ConfigPath,
	}
}

// updateConfigMapping 将注册的热键映射同步至 AppConfig
func updateConfigMapping(cfg *storage.AppConfig, action, combo string) {
	if cfg == nil {
		return
	}
	switch action {
	case config.ActionGlobalSpotlight:
		cfg.Hotkeys.GlobalSpotlight = combo
	case config.ActionGlobalToggleMain:
		cfg.Hotkeys.GlobalToggleMain = combo
	case config.ActionGlobalSendClipboard:
		cfg.Hotkeys.GlobalSendClipboard = combo
	case config.ActionSwitchLayout1:
		cfg.Hotkeys.SwitchLayout1 = combo
	case config.ActionSwitchLayout2:
		cfg.Hotkeys.SwitchLayout2 = combo
	case config.ActionSwitchLayout4:
		cfg.Hotkeys.SwitchLayout4 = combo
	case config.ActionSwitchLayout1x4:
		cfg.Hotkeys.SwitchLayout1x4 = combo
	case config.ActionBroadcastSend:
		cfg.Hotkeys.BroadcastSend = combo
	case config.ActionToggleDrawer:
		cfg.Hotkeys.ToggleDrawer = combo
	case config.ActionOpenSettings:
		cfg.Hotkeys.OpenSettings = combo
	}
}

// RegisterHotkey 注册或更新全局快捷键（对应 v1.REQ-003-AC-003, v1.REQ-003-AC-004）
func (m *Manager) RegisterHotkey(action, combo string) HotkeyResult {
	normCombo, err := NormalizeHotkey(combo)
	if err != nil {
		return HotkeyResult{
			Success:  false,
			Conflict: err.Error(),
		}
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// 1. 检查内部占用冲突
	if occupiedAction, exists := m.combos[normCombo]; exists && occupiedAction != action {
		conflict, _ := DetectConflict(normCombo, occupiedAction)
		return HotkeyResult{
			Success:  false,
			Conflict: conflict,
			Fallback: SuggestFallback(normCombo),
		}
	}

	// 2. 检查系统保留键冲突
	if conflict, isSystem := DetectConflict(normCombo, ""); isSystem {
		return HotkeyResult{
			Success:  false,
			Conflict: conflict,
			Fallback: SuggestFallback(normCombo),
		}
	}

	// 3. 若当前 Action 之前注册过旧按键，注销旧按键以支持即时更新无须重启 (REQ-003-AC-004)
	if oldBinding, exists := m.actions[action]; exists {
		if oldBinding.Combo == normCombo {
			return HotkeyResult{Success: true}
		}
		if m.registrar != nil {
			_ = m.registrar.Unregister(oldBinding.ID)
		}
		delete(m.combos, oldBinding.Combo)
	}

	// 4. 调用底层注册器注册热键
	id := m.nextID
	m.nextID++

	if m.registrar != nil {
		err := m.registrar.Register(id, normCombo, func() {
			m.TriggerAction(action)
		})
		if err != nil {
			return HotkeyResult{
				Success:  false,
				Conflict: err.Error(),
				Fallback: SuggestFallback(normCombo),
			}
		}
	}

	// 5. 登记内存映射
	binding := &HotkeyBinding{
		ID:     id,
		Action: action,
		Combo:  normCombo,
	}
	m.actions[action] = binding
	m.combos[normCombo] = action

	// 6. 持久化到 config.json (REQ-003-AC-004)
	if m.appConfig != nil {
		updateConfigMapping(m.appConfig, action, normCombo)
		if m.configPath != "" {
			_ = storage.SaveConfig(m.appConfig, m.configPath)
		}
	}

	return HotkeyResult{
		Success: true,
	}
}

// UnregisterHotkey 注销指定 Action 的快捷键
func (m *Manager) UnregisterHotkey(action string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	binding, exists := m.actions[action]
	if !exists {
		return nil
	}

	if m.registrar != nil {
		if err := m.registrar.Unregister(binding.ID); err != nil {
			return fmt.Errorf("failed to unregister hotkey: %w", err)
		}
	}

	delete(m.combos, binding.Combo)
	delete(m.actions, action)
	return nil
}

// UnregisterAll 注销所有已注册的快捷键
func (m *Manager) UnregisterAll() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	var firstErr error
	if m.registrar != nil {
		for _, binding := range m.actions {
			if err := m.registrar.Unregister(binding.ID); err != nil && firstErr == nil {
				firstErr = err
			}
		}
	}

	m.actions = make(map[string]*HotkeyBinding)
	m.combos = make(map[string]string)
	return firstErr
}

// GetRegisteredHotkey 获取指定 Action 当前注册的快捷键组合
func (m *Manager) GetRegisteredHotkey(action string) (string, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	binding, exists := m.actions[action]
	if !exists {
		return "", false
	}
	return binding.Combo, true
}

// TriggerAction 模拟或转发触发指定 Action（派发给前端事件）
func (m *Manager) TriggerAction(action string) {
	m.mu.RLock()
	handler := m.onTrigger
	m.mu.RUnlock()

	if handler != nil {
		handler(action)
	}
}
