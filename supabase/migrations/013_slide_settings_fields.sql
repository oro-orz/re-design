-- Step 3: スライドテキストの設定用フィールド

ALTER TABLE swipe_lp_v3_projects
ADD COLUMN IF NOT EXISTS emphasis_points TEXT,
ADD COLUMN IF NOT EXISTS output_tone TEXT,
ADD COLUMN IF NOT EXISTS slide_count SMALLINT;

COMMENT ON COLUMN swipe_lp_v3_projects.emphasis_points IS '特に強調したい点（スライド生成時にプロンプトに反映）';
COMMENT ON COLUMN swipe_lp_v3_projects.output_tone IS 'テキストのトーン: neutral / casual / professional / playful';
COMMENT ON COLUMN swipe_lp_v3_projects.slide_count IS 'スライド枚数指定: 6, 7, 8。NULL のときは 6-8 枚で生成';
