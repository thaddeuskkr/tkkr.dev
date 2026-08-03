CREATE TABLE quick_link_unlock_attempts (
    quick_link_id TEXT NOT NULL REFERENCES quick_links (id) ON DELETE CASCADE,
    client_fingerprint TEXT NOT NULL,
    failed_attempts INTEGER NOT NULL,
    locked_until INTEGER,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (quick_link_id, client_fingerprint),
    CHECK (length(client_fingerprint) = 43),
    CHECK (failed_attempts BETWEEN 1 AND 10),
    CHECK (locked_until IS NULL OR locked_until >= updated_at),
    CHECK (updated_at >= 0)
);

CREATE INDEX quick_link_unlock_attempts_locked_until_idx
    ON quick_link_unlock_attempts (locked_until)
    WHERE locked_until IS NOT NULL;
