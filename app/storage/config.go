package storage

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"aimux/config"
)

// WindowConfig 描述窗口尺寸、位置与多屏状态
type WindowConfig struct {
	Preset         string `json:"preset"`
	Width          int    `json:"width"`
	Height         int    `json:"height"`
	X              int    `json:"x"`
	Y              int    `json:"y"`
	IsMaximized    bool   `json:"isMaximized"`
	LastMonitorID  string `json:"lastMonitorId"`
	RememberBounds bool   `json:"rememberBounds"`
}

// ThemeConfig 描述毛玻璃外观与主题色彩
type ThemeConfig struct {
	Current       string  `json:"current"`
	Mode          string  `json:"mode"`
	AccentColor   string  `json:"accentColor"`
	WindowOpacity float64 `json:"windowOpacity"`
	BackdropBlur  int     `json:"backdropBlur"`
	BorderRadius  int     `json:"borderRadius"`
	EnableMica    bool    `json:"enableMica"`
}

// HotkeysConfig 描述全局与应用内热键定义
type HotkeysConfig struct {
	GlobalSpotlight     string `json:"globalSpotlight"`
	GlobalToggleMain    string `json:"globalToggleMain"`
	GlobalSendClipboard string `json:"globalSendClipboard"`
	SwitchLayout1       string `json:"switchLayout1"`
	SwitchLayout2       string `json:"switchLayout2"`
	SwitchLayout4       string `json:"switchLayout4"`
	SwitchLayout1x4     string `json:"switchLayout1x4"`
	BroadcastSend       string `json:"broadcastSend"`
	ToggleDrawer        string `json:"toggleDrawer"`
	OpenSettings        string `json:"openSettings"`
}

// LayoutConfig 描述主工作台布局参数
type LayoutConfig struct {
	ActiveLayout    string  `json:"activeLayout"`
	RightBarWidth   int     `json:"rightBarWidth"`
	BottomBarHeight int     `json:"bottomBarHeight"`
	EnableAutoZoom  bool    `json:"enableAutoZoom"`
	AutoZoomMin     float64 `json:"autoZoomMin"`
}

// LLMProvider 描述单个 OpenAI 兼容服务提供商配置（不含明文 Key）
type LLMProvider struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	BaseURL     string `json:"baseUrl"`
	Model       string `json:"model"`
	KeychainKey string `json:"keychainKey"`
}

// LLMConfig 描述 LLM API 配置集合
type LLMConfig struct {
	Providers        []LLMProvider `json:"providers"`
	ActiveProviderID string        `json:"activeProviderId"`
}

// AppConfig 为 AIMux 全局配置文件结构（对应 config.json）
type AppConfig struct {
	Version           string        `json:"version"`
	Window            WindowConfig  `json:"window"`
	Theme             ThemeConfig   `json:"theme"`
	Hotkeys           HotkeysConfig `json:"hotkeys"`
	Layout            LayoutConfig  `json:"layout"`
	ActiveViewportIDs []string      `json:"activeViewportIds"`
	LLM               LLMConfig     `json:"llm"`
}

// DefaultAppConfig 返回填充完整默认值的 AppConfig
func DefaultAppConfig() *AppConfig {
	return &AppConfig{
		Version: config.DefaultConfigVersion,
		Window: WindowConfig{
			Preset:         config.DefaultWindowPreset,
			Width:          config.DefaultWindowWidth,
			Height:         config.DefaultWindowHeight,
			X:              -1,
			Y:              -1,
			IsMaximized:    false,
			LastMonitorID:  config.DefaultLastMonitorID,
			RememberBounds: true,
		},
		Theme: ThemeConfig{
			Current:       config.DefaultThemeCurrent,
			Mode:          config.DefaultThemeMode,
			AccentColor:   config.DefaultAccentColor,
			WindowOpacity: config.DefaultOpacity,
			BackdropBlur:  config.DefaultBackdropBlur,
			BorderRadius:  config.DefaultBorderRadius,
			EnableMica:    config.DefaultEnableMica,
		},
		Hotkeys: HotkeysConfig{
			GlobalSpotlight:     config.DefaultHotkeySpotlight,
			GlobalToggleMain:    config.DefaultHotkeyToggleMain,
			GlobalSendClipboard: config.DefaultHotkeySendClipboard,
			SwitchLayout1:       config.DefaultHotkeyLayout1,
			SwitchLayout2:       config.DefaultHotkeyLayout2,
			SwitchLayout4:       config.DefaultHotkeyLayout4,
			SwitchLayout1x4:     config.DefaultHotkeyLayout1x4,
			BroadcastSend:       config.DefaultHotkeyBroadcast,
			ToggleDrawer:        config.DefaultHotkeyDrawer,
			OpenSettings:        config.DefaultHotkeySettings,
		},
		Layout: LayoutConfig{
			ActiveLayout:    config.DefaultActiveLayout,
			RightBarWidth:   config.DefaultRightBarWidth,
			BottomBarHeight: config.DefaultBottomBarHeight,
			EnableAutoZoom:  config.DefaultEnableAutoZoom,
			AutoZoomMin:     config.DefaultAutoZoomMin,
		},
		ActiveViewportIDs: []string{
			"chatgpt-default",
			"claude-default",
		},
		LLM: LLMConfig{
			Providers: []LLMProvider{
				{
					ID:          "openai-default",
					Name:        "OpenAI",
					BaseURL:     "https://api.openai.com/v1",
					Model:       "gpt-4o-mini",
					KeychainKey: "aimux-llm-openai-default",
				},
			},
			ActiveProviderID: "openai-default",
		},
	}
}

// mergeDefaults 将缺失的默认值合并入用户配置中
func mergeDefaults(cfg *AppConfig) {
	def := DefaultAppConfig()
	if cfg.Version == "" {
		cfg.Version = def.Version
	}
	if cfg.Window.Preset == "" {
		cfg.Window.Preset = def.Window.Preset
	}
	if cfg.Window.Width <= 0 {
		cfg.Window.Width = def.Window.Width
	}
	if cfg.Window.Height <= 0 {
		cfg.Window.Height = def.Window.Height
	}
	if cfg.Theme.Current == "" {
		cfg.Theme.Current = def.Theme.Current
	}
	if cfg.Theme.Mode == "" {
		cfg.Theme.Mode = def.Theme.Mode
	}
	if cfg.Theme.AccentColor == "" {
		cfg.Theme.AccentColor = def.Theme.AccentColor
	}
	if cfg.Theme.WindowOpacity <= 0 {
		cfg.Theme.WindowOpacity = def.Theme.WindowOpacity
	}
	if cfg.Hotkeys.GlobalSpotlight == "" {
		cfg.Hotkeys = def.Hotkeys
	}
	if cfg.Layout.ActiveLayout == "" {
		cfg.Layout.ActiveLayout = def.Layout.ActiveLayout
	}
	if cfg.Layout.RightBarWidth <= 0 {
		cfg.Layout.RightBarWidth = def.Layout.RightBarWidth
	}
	if cfg.Layout.BottomBarHeight <= 0 {
		cfg.Layout.BottomBarHeight = def.Layout.BottomBarHeight
	}
	if cfg.Layout.AutoZoomMin <= 0 {
		cfg.Layout.AutoZoomMin = def.Layout.AutoZoomMin
	}
	if len(cfg.ActiveViewportIDs) == 0 {
		cfg.ActiveViewportIDs = def.ActiveViewportIDs
	}
}

func resolveConfigPath(path ...string) (string, error) {
	if len(path) > 0 && path[0] != "" {
		return path[0], nil
	}
	return config.GetConfigPath()
}

// LoadConfig 从指定路径读取并解析配置文件；若文件不存在则返回默认配置
func LoadConfig(path ...string) (*AppConfig, error) {
	targetPath, err := resolveConfigPath(path...)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve config path: %w", err)
	}

	data, err := os.ReadFile(targetPath)
	if err != nil {
		if os.IsNotExist(err) {
			return DefaultAppConfig(), nil
		}
		return nil, fmt.Errorf("failed to read config file %s: %w", targetPath, err)
	}

	var cfg AppConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse config JSON in %s: %w", targetPath, err)
	}

	mergeDefaults(&cfg)
	return &cfg, nil
}

// SaveConfig 将配置原子化序列化保存到指定路径
func SaveConfig(cfg *AppConfig, path ...string) error {
	if cfg == nil {
		return errors.New("config cannot be nil")
	}

	targetPath, err := resolveConfigPath(path...)
	if err != nil {
		return fmt.Errorf("failed to resolve config path: %w", err)
	}

	dir := filepath.Dir(targetPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory %s: %w", dir, err)
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to serialize config to JSON: %w", err)
	}

	tempFile := fmt.Sprintf("%s.tmp.%d", targetPath, os.Getpid())
	if err := os.WriteFile(tempFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write temp config file: %w", err)
	}

	if err := os.Rename(tempFile, targetPath); err != nil {
		_ = os.Remove(tempFile)
		return fmt.Errorf("failed to atomic rename config file: %w", err)
	}

	return nil
}
