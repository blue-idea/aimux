package hotkey

// HotkeyResult 描述热键注册操作的返回结果（对应 v1.REQ-003-AC-003 与 API 规范）
type HotkeyResult struct {
	Success  bool   `json:"success"`
	Conflict string `json:"conflict,omitempty"`
	Fallback string `json:"fallback,omitempty"`
}

// HotkeyBinding 内部记录单个已注册快捷键绑定
type HotkeyBinding struct {
	ID     int
	Action string
	Combo  string
}

// HotkeyRegistrar 抽象操作系统底层全局快捷键注册与解绑接口（支持 Win32 / macOS / 测试 Mock）
type HotkeyRegistrar interface {
	Register(id int, combo string, onTrigger func()) error
	Unregister(id int) error
}
