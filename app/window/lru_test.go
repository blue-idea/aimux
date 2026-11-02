package window

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLRUCache(t *testing.T) {
	t.Run("未达容量上限时不触发淘汰", func(t *testing.T) {
		cache := NewLRUCache(3)
		evictedID, evicted := cache.Access("vp-1")
		assert.False(t, evicted)
		assert.Empty(t, evictedID)

		evictedID, evicted = cache.Access("vp-2")
		assert.False(t, evicted)
		assert.Empty(t, evictedID)

		assert.Equal(t, 2, cache.Size())
		assert.Equal(t, []string{"vp-2", "vp-1"}, cache.Items())
	})

	t.Run("达到 10 个容量上限后访问新视口挂起最旧视口", func(t *testing.T) {
		cache := NewLRUCache(10)
		for i := 1; i <= 10; i++ {
			evictedID, evicted := cache.Access(fmt.Sprintf("vp-%d", i))
			assert.False(t, evicted)
			assert.Empty(t, evictedID)
		}
		require.Equal(t, 10, cache.Size())

		// 第 11 个激活，应驱逐最旧的 vp-1
		evictedID, evicted := cache.Access("vp-11")
		assert.True(t, evicted)
		assert.Equal(t, "vp-1", evictedID)
		assert.Equal(t, 10, cache.Size())
		assert.Equal(t, "vp-11", cache.Items()[0])
	})

	t.Run("重复访问已存在项提升至 MRU 且不重复计数", func(t *testing.T) {
		cache := NewLRUCache(3)
		cache.Access("vp-1")
		cache.Access("vp-2")
		cache.Access("vp-3")

		// 重新访问 vp-1，提升至最前端
		evictedID, evicted := cache.Access("vp-1")
		assert.False(t, evicted)
		assert.Empty(t, evictedID)
		assert.Equal(t, []string{"vp-1", "vp-3", "vp-2"}, cache.Items())

		// 插入 vp-4 时应淘汰目前最旧的 vp-2
		evictedID, evicted = cache.Access("vp-4")
		assert.True(t, evicted)
		assert.Equal(t, "vp-2", evictedID)
		assert.Equal(t, []string{"vp-4", "vp-1", "vp-3"}, cache.Items())
	})

	t.Run("Remove 成功移除指定视口", func(t *testing.T) {
		cache := NewLRUCache(3)
		cache.Access("vp-1")
		cache.Access("vp-2")
		cache.Access("vp-3")

		cache.Remove("vp-2")
		assert.Equal(t, 2, cache.Size())
		assert.Equal(t, []string{"vp-3", "vp-1"}, cache.Items())
	})

	t.Run("容量为 0 或负数时保底为 10", func(t *testing.T) {
		cache := NewLRUCache(0)
		assert.NotNil(t, cache)
		assert.Equal(t, 0, cache.Size())
	})
}
