package storage

import (
	"errors"
	"fmt"
	"time"
)

// CreateHistory 记录一条多视口 Prompt 广播历史
func (s *Storage) CreateHistory(h *History) error {
	if h == nil {
		return errors.New("history cannot be nil")
	}
	if h.PromptText == "" {
		return errors.New("prompt_text cannot be empty")
	}

	if h.SentAt == 0 {
		h.SentAt = time.Now().Unix()
	}
	if h.ViewportIDs == "" {
		h.ViewportIDs = "[]"
	}

	query := `
		INSERT INTO history (prompt_text, viewport_ids, sent_at, success_count)
		VALUES (?, ?, ?, ?)
	`
	res, err := s.db.Exec(query, h.PromptText, h.ViewportIDs, h.SentAt, h.SuccessCount)
	if err != nil {
		return fmt.Errorf("failed to insert history: %w", err)
	}

	id, err := res.LastInsertId()
	if err == nil {
		h.ID = id
	}
	return nil
}

// ListHistory 查询最近的广播历史记录，按 sent_at DESC 排序
func (s *Storage) ListHistory(limit int) ([]History, error) {
	if limit <= 0 {
		limit = 50
	}

	query := `
		SELECT id, prompt_text, viewport_ids, sent_at, success_count
		FROM history
		ORDER BY sent_at DESC, id DESC
		LIMIT ?
	`
	rows, err := s.db.Query(query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query history: %w", err)
	}
	defer rows.Close()

	var histories []History
	for rows.Next() {
		var h History
		if err := rows.Scan(
			&h.ID,
			&h.PromptText,
			&h.ViewportIDs,
			&h.SentAt,
			&h.SuccessCount,
		); err != nil {
			return nil, fmt.Errorf("failed to scan history row: %w", err)
		}
		histories = append(histories, h)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error during rows iteration: %w", err)
	}
	return histories, nil
}
