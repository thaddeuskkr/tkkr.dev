CREATE TRIGGER quick_link_slugs_reclaim_expired
BEFORE INSERT ON quick_link_slugs
FOR EACH ROW
WHEN EXISTS (
    SELECT 1
    FROM quick_link_slugs AS current_slug
    INNER JOIN quick_links AS current_link
        ON current_link.id = current_slug.quick_link_id
    INNER JOIN quick_links AS replacement_link
        ON replacement_link.id = NEW.quick_link_id
    WHERE current_slug.slug = NEW.slug
      AND current_link.expires_at IS NOT NULL
      AND current_link.expires_at <= replacement_link.created_at
)
BEGIN
    DELETE FROM quick_link_slugs
    WHERE slug = NEW.slug;
END;
