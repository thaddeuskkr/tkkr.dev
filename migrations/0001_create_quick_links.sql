PRAGMA foreign_keys = ON;

CREATE TABLE quick_links (
    id TEXT PRIMARY KEY NOT NULL,
    destination_url TEXT NOT NULL,
    unlock_verifier TEXT,
    expires_at INTEGER,
    owner_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    CHECK (length(id) = 36),
    CHECK (length(destination_url) BETWEEN 1 AND 2048),
    CHECK (unlock_verifier IS NULL OR length(unlock_verifier) BETWEEN 1 AND 256),
    CHECK (expires_at IS NULL OR expires_at >= 0),
    CHECK (length(owner_id) BETWEEN 1 AND 255),
    CHECK (created_at >= 0),
    CHECK (updated_at >= created_at)
);

CREATE TABLE quick_link_slugs (
    slug TEXT PRIMARY KEY NOT NULL,
    quick_link_id TEXT NOT NULL REFERENCES quick_links (id) ON DELETE CASCADE,
    CHECK (length(slug) BETWEEN 1 AND 64),
    CHECK (slug = lower(slug)),
    CHECK (slug NOT GLOB '*[^a-z0-9_-]*')
);

CREATE INDEX quick_link_slugs_link_id_idx ON quick_link_slugs (quick_link_id);
CREATE INDEX quick_links_expires_at_idx ON quick_links (expires_at) WHERE expires_at IS NOT NULL;
