-- Firebase のみ認証に移行するため、auth.users への依存を外す。
-- app_users.auth_user_id を nullable にし、新規ユーザーは Supabase Auth を作らない。

ALTER TABLE app_users
  DROP CONSTRAINT IF EXISTS app_users_auth_user_id_fkey;

ALTER TABLE app_users
  ALTER COLUMN auth_user_id DROP NOT NULL;

COMMENT ON COLUMN app_users.auth_user_id IS '旧 Supabase auth.users の ID。Firebase のみ認証の新規ユーザーは null。';
