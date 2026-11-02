package hotkey

import (
	"errors"
	"fmt"
	"strings"
)

// systemReservedHotkeys 系统级关键保留快捷键集合（不能被第三方桌面应用占用）
var systemReservedHotkeys = map[string]string{
	"Win+L":             "Windows lock workstation",
	"Cmd+Space":         "macOS Spotlight / input method",
	"Cmd+Tab":           "macOS application switcher",
	"Alt+Tab":           "Windows task switcher",
	"Ctrl+Alt+Del":      "Windows security options",
	"Ctrl+Alt+Delete":   "Windows security options",
	"Alt+F4":            "Windows close active window",
	"Ctrl+Shift+Escape": "Windows task manager",
}

// NormalizeHotkey 规范化快捷键组合字符串（修饰键排序、首字母大写、去除多余空格）
func NormalizeHotkey(combo string) (string, error) {
	trimmed := strings.TrimSpace(combo)
	if trimmed == "" {
		return "", errors.New("empty hotkey combination")
	}

	parts := strings.Split(trimmed, "+")
	var hasCtrl, hasAlt, hasShift, hasWinCmd bool
	var key string

	for _, part := range parts {
		token := strings.TrimSpace(part)
		if token == "" {
			continue
		}
		lower := strings.ToLower(token)
		switch lower {
		case "ctrl", "control":
			hasCtrl = true
		case "alt", "option":
			hasAlt = true
		case "shift":
			hasShift = true
		case "win", "windows", "cmd", "command", "meta":
			hasWinCmd = true
		default:
			// 主按键：格式化为首字母大写
			if len(token) == 1 {
				key = strings.ToUpper(token)
			} else {
				// 首字母大写，其余小写 (如 Space, Enter, Escape, F1-F12)
				key = strings.ToUpper(token[:1]) + strings.ToLower(token[1:])
			}
		}
	}

	if key == "" {
		return "", fmt.Errorf("invalid hotkey format: %s", combo)
	}

	var orderedParts []string
	if hasCtrl {
		orderedParts = append(orderedParts, "Ctrl")
	}
	if hasAlt {
		orderedParts = append(orderedParts, "Alt")
	}
	if hasShift {
		orderedParts = append(orderedParts, "Shift")
	}
	if hasWinCmd {
		// 如果原本包含 Win 或 Cmd，保留为 Win 或 Cmd
		if strings.Contains(strings.ToLower(trimmed), "cmd") {
			orderedParts = append(orderedParts, "Cmd")
		} else {
			orderedParts = append(orderedParts, "Win")
		}
	}

	orderedParts = append(orderedParts, key)
	return strings.Join(orderedParts, "+"), nil
}

// DetectConflict 检测指定的快捷键组合是否存在系统保留冲突或内部占用冲突
func DetectConflict(normalizedCombo string, occupiedByAction string) (conflict string, hasConflict bool) {
	// 1. 系统级保留快捷键冲突检查
	if reason, exists := systemReservedHotkeys[normalizedCombo]; exists {
		return fmt.Sprintf("system reserved hotkey (%s)", reason), true
	}

	// 2. 应用内部其他 Action 占用冲突检查
	if occupiedByAction != "" {
		return fmt.Sprintf("occupied by %s", occupiedByAction), true
	}

	return "", false
}

// SuggestFallback 当快捷键发生冲突时，推导并建议可用的替代组合键 (对应 v1.REQ-003-AC-003)
func SuggestFallback(normalizedCombo string) string {
	parts := strings.Split(normalizedCombo, "+")
	if len(parts) == 0 {
		return "Ctrl+Shift+Space"
	}

	hasShift := false
	hasCtrl := false
	hasAlt := false
	var key string

	for _, p := range parts {
		switch p {
		case "Shift":
			hasShift = true
		case "Ctrl":
			hasCtrl = true
		case "Alt":
			hasAlt = true
		default:
			key = p
		}
	}

	// 策略 1：如果原按键中没有 Shift，优先插入 Shift 修饰键
	if !hasShift {
		var newParts []string
		if hasCtrl {
			newParts = append(newParts, "Ctrl")
		}
		if hasAlt {
			newParts = append(newParts, "Alt")
		}
		newParts = append(newParts, "Shift", key)
		candidate := strings.Join(newParts, "+")
		if _, conflict := DetectConflict(candidate, ""); !conflict {
			return candidate
		}
	}

	// 策略 2：将 Alt 替换为 Ctrl 或 Ctrl 替换为 Alt
	if hasAlt && !hasCtrl {
		candidate := "Ctrl+Shift+" + key
		if _, conflict := DetectConflict(candidate, ""); !conflict {
			return candidate
		}
		candidate = "Ctrl+" + key
		if _, conflict := DetectConflict(candidate, ""); !conflict {
			return candidate
		}
	} else if hasCtrl && !hasAlt {
		candidate := "Alt+" + key
		if _, conflict := DetectConflict(candidate, ""); !conflict {
			return candidate
		}
	}

	// 兜底返回安全组合
	return "Ctrl+Shift+" + key
}
