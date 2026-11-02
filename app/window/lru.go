package window

import (
	"container/list"
	"sync"
)

// LRUCache 线程安全的视口 LRU 访问淘汰缓存
type LRUCache struct {
	mu       sync.Mutex
	capacity int
	elements map[string]*list.Element
	order    *list.List
}

// NewLRUCache 创建指定容量的 LRU 缓存
func NewLRUCache(capacity int) *LRUCache {
	if capacity <= 0 {
		capacity = 10
	}
	return &LRUCache{
		capacity: capacity,
		elements: make(map[string]*list.Element),
		order:    list.New(),
	}
}

// Access 访问某个 ID；若容量超限则淘汰最旧未使用的 ID 并返回
func (c *LRUCache) Access(id string) (evictedID string, evicted bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// 已存在，移至最前端 (MRU)
	if elem, ok := c.elements[id]; ok {
		c.order.MoveToFront(elem)
		return "", false
	}

	// 新插入至最前端
	elem := c.order.PushFront(id)
	c.elements[id] = elem

	// 判断是否超过容量限制
	if c.order.Len() > c.capacity {
		back := c.order.Back()
		if back != nil {
			oldestID := back.Value.(string)
			c.order.Remove(back)
			delete(c.elements, oldestID)
			return oldestID, true
		}
	}

	return "", false
}

// Remove 从 LRU 缓存中显式移除指定 ID
func (c *LRUCache) Remove(id string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if elem, ok := c.elements[id]; ok {
		c.order.Remove(elem)
		delete(c.elements, id)
	}
}

// Size 返回当前缓存中的有效项目数量
func (c *LRUCache) Size() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.order.Len()
}

// Items 返回当前缓存中从最近到最旧的有序 ID 列表
func (c *LRUCache) Items() []string {
	c.mu.Lock()
	defer c.mu.Unlock()

	result := make([]string, 0, c.order.Len())
	for elem := c.order.Front(); elem != nil; elem = elem.Next() {
		result = append(result, elem.Value.(string))
	}
	return result
}
