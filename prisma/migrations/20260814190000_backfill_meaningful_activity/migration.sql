-- Backfill last meaningful activity from real product events (not logins).

UPDATE "profiles" p
SET "last_meaningful_activity_at" = s.last_at
FROM (
  SELECT x.user_id, MAX(x.at) AS last_at
  FROM (
    SELECT k."user_id" AS user_id, k."created_at" AS at
    FROM "knowledge_sources" k
    UNION ALL
    SELECT pr."user_id", pi."created_at"
    FROM "portfolio_items" pi
    INNER JOIN "profiles" pr ON pr."id" = pi."profile_id"
    UNION ALL
    SELECT tqe."owner_user_id", tqe."created_at"
    FROM "twin_query_events" tqe
    UNION ALL
    SELECT f."follower_id", f."created_at"
    FROM "follows" f
    UNION ALL
    SELECT ma."user_id", ma."created_at"
    FROM "meaningful_activities" ma
  ) x
  GROUP BY x.user_id
) s
WHERE p."user_id" = s.user_id
  AND s.last_at IS NOT NULL
  AND (
    p."last_meaningful_activity_at" IS NULL
    OR p."last_meaningful_activity_at" < s.last_at
  );
