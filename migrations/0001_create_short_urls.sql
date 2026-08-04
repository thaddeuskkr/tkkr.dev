PRAGMA foreign_keys = ON;

CREATE TABLE short_urls (
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

CREATE TABLE short_url_slugs (
    slug TEXT PRIMARY KEY NOT NULL,
    short_url_id TEXT NOT NULL REFERENCES short_urls (id) ON DELETE CASCADE,
    CHECK (length(slug) BETWEEN 1 AND 64),
    CHECK (slug = lower(slug)),
    CHECK (slug NOT GLOB '*[^a-z0-9_-]*')
);

CREATE TABLE short_url_unlock_attempts (
    short_url_id TEXT NOT NULL REFERENCES short_urls (id) ON DELETE CASCADE,
    client_fingerprint TEXT NOT NULL,
    failed_attempts INTEGER NOT NULL,
    locked_until INTEGER,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (short_url_id, client_fingerprint),
    CHECK (length(client_fingerprint) = 43),
    CHECK (failed_attempts BETWEEN 1 AND 10),
    CHECK (locked_until IS NULL OR locked_until >= updated_at),
    CHECK (updated_at >= 0)
);

CREATE INDEX short_url_slugs_short_url_id_idx ON short_url_slugs (short_url_id);
CREATE INDEX short_urls_expires_at_idx ON short_urls (expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX short_url_unlock_attempts_locked_until_idx
    ON short_url_unlock_attempts (locked_until)
    WHERE locked_until IS NOT NULL;

CREATE TRIGGER short_url_slugs_reclaim_expired
BEFORE INSERT ON short_url_slugs
FOR EACH ROW
WHEN EXISTS (
    SELECT 1
    FROM short_url_slugs AS current_slug
    INNER JOIN short_urls AS current_url
        ON current_url.id = current_slug.short_url_id
    INNER JOIN short_urls AS replacement_url
        ON replacement_url.id = NEW.short_url_id
    WHERE current_slug.slug = NEW.slug
      AND current_url.expires_at IS NOT NULL
      AND current_url.expires_at <= replacement_url.created_at
)
BEGIN
    DELETE FROM short_url_slugs
    WHERE slug = NEW.slug;
END;
