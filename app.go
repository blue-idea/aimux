package main

import (
	"aimux/app/hotkey"
	"aimux/app/window"
)

// App represents the core application binding for Wails.
type App struct {
	windowMgr *window.WindowManager
	hotkeyMgr *hotkey.Manager
}

// NewApp creates a new App application struct.
func NewApp() *App {
	return &App{}
}

// SetManagers assigns the window and hotkey managers to App.
func (a *App) SetManagers(wm *window.WindowManager, hm *hotkey.Manager) {
	a.windowMgr = wm
	a.hotkeyMgr = hm
}

// RegisterHotkey registers a global hotkey binding (REQ-003-AC-003).
func (a *App) RegisterHotkey(action, combo string) hotkey.HotkeyResult {
	if a.hotkeyMgr == nil {
		return hotkey.HotkeyResult{
			Success:  false,
			Conflict: "hotkey manager not initialized",
		}
	}
	return a.hotkeyMgr.RegisterHotkey(action, combo)
}
