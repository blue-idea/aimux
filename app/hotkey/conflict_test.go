package hotkey

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNormalizeHotkey(t *testing.T) {
	t.Run("规范化修饰键与字母大小写和空格", func(t *testing.T) {
		combo, err := NormalizeHotkey("alt+space")
		require.NoError(t, err)
		assert.Equal(t, "Alt+Space", combo)

		combo, err = NormalizeHotkey("ctrl+shift+w")
		require.NoError(t, err)
		assert.Equal(t, "Ctrl+Shift+W", combo)

		combo, err = NormalizeHotkey("  Ctrl + Alt +  t  ")
		require.NoError(t, err)
		assert.Equal(t, "Ctrl+Alt+T", combo)
	})

	t.Run("空字符串或非法组合报错", func(t *testing.T) {
		_, err := NormalizeHotkey("")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "empty hotkey")

		_, err = NormalizeHotkey("   ")
		require.Error(t, err)
	})
}

func TestDetectConflict(t *testing.T) {
	t.Run("无冲突按键返回 false", func(t *testing.T) {
		conflict, hasConflict := DetectConflict("Ctrl+Shift+K", "")
		assert.False(t, hasConflict)
		assert.Empty(t, conflict)
	})

	t.Run("系统级关键保留按键检测到冲突", func(t *testing.T) {
		conflict, hasConflict := DetectConflict("Win+L", "")
		assert.True(t, hasConflict)
		assert.Contains(t, conflict, "system reserved")

		conflict, hasConflict = DetectConflict("Cmd+Space", "")
		assert.True(t, hasConflict)
		assert.Contains(t, conflict, "system reserved")
	})

	t.Run("应用内部已被其他 Action 占用检测到冲突", func(t *testing.T) {
		conflict, hasConflict := DetectConflict("Alt+Space", "globalSpotlight")
		assert.True(t, hasConflict)
		assert.Contains(t, conflict, "occupied by globalSpotlight")
	})
}

func TestSuggestFallback(t *testing.T) {
	t.Run("为冲突的 Alt+Space 提供降级备选键 (REQ-003-AC-003)", func(t *testing.T) {
		fallback := SuggestFallback("Alt+Space")
		assert.NotEmpty(t, fallback)
		assert.NotEqual(t, "Alt+Space", fallback)
		assert.Contains(t, []string{"Alt+Shift+Space", "Ctrl+Shift+Space"}, fallback)
	})

	t.Run("为冲突的 Ctrl+1 提供降级备选键", func(t *testing.T) {
		fallback := SuggestFallback("Ctrl+1")
		assert.NotEmpty(t, fallback)
		assert.NotEqual(t, "Ctrl+1", fallback)
		assert.Contains(t, []string{"Ctrl+Shift+1", "Alt+1"}, fallback)
	})
}
