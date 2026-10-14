CREATE TABLE short_urls (
  id TEXT PRIMARY KEY CHECK (length(id) = 36),
  destination_url TEXT NOT NULL CHECK (length(destination_url) BETWEEN 1 AND 2048),
  unlock_verifier TEXT CHECK (unlock_verifier IS NULL OR length(unlock_verifier) BETWEEN 1 AND 256),
  expires_at BIGINT CHECK (expires_at IS NULL OR expires_at >= 0),
  owner_id TEXT NOT NULL CHECK (length(owner_id) BETWEEN 1 AND 255),
  created_at BIGINT NOT NULL CHECK (created_at >= 0),
  updated_at BIGINT NOT NULL CHECK (updated_at >= created_at)
);
CREATE TABLE short_url_slugs (
  slug TEXT PRIMARY KEY CHECK (slug ~ '^[a-z0-9_-]{1,64}$'),
  short_url_id TEXT NOT NULL REFERENCES short_urls(id) ON DELETE CASCADE
);
CREATE TABLE short_url_unlock_attempts (
  short_url_id TEXT NOT NULL REFERENCES short_urls(id) ON DELETE CASCADE,
  client_fingerprint TEXT NOT NULL CHECK (length(client_fingerprint) = 43),
  failed_attempts INTEGER NOT NULL CHECK (failed_attempts BETWEEN 1 AND 10),
  locked_until BIGINT,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (short_url_id, client_fingerprint)
);
CREATE INDEX short_url_slugs_url_idx ON short_url_slugs(short_url_id);
CREATE INDEX short_urls_expiry_idx ON short_urls(expires_at) WHERE expires_at IS NOT NULL;
CREATE UNIQUE INDEX short_urls_public_identity_idx
  ON short_urls (destination_url, owner_id, COALESCE(expires_at, -1)) WHERE unlock_verifier IS NULL;

-- Reclaim only an expired alias, keeping the old record's other aliases intact.
CREATE FUNCTION reclaim_expired_short_url_slug() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM short_url_slugs s USING short_urls current_url, short_urls replacement
  WHERE s.slug = NEW.slug AND current_url.id = s.short_url_id AND replacement.id = NEW.short_url_id
    AND current_url.expires_at IS NOT NULL AND current_url.expires_at <= replacement.created_at;
  RETURN NEW;
END;
$$;
CREATE TRIGGER short_url_slugs_reclaim_expired BEFORE INSERT ON short_url_slugs
  FOR EACH ROW EXECUTE FUNCTION reclaim_expired_short_url_slug();
