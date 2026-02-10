-- 共有URLを短くするため short_id を追加（新規プロジェクトから使用）
ALTER TABLE swipe_lp_v3_projects
  ADD COLUMN IF NOT EXISTS short_id TEXT UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_swipe_lp_v3_projects_short_id
  ON swipe_lp_v3_projects(short_id)
  WHERE short_id IS NOT NULL;

COMMENT ON COLUMN swipe_lp_v3_projects.short_id IS '短い共有用ID（例: abc12XYZ）。URLは /swipe-lp/{short_id} になる。既存行はNULLのままUUIDでアクセス可能。';
