CREATE TABLE IF NOT EXISTS bookmarks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id     TEXT    NOT NULL UNIQUE,
    name        TEXT    NOT NULL,
    url         TEXT    NOT NULL,
    icon_url    TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    session_key TEXT    NOT NULL,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_sort ON bookmarks(sort_order);

CREATE TABLE IF NOT EXISTS prompts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    content     TEXT    NOT NULL,
    category    TEXT    DEFAULT '',
    tags        TEXT    DEFAULT '[]',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
    title,
    content,
    content='prompts',
    content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS prompts_ai AFTER INSERT ON prompts BEGIN
    INSERT INTO prompts_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;
CREATE TRIGGER IF NOT EXISTS prompts_ad AFTER DELETE ON prompts BEGIN
    INSERT INTO prompts_fts(prompts_fts, rowid, title, content)
        VALUES('delete', old.id, old.title, old.content);
END;
CREATE TRIGGER IF NOT EXISTS prompts_au AFTER UPDATE ON prompts BEGIN
    INSERT INTO prompts_fts(prompts_fts, rowid, title, content)
        VALUES('delete', old.id, old.title, old.content);
    INSERT INTO prompts_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

CREATE TABLE IF NOT EXISTS history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_text   TEXT    NOT NULL,
    viewport_ids  TEXT    NOT NULL,
    sent_at       INTEGER NOT NULL,
    success_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_history_sent_at ON history(sent_at DESC);
