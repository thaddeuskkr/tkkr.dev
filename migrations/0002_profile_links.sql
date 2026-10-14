CREATE TABLE IF NOT EXISTS profile_links (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL CHECK (group_id IN ('social','links')),
    name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
    description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 500),
    destination TEXT NOT NULL CHECK (length(destination) BETWEEN 1 AND 2048),
    href TEXT NOT NULL CHECK (length(href) BETWEEN 1 AND 2048),
    icon JSONB NOT NULL,
    access TEXT CHECK (access = 'Restricted'),
    keywords TEXT[] NOT NULL DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS profile_links_order_idx ON profile_links(group_id, sort_order, id);
CREATE TABLE IF NOT EXISTS admin_settings (id TEXT PRIMARY KEY);
