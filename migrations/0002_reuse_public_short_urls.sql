PRAGMA foreign_keys = ON;

-- Keep the latest metadata timestamp when equivalent public rows are merged.
UPDATE short_urls
SET updated_at = (
    SELECT MAX(peer.updated_at)
    FROM short_urls AS peer
    WHERE peer.unlock_verifier IS NULL
      AND peer.destination_url = short_urls.destination_url
      AND peer.owner_id = short_urls.owner_id
      AND peer.expires_at IS short_urls.expires_at
)
WHERE unlock_verifier IS NULL;

-- Move every public alias to the oldest compatible Short URL row.
UPDATE short_url_slugs
SET short_url_id = (
    SELECT canonical.id
    FROM short_urls AS source
    INNER JOIN short_urls AS canonical
        ON canonical.unlock_verifier IS NULL
       AND canonical.destination_url = source.destination_url
       AND canonical.owner_id = source.owner_id
       AND canonical.expires_at IS source.expires_at
    WHERE source.id = short_url_slugs.short_url_id
    ORDER BY canonical.created_at ASC, canonical.id ASC
    LIMIT 1
)
WHERE short_url_id IN (
    SELECT id
    FROM short_urls
    WHERE unlock_verifier IS NULL
);

-- Remove duplicate or abandoned public rows after their aliases have moved.
DELETE FROM short_urls
WHERE unlock_verifier IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM short_url_slugs
      WHERE short_url_slugs.short_url_id = short_urls.id
  );

CREATE UNIQUE INDEX short_urls_public_identity_idx
    ON short_urls (destination_url, owner_id, IFNULL(expires_at, -1))
    WHERE unlock_verifier IS NULL;
