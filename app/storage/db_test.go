package storage_test

import (
	"path/filepath"
	"testing"
	"time"

	"aimux/app/storage"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupTestDB 创建临时数据库实例供测试使用
func setupTestDB(t *testing.T) (*storage.Storage, func()) {
	t.Helper()
	tempDir := t.TempDir()
	dbPath := filepath.Join(tempDir, "test_aimux.db")

	store, err := storage.NewStorage(dbPath)
	require.NoError(t, err, "NewStorage should succeed on valid path")
	require.NotNil(t, store)

	cleanup := func() {
		_ = store.Close()
	}
	return store, cleanup
}

// REQ-001-AC-001: 站点书签持久化到 SQLite bookmarks 表
func TestBookmarks_CRUD(t *testing.T) {
	store, cleanup := setupTestDB(t)
	defer cleanup()

	now := time.Now().Unix()

	// 1. Create
	b1 := &storage.Bookmark{
		SiteID:     "chatgpt-default",
		Name:       "ChatGPT",
		URL:        "https://chatgpt.com",
		IconURL:    "https://chatgpt.com/favicon.ico",
		SortOrder:  1,
		SessionKey: "chatgpt-session-1",
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	err := store.CreateBookmark(b1)
	assert.NoError(t, err)
	assert.Greater(t, b1.ID, int64(0))

	b2 := &storage.Bookmark{
		SiteID:     "claude-default",
		Name:       "Claude",
		URL:        "https://claude.ai",
		IconURL:    "https://claude.ai/favicon.ico",
		SortOrder:  0,
		SessionKey: "claude-session-1",
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	err = store.CreateBookmark(b2)
	assert.NoError(t, err)

	// 2. Get by SiteID
	got, err := store.GetBookmarkBySiteID("chatgpt-default")
	assert.NoError(t, err)
	assert.Equal(t, "ChatGPT", got.Name)
	assert.Equal(t, "https://chatgpt.com", got.URL)

	// 3. List ordered by sort_order
	list, err := store.ListBookmarks()
	assert.NoError(t, err)
	require.Len(t, list, 2)
	assert.Equal(t, "claude-default", list[0].SiteID, "sort_order 0 should appear before sort_order 1")
	assert.Equal(t, "chatgpt-default", list[1].SiteID)

	// 4. Update
	b1.Name = "ChatGPT Plus"
	b1.SortOrder = 5
	b1.UpdatedAt = now + 10
	err = store.UpdateBookmark(b1)
	assert.NoError(t, err)

	updated, err := store.GetBookmarkBySiteID("chatgpt-default")
	assert.NoError(t, err)
	assert.Equal(t, "ChatGPT Plus", updated.Name)
	assert.Equal(t, 5, updated.SortOrder)

	// 5. Delete
	err = store.DeleteBookmark("chatgpt-default")
	assert.NoError(t, err)

	deleted, err := store.GetBookmarkBySiteID("chatgpt-default")
	assert.Error(t, err)
	assert.Nil(t, deleted)

	remaining, err := store.ListBookmarks()
	assert.NoError(t, err)
	assert.Len(t, remaining, 1)
}

// REQ-011-AC-001: 保存 Prompt 记录插入 SQLite prompts 表和 prompts_fts 全文检索表
// REQ-011-AC-002: Prompt FTS 全文检索返回匹配结果
func TestPrompts_CRUD_And_FTS(t *testing.T) {
	store, cleanup := setupTestDB(t)
	defer cleanup()

	now := time.Now().Unix()

	// 1. Create prompt
	p1 := &storage.Prompt{
		Title:     "Go Refactoring Assistant",
		Content:   "Please analyze the following Go code for concurrency safety and refactor it.",
		Category:  "Coding",
		Tags:      `["golang", "refactor"]`,
		CreatedAt: now,
		UpdatedAt: now,
	}
	err := store.CreatePrompt(p1)
	assert.NoError(t, err)
	assert.Greater(t, p1.ID, int64(0))

	p2 := &storage.Prompt{
		Title:     "Markdown Table Formatter",
		Content:   "Convert the raw list data into an aligned GitHub Flavored Markdown table.",
		Category:  "Documentation",
		Tags:      `["markdown", "tools"]`,
		CreatedAt: now,
		UpdatedAt: now,
	}
	err = store.CreatePrompt(p2)
	assert.NoError(t, err)

	// 2. Get prompt
	got, err := store.GetPrompt(p1.ID)
	assert.NoError(t, err)
	assert.Equal(t, "Go Refactoring Assistant", got.Title)

	// 3. FTS Search - search by title keyword
	res1, err := store.SearchPrompts("Refactoring")
	assert.NoError(t, err)
	require.Len(t, res1, 1)
	assert.Equal(t, p1.ID, res1[0].ID)

	// 4. FTS Search - search by content keyword
	res2, err := store.SearchPrompts("concurrency")
	assert.NoError(t, err)
	require.Len(t, res2, 1)
	assert.Equal(t, p1.ID, res2[0].ID)

	// 5. FTS Search - search non-existent keyword
	res3, err := store.SearchPrompts("QuantumTeleportation")
	assert.NoError(t, err)
	assert.Empty(t, res3)

	// 6. Update prompt and verify FTS sync
	p1.Content = "Please analyze Python async code."
	p1.UpdatedAt = now + 5
	err = store.UpdatePrompt(p1)
	assert.NoError(t, err)

	// Old content keyword should no longer match
	resOld, err := store.SearchPrompts("concurrency")
	assert.NoError(t, err)
	assert.Empty(t, resOld)

	// New content keyword should match
	resNew, err := store.SearchPrompts("Python")
	assert.NoError(t, err)
	require.Len(t, resNew, 1)
	assert.Equal(t, p1.ID, resNew[0].ID)

	// 7. Delete prompt and verify FTS removal
	err = store.DeletePrompt(p1.ID)
	assert.NoError(t, err)

	resDeleted, err := store.SearchPrompts("Python")
	assert.NoError(t, err)
	assert.Empty(t, resDeleted)
}

// 广播历史记录创建与倒序查询测试
func TestHistory_CRUD(t *testing.T) {
	store, cleanup := setupTestDB(t)
	defer cleanup()

	baseTime := time.Now().Unix()

	h1 := &storage.History{
		PromptText:   "Hello AI 1",
		ViewportIDs:  `["chatgpt", "claude"]`,
		SentAt:       baseTime,
		SuccessCount: 2,
	}
	err := store.CreateHistory(h1)
	assert.NoError(t, err)
	assert.Greater(t, h1.ID, int64(0))

	h2 := &storage.History{
		PromptText:   "Hello AI 2",
		ViewportIDs:  `["chatgpt", "gemini"]`,
		SentAt:       baseTime + 10,
		SuccessCount: 2,
	}
	err = store.CreateHistory(h2)
	assert.NoError(t, err)

	histories, err := store.ListHistory(10)
	assert.NoError(t, err)
	require.Len(t, histories, 2)
	assert.Equal(t, "Hello AI 2", histories[0].PromptText, "most recent history should come first")
	assert.Equal(t, "Hello AI 1", histories[1].PromptText)
}

// 书签模块边界与错误路径测试
func TestBookmarks_EdgeCasesAndErrors(t *testing.T) {
	store, cleanup := setupTestDB(t)
	defer cleanup()

	// nil bookmark
	assert.Error(t, store.CreateBookmark(nil))
	assert.Error(t, store.UpdateBookmark(nil))

	// 缺少必填字段
	assert.Error(t, store.CreateBookmark(&storage.Bookmark{SiteID: ""}))
	assert.Error(t, store.CreateBookmark(&storage.Bookmark{SiteID: "s1", Name: ""}))
	assert.Error(t, store.CreateBookmark(&storage.Bookmark{SiteID: "s1", Name: "N1", URL: ""}))

	assert.Error(t, store.UpdateBookmark(&storage.Bookmark{SiteID: ""}))

	// 更新/删除不存在的书签
	assert.Error(t, store.UpdateBookmark(&storage.Bookmark{SiteID: "non-existent"}))
	assert.Error(t, store.DeleteBookmark("non-existent"))
}

// Prompt 模块边界与错误路径测试
func TestPrompts_EdgeCasesAndErrors(t *testing.T) {
	store, cleanup := setupTestDB(t)
	defer cleanup()

	// nil prompt
	assert.Error(t, store.CreatePrompt(nil))
	assert.Error(t, store.UpdatePrompt(nil))

	// 缺少必填字段
	assert.Error(t, store.CreatePrompt(&storage.Prompt{Title: ""}))
	assert.Error(t, store.CreatePrompt(&storage.Prompt{Title: "T1", Content: ""}))

	// 查询不存在的 prompt
	got, err := store.GetPrompt(999999)
	assert.Error(t, err)
	assert.Nil(t, got)

	// 更新无效 id / 不存在
	assert.Error(t, store.UpdatePrompt(&storage.Prompt{ID: 0}))
	assert.Error(t, store.UpdatePrompt(&storage.Prompt{ID: -1}))
	assert.Error(t, store.UpdatePrompt(&storage.Prompt{ID: 999999, Title: "T"}))

	// 删除不存在
	assert.Error(t, store.DeletePrompt(999999))

	// 空字符串检索
	emptyRes, err := store.SearchPrompts("")
	assert.NoError(t, err)
	assert.Empty(t, emptyRes)
}

// 广播历史边界测试
func TestHistory_EdgeCases(t *testing.T) {
	store, cleanup := setupTestDB(t)
	defer cleanup()

	// nil history
	assert.Error(t, store.CreateHistory(nil))

	// 缺少必填字段
	assert.Error(t, store.CreateHistory(&storage.History{PromptText: ""}))

	// limit <= 0 自动应用默认值
	h := &storage.History{
		PromptText:  "Test",
		ViewportIDs: "[]",
	}
	assert.NoError(t, store.CreateHistory(h))

	list, err := store.ListHistory(0)
	assert.NoError(t, err)
	assert.NotEmpty(t, list)
}

// Storage 生命周期与安全关闭测试
func TestStorage_Close(t *testing.T) {
	store, cleanup := setupTestDB(t)
	defer cleanup()

	assert.NoError(t, store.Close())

	// 重复关闭或 nil 关闭不应 panic
	var nilStore storage.Storage
	assert.NoError(t, nilStore.Close())
}

// 默认值填充测试（时间戳、默认标签、NULL 图标）
func TestStorage_Defaults(t *testing.T) {
	store, cleanup := setupTestDB(t)
	defer cleanup()

	// 1. Bookmark 无创建时间和无图标
	b := &storage.Bookmark{
		SiteID:     "minimal-site",
		Name:       "Minimal",
		URL:        "https://example.com",
		SessionKey: "key-1",
	}
	err := store.CreateBookmark(b)
	assert.NoError(t, err)
	assert.Greater(t, b.CreatedAt, int64(0))
	assert.Greater(t, b.UpdatedAt, int64(0))

	gotB, err := store.GetBookmarkBySiteID("minimal-site")
	assert.NoError(t, err)
	assert.Empty(t, gotB.IconURL)

	b.UpdatedAt = 0
	assert.NoError(t, store.UpdateBookmark(b))

	// 2. Prompt 无时间戳和无 Tags
	p := &storage.Prompt{
		Title:   "Minimal Prompt",
		Content: "Minimal content",
	}
	err = store.CreatePrompt(p)
	assert.NoError(t, err)
	assert.Greater(t, p.CreatedAt, int64(0))
	assert.Equal(t, "[]", p.Tags)

	p.UpdatedAt = 0
	assert.NoError(t, store.UpdatePrompt(p))

	// 3. History 无时间戳和无 ViewportIDs
	h := &storage.History{
		PromptText: "Broadcast text",
	}
	err = store.CreateHistory(h)
	assert.NoError(t, err)
	assert.Greater(t, h.SentAt, int64(0))
	assert.Equal(t, "[]", h.ViewportIDs)
}

// 非法目录初始化测试
func TestNewStorage_InvalidPath(t *testing.T) {
	// 使用不可写入的非法路径测试目录创建失败
	_, err := storage.NewStorage("/dev/null/forbidden/aimux.db")
	assert.Error(t, err)
}


