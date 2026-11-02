package storage

import (
	"database/sql"
	"embed"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "modernc.org/sqlite"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// Bookmark represents an AI site source configuration.
type Bookmark struct {
	ID         int64  `json:"id"`
	SiteID     string `json:"site_id"`
	Name       string `json:"name"`
	URL        string `json:"url"`
	IconURL    string `json:"icon_url"`
	SortOrder  int    `json:"sort_order"`
	SessionKey string `json:"session_key"`
	CreatedAt  int64  `json:"created_at"`
	UpdatedAt  int64  `json:"updated_at"`
}

// Prompt represents a prompt entry in the knowledge base.
type Prompt struct {
	ID        int64  `json:"id"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	Category  string `json:"category"`
	Tags      string `json:"tags"`
	CreatedAt int64  `json:"created_at"`
	UpdatedAt int64  `json:"updated_at"`
}

// History represents a record of a multi-viewport prompt broadcast.
type History struct {
	ID           int64  `json:"id"`
	PromptText   string `json:"prompt_text"`
	ViewportIDs  string `json:"viewport_ids"`
	SentAt       int64  `json:"sent_at"`
	SuccessCount int    `json:"success_count"`
}

// Storage manages persistent SQLite database operations.
type Storage struct {
	db *sql.DB
}

// NewStorage opens SQLite database, configures WAL mode, and applies pending migrations.
func NewStorage(dbPath string) (*Storage, error) {
	dir := filepath.Dir(dbPath)
	if dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create database directory: %w", err)
		}
	}

	dsn := fmt.Sprintf("%s?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)&_pragma=foreign_keys(ON)", dbPath)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// 验证数据库连接
	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// 执行数据库迁移
	if err := runMigrations(db); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	return &Storage{db: db}, nil
}

// runMigrations 使用 golang-migrate 执行嵌入式 SQL 迁移
func runMigrations(db *sql.DB) error {
	sourceDriver, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("failed to load embedded migrations: %w", err)
	}

	dbDriver, err := sqlite.WithInstance(db, &sqlite.Config{})
	if err != nil {
		return fmt.Errorf("failed to init sqlite driver for migrate: %w", err)
	}

	m, err := migrate.NewWithInstance("iofs", sourceDriver, "sqlite", dbDriver)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("failed to apply migrations up: %w", err)
	}

	return nil
}

// Close closes the underlying database connection.
func (s *Storage) Close() error {
	if s.db == nil {
		return nil
	}
	return s.db.Close()
}
