package storage_test

import (
	"os"
	"path/filepath"
	"testing"

	"aimux/app/storage"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConfig_LoadDefaultWhenNotExist(t *testing.T) {
	tempDir := t.TempDir()
	nonExistentPath := filepath.Join(tempDir, "non_existent_config.json")

	cfg, err := storage.LoadConfig(nonExistentPath)
	require.NoError(t, err)
	require.NotNil(t, cfg)

	// 验证默认字段
	assert.Equal(t, "1.0.0", cfg.Version)
	assert.Equal(t, "2K-Comfort", cfg.Window.Preset)
	assert.Equal(t, 1600, cfg.Window.Width)
	assert.Equal(t, 1000, cfg.Window.Height)
	assert.Equal(t, "Dark Obsidian", cfg.Theme.Current)
	assert.Equal(t, "dark", cfg.Theme.Mode)
	assert.Equal(t, "grid4", cfg.Layout.ActiveLayout)
	assert.True(t, cfg.Layout.EnableAutoZoom)
	assert.NotEmpty(t, cfg.ActiveViewportIDs)
}

func TestConfig_SaveAndLoad(t *testing.T) {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "sub", "config.json")

	orig := storage.DefaultAppConfig()
	require.NotNil(t, orig)
	orig.Window.Width = 1920
	orig.Window.Height = 1080
	orig.Theme.Current = "Midnight Cyber"
	orig.ActiveViewportIDs = []string{"chatgpt-custom", "claude-custom"}

	err := storage.SaveConfig(orig, configPath)
	require.NoError(t, err)

	loaded, err := storage.LoadConfig(configPath)
	require.NoError(t, err)
	require.NotNil(t, loaded)

	assert.Equal(t, 1920, loaded.Window.Width)
	assert.Equal(t, 1080, loaded.Window.Height)
	assert.Equal(t, "Midnight Cyber", loaded.Theme.Current)
	assert.Equal(t, []string{"chatgpt-custom", "claude-custom"}, loaded.ActiveViewportIDs)
}

// REQ-009-AC-001: 用户选择主题预设后，配置持久化到 config.json
func TestConfig_ThemePersistence(t *testing.T) {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "config.json")

	cfg := storage.DefaultAppConfig()
	cfg.Theme.Current = "Solarized Frost"
	cfg.Theme.Mode = "light"
	cfg.Theme.AccentColor = "#10B981"
	cfg.Theme.WindowOpacity = 0.90
	cfg.Theme.BackdropBlur = 15

	err := storage.SaveConfig(cfg, configPath)
	require.NoError(t, err)

	reloaded, err := storage.LoadConfig(configPath)
	require.NoError(t, err)
	assert.Equal(t, "Solarized Frost", reloaded.Theme.Current)
	assert.Equal(t, "light", reloaded.Theme.Mode)
	assert.Equal(t, "#10B981", reloaded.Theme.AccentColor)
	assert.Equal(t, 0.90, reloaded.Theme.WindowOpacity)
	assert.Equal(t, 15, reloaded.Theme.BackdropBlur)
}

// REQ-010-AC-002: 用户切换分辨率预设或拖拽窗口尺寸后保存到 config.json
func TestConfig_WindowPresetPersistence(t *testing.T) {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "config.json")

	cfg := storage.DefaultAppConfig()
	cfg.Window.Preset = "4K-Ultra"
	cfg.Window.Width = 2560
	cfg.Window.Height = 1440
	cfg.Window.X = 100
	cfg.Window.Y = 150
	cfg.Window.IsMaximized = false
	cfg.Window.RememberBounds = true

	err := storage.SaveConfig(cfg, configPath)
	require.NoError(t, err)

	reloaded, err := storage.LoadConfig(configPath)
	require.NoError(t, err)
	assert.Equal(t, "4K-Ultra", reloaded.Window.Preset)
	assert.Equal(t, 2560, reloaded.Window.Width)
	assert.Equal(t, 1440, reloaded.Window.Height)
	assert.Equal(t, 100, reloaded.Window.X)
	assert.Equal(t, 150, reloaded.Window.Y)
}

// 缺失部分字段的 JSON 自动补全默认值
func TestConfig_PartialJsonFillDefaults(t *testing.T) {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "partial.json")

	partialJSON := `{
		"version": "1.0.0",
		"theme": {
			"current": "Custom Neo"
		}
	}`
	err := os.WriteFile(configPath, []byte(partialJSON), 0644)
	require.NoError(t, err)

	loaded, err := storage.LoadConfig(configPath)
	require.NoError(t, err)
	require.NotNil(t, loaded)

	// 保留自定义项
	assert.Equal(t, "Custom Neo", loaded.Theme.Current)
	// 缺失项自动回退到默认值
	assert.Equal(t, "2K-Comfort", loaded.Window.Preset)
	assert.Equal(t, 1600, loaded.Window.Width)
	assert.Equal(t, "grid4", loaded.Layout.ActiveLayout)
	assert.NotEmpty(t, loaded.Hotkeys.GlobalSpotlight)
}

// 错误处理与非法入参测试
func TestConfig_Errors(t *testing.T) {
	tempDir := t.TempDir()
	invalidJSONPath := filepath.Join(tempDir, "invalid.json")

	// 1. 损坏的 JSON 格式
	err := os.WriteFile(invalidJSONPath, []byte("{ invalid json : "), 0644)
	require.NoError(t, err)

	_, err = storage.LoadConfig(invalidJSONPath)
	assert.Error(t, err)

	// 2. 保存 nil 配置
	assert.Error(t, storage.SaveConfig(nil, filepath.Join(tempDir, "out.json")))

	// 3. 非法保存路径
	cfg := storage.DefaultAppConfig()
	assert.Error(t, storage.SaveConfig(cfg, "/dev/null/forbidden/config.json"))
}

// 默认路径解析测试
func TestConfig_DefaultPathResolve(t *testing.T) {
	// 验证无参数调用 LoadConfig() 能成功解析默认路径
	cfg, err := storage.LoadConfig()
	require.NoError(t, err)
	require.NotNil(t, cfg)
}

