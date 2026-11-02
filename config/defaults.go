package config

// 默认窗口与显示配置常量
const (
	DefaultConfigVersion  = "1.0.0"
	DefaultWindowPreset   = "2K-Comfort"
	DefaultWindowWidth    = 1600
	DefaultWindowHeight   = 1000
	DefaultLastMonitorID  = "DISPLAY1"
	DefaultZoomBreakpoint = 850
	DefaultAutoZoomMin    = 0.75
)

// 默认外观与主题配置常量
const (
	DefaultThemeCurrent = "Dark Obsidian"
	DefaultThemeMode    = "dark"
	DefaultAccentColor  = "#3B82F6"
	DefaultOpacity      = 0.85
	DefaultBackdropBlur = 20
	DefaultBorderRadius = 10
	DefaultEnableMica   = true
)

// 默认快捷键常量
const (
	DefaultHotkeySpotlight     = "Alt+Space"
	DefaultHotkeyToggleMain    = "Ctrl+Shift+W"
	DefaultHotkeySendClipboard = "Ctrl+Shift+B"
	DefaultHotkeyLayout1       = "Ctrl+1"
	DefaultHotkeyLayout2       = "Ctrl+2"
	DefaultHotkeyLayout4       = "Ctrl+3"
	DefaultHotkeyLayout1x4     = "Ctrl+4"
	DefaultHotkeyBroadcast     = "Ctrl+Enter"
	DefaultHotkeyDrawer        = "Ctrl+\\"
	DefaultHotkeySettings      = "Ctrl+,"
)

// 默认布局配置常量
const (
	DefaultActiveLayout    = "grid4"
	DefaultRightBarWidth   = 260
	DefaultBottomBarHeight = 90
	DefaultEnableAutoZoom  = true
	DefaultLRUCacheLimit   = 10
	DefaultMainSubSplitRatio = 0.65
)

// 快捷键 Action 常量定义
const (
	ActionGlobalSpotlight     = "globalSpotlight"
	ActionGlobalToggleMain    = "globalToggleMain"
	ActionGlobalSendClipboard = "globalSendClipboard"
	ActionSwitchLayout1       = "switchLayout1"
	ActionSwitchLayout2       = "switchLayout2"
	ActionSwitchLayout4       = "switchLayout4"
	ActionSwitchLayout1x4     = "switchLayout1x4"
	ActionBroadcastSend       = "broadcastSend"
	ActionToggleDrawer        = "toggleDrawer"
	ActionOpenSettings        = "openSettings"
)

// 支持的布局模式常量定义
const (
	LayoutSingle    = "single"
	LayoutDual      = "dual"
	LayoutDouble    = "double" // dual 的兼容别名
	LayoutGrid      = "grid"
	LayoutGrid4     = "grid4"  // grid 的兼容别名
	LayoutUltrawide = "ultrawide"
	LayoutMainSub   = "main-sub"
)
