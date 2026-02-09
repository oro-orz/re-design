-- user_id の参照先を auth.users から app_users(id) に変更する。
-- 既存データ: user_id は現在 auth.users.id なので、app_users.id に置き換える。

-- swipe_lp_v3_projects
UPDATE swipe_lp_v3_projects p
SET user_id = u.id
FROM app_users u
WHERE u.auth_user_id = p.user_id;

ALTER TABLE swipe_lp_v3_projects
  DROP CONSTRAINT IF EXISTS swipe_lp_v3_projects_user_id_fkey;

ALTER TABLE swipe_lp_v3_projects
  ADD CONSTRAINT swipe_lp_v3_projects_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

-- swipe_lp_projects
UPDATE swipe_lp_projects p
SET user_id = u.id
FROM app_users u
WHERE u.auth_user_id = p.user_id;

ALTER TABLE swipe_lp_projects
  DROP CONSTRAINT IF EXISTS swipe_lp_projects_user_id_fkey;

ALTER TABLE swipe_lp_projects
  ADD CONSTRAINT swipe_lp_projects_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;
