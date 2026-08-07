-- Mark profiles as onboarded when they already completed activation work
-- (username + bio, passed bio in funnel, or uploaded knowledge).
UPDATE profiles p
SET
  is_onboarded = true,
  onboarding_step = COALESCE(
    NULLIF(TRIM(p.onboarding_step), ''),
    'score'
  )
WHERE p.is_onboarded = false
  AND p.username IS NOT NULL
  AND LENGTH(TRIM(p.username)) >= 3
  AND (
    (p.bio IS NOT NULL AND LENGTH(TRIM(p.bio)) > 0)
    OR p.onboarding_step IN (
      'knowledge',
      'follow',
      'score',
      'celebrate',
      'profile',
      'connect',
      'build'
    )
    OR EXISTS (
      SELECT 1
      FROM knowledge_sources ks
      WHERE ks.user_id = p.user_id
    )
  );
