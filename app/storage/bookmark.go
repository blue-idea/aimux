package storage

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
)

// CreateBookmark 创建新的 AI 站点书签
func (s *Storage) CreateBookmark(b *Bookmark) error {
	if b == nil {
		return errors.New("bookmark cannot be nil")
	}
	if b.SiteID == "" {
		return errors.New("site_id cannot be empty")
	}
	if b.Name == "" {
		return errors.New("name cannot be empty")
	}
	if b.URL == "" {
		return errors.New("url cannot be empty")
	}

	now := time.Now().Unix()
	if b.CreatedAt == 0 {
		b.CreatedAt = now
	}
	if b.UpdatedAt == 0 {
		b.UpdatedAt = now
	}

	query := `
		INSERT INTO bookmarks (site_id, name, url, icon_url, sort_order, session_key, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	res, err := s.db.Exec(query, b.SiteID, b.Name, b.URL, b.IconURL, b.SortOrder, b.SessionKey, b.CreatedAt, b.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert bookmark: %w", err)
	}

	id, err := res.LastInsertId()
	if err == nil {
		b.ID = id
	}
	return nil
}

// GetBookmarkBySiteID 根据 site_id 获取单个书签
func (s *Storage) GetBookmarkBySiteID(siteID string) (*Bookmark, error) {
	query := `
		SELECT id, site_id, name, url, icon_url, sort_order, session_key, created_at, updated_at
		FROM bookmarks
		WHERE site_id = ?
	`
	var b Bookmark
	var iconURL sql.NullString
	err := s.db.QueryRow(query, siteID).Scan(
		&b.ID,
		&b.SiteID,
		&b.Name,
		&b.URL,
		&iconURL,
		&b.SortOrder,
		&b.SessionKey,
		&b.CreatedAt,
		&b.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("bookmark not found for site_id %s: %w", siteID, err)
		}
		return nil, fmt.Errorf("failed to query bookmark: %w", err)
	}
	if iconURL.Valid {
		b.IconURL = iconURL.String
	}
	return &b, nil
}

// ListBookmarks 查询所有书签，按 sort_order 升序排序
func (s *Storage) ListBookmarks() ([]Bookmark, error) {
	query := `
		SELECT id, site_id, name, url, icon_url, sort_order, session_key, created_at, updated_at
		FROM bookmarks
		ORDER BY sort_order ASC, id ASC
	`
	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query bookmarks: %w", err)
	}
	defer rows.Close()

	var bookmarks []Bookmark
	for rows.Next() {
		var b Bookmark
		var iconURL sql.NullString
		if err := rows.Scan(
			&b.ID,
			&b.SiteID,
			&b.Name,
			&b.URL,
			&iconURL,
			&b.SortOrder,
			&b.SessionKey,
			&b.CreatedAt,
			&b.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan bookmark row: %w", err)
		}
		if iconURL.Valid {
			b.IconURL = iconURL.String
		}
		bookmarks = append(bookmarks, b)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error during rows iteration: %w", err)
	}
	return bookmarks, nil
}

// UpdateBookmark 更新书签信息
func (s *Storage) UpdateBookmark(b *Bookmark) error {
	if b == nil {
		return errors.New("bookmark cannot be nil")
	}
	if b.SiteID == "" {
		return errors.New("site_id cannot be empty")
	}

	if b.UpdatedAt == 0 {
		b.UpdatedAt = time.Now().Unix()
	}

	query := `
		UPDATE bookmarks
		SET name = ?, url = ?, icon_url = ?, sort_order = ?, session_key = ?, updated_at = ?
		WHERE site_id = ?
	`
	res, err := s.db.Exec(query, b.Name, b.URL, b.IconURL, b.SortOrder, b.SessionKey, b.UpdatedAt, b.SiteID)
	if err != nil {
		return fmt.Errorf("failed to update bookmark: %w", err)
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if affected == 0 {
		return fmt.Errorf("bookmark not found for site_id %s", b.SiteID)
	}
	return nil
}

// DeleteBookmark 根据 site_id 删除书签
func (s *Storage) DeleteBookmark(siteID string) error {
	query := `DELETE FROM bookmarks WHERE site_id = ?`
	res, err := s.db.Exec(query, siteID)
	if err != nil {
		return fmt.Errorf("failed to delete bookmark: %w", err)
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if affected == 0 {
		return fmt.Errorf("bookmark not found for site_id %s", siteID)
	}
	return nil
}
