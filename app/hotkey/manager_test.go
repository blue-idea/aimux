package hotkey

import (
	"errors"
	"path/filepath"
	"sync"
	"testing"

	"aimux/app/storage"
	"aimux/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockRegistrar struct {
	mu           sync.Mutex
	registered   map[int]string
	callbacks    map[int]func()
	busyCombos   map[string]error
	nextID       int
	unregistered []int
}

func newMockRegistrar() *mockRegistrar {
	return &mockRegistrar{
		registered:   make(map[int]string),
		callbacks:    make(map[int]func()),
		busyCombos:   make(map[string]error),
		nextID:       1,
		unregistered: make([]int, 0),
	}
}

func (m *mockRegistrar) Register(id int, combo string, onTrigger func()) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if err, busy := m.busyCombos[combo]; busy {
		return err
	}
	m.registered[id] = combo
	m.callbacks[id] = onTrigger
	return nil
}

func (m *mockRegistrar) Unregister(id int) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.registered, id)
	delete(m.callbacks, id)
	m.unregistered = append(m.unregistered, id)
	return nil
}

func (m *mockRegistrar) trigger(id int) {
	m.mu.Lock()
	cb := m.callbacks[id]
	m.mu.Unlock()
	if cb != nil {
		cb()
	}
}

func setupTestManager(t *testing.T, registrar HotkeyRegistrar) (*Manager, string, *[]string) {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "config.json")
	cfg := storage.DefaultAppConfig()

	var triggeredEvents []string
	var mu sync.Mutex

	mgr := NewManager(ManagerConfig{
		Registrar:  registrar,
		AppConfig:  cfg,
		ConfigPath: configPath,
		OnTrigger: func(action string) {
			mu.Lock()
			triggeredEvents = append(triggeredEvents, action)
			mu.Unlock()
		},
	})

	return mgr, configPath, &triggeredEvents
}

func TestManager_RegisterHotkey_Success(t *testing.T) {
	mockReg := newMockRegistrar()
	mgr, _, triggered := setupTestManager(t, mockReg)

	t.Run("成功注册全局快捷键并在触发时派发事件 (REQ-003-AC-001)", func(t *testing.T) {
		res := mgr.RegisterHotkey(config.ActionGlobalSpotlight, "alt+space")
		require.True(t, res.Success)
		assert.Empty(t, res.Conflict)
		assert.Empty(t, res.Fallback)

		combo, ok := mgr.GetRegisteredHotkey(config.ActionGlobalSpotlight)
		require.True(t, ok)
		assert.Equal(t, "Alt+Space", combo)

		// 触发底层注册的热键
		mockReg.trigger(1)
		require.Len(t, *triggered, 1)
		assert.Equal(t, config.ActionGlobalSpotlight, (*triggered)[0])
	})
}

func TestManager_RegisterHotkey_Conflict(t *testing.T) {
	mockReg := newMockRegistrar()
	mgr, _, _ := setupTestManager(t, mockReg)

	mgr.RegisterHotkey(config.ActionGlobalSpotlight, "Alt+Space")

	t.Run("同一快捷键已被其他 Action 占用时报告冲突并提供 Fallback (REQ-003-AC-003)", func(t *testing.T) {
		res := mgr.RegisterHotkey(config.ActionGlobalToggleMain, "Alt+Space")
		assert.False(t, res.Success)
		assert.Contains(t, res.Conflict, config.ActionGlobalSpotlight)
		assert.NotEmpty(t, res.Fallback)
		assert.NotEqual(t, "Alt+Space", res.Fallback)
	})

	t.Run("系统级保留快捷键拒绝注册并提供 Fallback (REQ-003-AC-003)", func(t *testing.T) {
		res := mgr.RegisterHotkey(config.ActionGlobalToggleMain, "Win+L")
		assert.False(t, res.Success)
		assert.Contains(t, res.Conflict, "system reserved")
		assert.NotEmpty(t, res.Fallback)
	})

	t.Run("操作系统底层已被第三方软件占用时返回错误与 Fallback (REQ-003-AC-003)", func(t *testing.T) {
		mockReg.busyCombos["Ctrl+Shift+D"] = errors.New("hotkey is already registered by another application")
		res := mgr.RegisterHotkey(config.ActionToggleDrawer, "Ctrl+Shift+D")
		assert.False(t, res.Success)
		assert.Contains(t, res.Conflict, "already registered by another application")
		assert.NotEmpty(t, res.Fallback)
	})
}

func TestManager_RegisterHotkey_Update_WithoutRestart(t *testing.T) {
	mockReg := newMockRegistrar()
	mgr, configPath, _ := setupTestManager(t, mockReg)

	// 初始注册
	res := mgr.RegisterHotkey(config.ActionGlobalSpotlight, "Alt+Space")
	require.True(t, res.Success)

	t.Run("修改快捷键时立即生效，注销旧按键并持久化到配置 (REQ-003-AC-004)", func(t *testing.T) {
		updateRes := mgr.RegisterHotkey(config.ActionGlobalSpotlight, "Ctrl+Shift+Space")
		require.True(t, updateRes.Success)

		// 验证旧键已从 registrar 解绑
		require.Contains(t, mockReg.unregistered, 1)

		// 验证当前生效键
		current, ok := mgr.GetRegisteredHotkey(config.ActionGlobalSpotlight)
		require.True(t, ok)
		assert.Equal(t, "Ctrl+Shift+Space", current)

		// 验证持久化到了 config.json
		savedCfg, err := storage.LoadConfig(configPath)
		require.NoError(t, err)
		assert.Equal(t, "Ctrl+Shift+Space", savedCfg.Hotkeys.GlobalSpotlight)
	})
}

func TestManager_Unregister(t *testing.T) {
	mockReg := newMockRegistrar()
	mgr, _, _ := setupTestManager(t, mockReg)

	mgr.RegisterHotkey(config.ActionGlobalSpotlight, "Alt+Space")
	mgr.RegisterHotkey(config.ActionGlobalToggleMain, "Ctrl+Shift+W")

	t.Run("单个注销指定 Action", func(t *testing.T) {
		err := mgr.UnregisterHotkey(config.ActionGlobalSpotlight)
		require.NoError(t, err)

		_, ok := mgr.GetRegisteredHotkey(config.ActionGlobalSpotlight)
		assert.False(t, ok)

		// 现在 Alt+Space 可以被其他 action 注册
		res := mgr.RegisterHotkey(config.ActionGlobalToggleMain, "Alt+Space")
		assert.True(t, res.Success)
	})

	t.Run("全部注销所有快捷键", func(t *testing.T) {
		err := mgr.UnregisterAll()
		require.NoError(t, err)

		_, ok := mgr.GetRegisteredHotkey(config.ActionGlobalToggleMain)
		assert.False(t, ok)
	})

	t.Run("注销未注册的 Action 返回 nil", func(t *testing.T) {
		err := mgr.UnregisterHotkey("non-existent-action")
		assert.NoError(t, err)
	})
}

func TestManager_ConfigMappingAndEdgeCases(t *testing.T) {
	mockReg := newMockRegistrar()
	mgr, configPath, _ := setupTestManager(t, mockReg)

	t.Run("注册并持久化所有支持的 Actions 到配置", func(t *testing.T) {
		actions := []struct {
			action string
			combo  string
		}{
			{config.ActionGlobalToggleMain, "Ctrl+Shift+W"},
			{config.ActionGlobalSendClipboard, "Ctrl+Shift+B"},
			{config.ActionSwitchLayout1, "Ctrl+1"},
			{config.ActionSwitchLayout2, "Ctrl+2"},
			{config.ActionSwitchLayout4, "Ctrl+3"},
			{config.ActionSwitchLayout1x4, "Ctrl+4"},
			{config.ActionBroadcastSend, "Ctrl+Enter"},
			{config.ActionToggleDrawer, "Ctrl+\\"},
			{config.ActionOpenSettings, "Ctrl+,"},
		}

		for _, item := range actions {
			res := mgr.RegisterHotkey(item.action, item.combo)
			assert.True(t, res.Success, "action %s should succeed", item.action)
		}

		savedCfg, err := storage.LoadConfig(configPath)
		require.NoError(t, err)
		assert.Equal(t, "Ctrl+Shift+W", savedCfg.Hotkeys.GlobalToggleMain)
		assert.Equal(t, "Ctrl+Shift+B", savedCfg.Hotkeys.GlobalSendClipboard)
		assert.Equal(t, "Ctrl+1", savedCfg.Hotkeys.SwitchLayout1)
		assert.Equal(t, "Ctrl+2", savedCfg.Hotkeys.SwitchLayout2)
		assert.Equal(t, "Ctrl+3", savedCfg.Hotkeys.SwitchLayout4)
		assert.Equal(t, "Ctrl+4", savedCfg.Hotkeys.SwitchLayout1x4)
		assert.Equal(t, "Ctrl+Enter", savedCfg.Hotkeys.BroadcastSend)
		assert.Equal(t, "Ctrl+\\", savedCfg.Hotkeys.ToggleDrawer)
		assert.Equal(t, "Ctrl+,", savedCfg.Hotkeys.OpenSettings)
	})

	t.Run("注册格式错误的组合键返回失败", func(t *testing.T) {
		res := mgr.RegisterHotkey(config.ActionGlobalSpotlight, "")
		assert.False(t, res.Success)
		assert.Contains(t, res.Conflict, "empty")
	})

	t.Run("重复注册完全相同的组合键直接返回成功", func(t *testing.T) {
		res1 := mgr.RegisterHotkey(config.ActionGlobalSpotlight, "Alt+Space")
		assert.True(t, res1.Success)

		res2 := mgr.RegisterHotkey(config.ActionGlobalSpotlight, "Alt+Space")
		assert.True(t, res2.Success)
	})
}
