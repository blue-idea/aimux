package storage

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

// CreatePrompt 创建新的 Prompt 记录并自动通过触发器同步到 prompts_fts
func (s *Storage) CreatePrompt(p *Prompt) error {
	if p == nil {
		return errors.New("prompt cannot be nil")
	}
	if p.Title == "" {
		return errors.New("title cannot be empty")
	}
	if p.Content == "" {
		return errors.New("content cannot be empty")
	}

	now := time.Now().Unix()
	if p.CreatedAt == 0 {
		p.CreatedAt = now
	}
	if p.UpdatedAt == 0 {
		p.UpdatedAt = now
	}
	if p.Tags == "" {
		p.Tags = "[]"
	}

	query := `
		INSERT INTO prompts (title, content, category, tags, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	res, err := s.db.Exec(query, p.Title, p.Content, p.Category, p.Tags, p.CreatedAt, p.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert prompt: %w", err)
	}

	id, err := res.LastInsertId()
	if err == nil {
		p.ID = id
	}
	return nil
}

// GetPrompt 根据 id 获取单个 Prompt 记录
func (s *Storage) GetPrompt(id int64) (*Prompt, error) {
	query := `
		SELECT id, title, content, category, tags, created_at, updated_at
		FROM prompts
		WHERE id = ?
	`
	var p Prompt
	err := s.db.QueryRow(query, id).Scan(
		&p.ID,
		&p.Title,
		&p.Content,
		&p.Category,
		&p.Tags,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("prompt not found for id %d: %w", id, err)
		}
		return nil, fmt.Errorf("failed to query prompt: %w", err)
	}
	return &p, nil
}

// SearchPrompts 基于 FTS5 虚拟表在 title 和 content 中进行全文检索
func (s *Storage) SearchPrompts(query string) ([]Prompt, error) {
	cleanQuery := strings.TrimSpace(query)
	if cleanQuery == "" {
		return []Prompt{}, nil
	}

	// 转义双引号并包装为通配匹配短语
	escaped := strings.ReplaceAll(cleanQuery, `"`, `""`)
	ftsQuery := fmt.Sprintf(`"%s"*`, escaped)

	sqlQuery := `
		SELECT p.id, p.title, p.content, p.category, p.tags, p.created_at, p.updated_at
		FROM prompts_fts f
		JOIN prompts p ON f.rowid = p.id
		WHERE prompts_fts MATCH ?
		ORDER BY rank
	`
	rows, err := s.db.Query(sqlQuery, ftsQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to search prompts fts: %w", err)
	}
	defer rows.Close()

	var prompts []Prompt
	for rows.Next() {
		var p Prompt
		if err := rows.Scan(
			&p.ID,
			&p.Title,
			&p.Content,
			&p.Category,
			&p.Tags,
			&p.CreatedAt,
			&p.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan prompt row: %w", err)
		}
		prompts = append(prompts, p)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error during rows iteration: %w", err)
	}
	return prompts, nil
}

// UpdatePrompt 更新 Prompt 记录（触发器自动更新 prompts_fts）
func (s *Storage) UpdatePrompt(p *Prompt) error {
	if p == nil {
		return errors.New("prompt cannot be nil")
	}
	if p.ID <= 0 {
		return errors.New("invalid prompt id")
	}

	if p.UpdatedAt == 0 {
		p.UpdatedAt = time.Now().Unix()
	}

	query := `
		UPDATE prompts
		SET title = ?, content = ?, category = ?, tags = ?, updated_at = ?
		WHERE id = ?
	`
	res, err := s.db.Exec(query, p.Title, p.Content, p.Category, p.Tags, p.UpdatedAt, p.ID)
	if err != nil {
		return fmt.Errorf("failed to update prompt: %w", err)
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if affected == 0 {
		return fmt.Errorf("prompt not found for id %d", p.ID)
	}
	return nil
}

// DeletePrompt 删除 Prompt 记录（触发器自动清除 prompts_fts 镜像）
func (s *Storage) DeletePrompt(id int64) error {
	query := `DELETE FROM prompts WHERE id = ?`
	res, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete prompt: %w", err)
	}

	affected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if affected == 0 {
		return fmt.Errorf("prompt not found for id %d", id)
	}
	return nil
}
