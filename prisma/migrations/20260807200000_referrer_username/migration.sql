ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referrer_username VARCHAR(30);

CREATE INDEX IF NOT EXISTS profiles_referrer_username_idx ON profiles (referrer_username);
