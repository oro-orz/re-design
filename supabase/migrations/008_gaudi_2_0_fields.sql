-- Gaudí 2.0 用フィールド追加

-- marketing_analysis カラム追加
ALTER TABLE swipe_lp_projects
ADD COLUMN IF NOT EXISTS marketing_analysis JSONB;

-- status 制約に design_selection を追加
ALTER TABLE swipe_lp_projects DROP CONSTRAINT IF EXISTS swipe_lp_projects_status_check;
ALTER TABLE swipe_lp_projects
ADD CONSTRAINT swipe_lp_projects_status_check
CHECK (status IN ('draft', 'analyzing', 'design_selection', 'ready', 'completed'));

-- デザインスタイルライブラリ
CREATE TABLE IF NOT EXISTS design_styles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  author_id UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  yaml_content TEXT NOT NULL,

  tags TEXT[],
  category TEXT,

  usage_count INT DEFAULT 0,
  rating NUMERIC(3,2),

  is_public BOOLEAN DEFAULT false,
  is_official BOOLEAN DEFAULT false
);

-- スタイル使用履歴
CREATE TABLE IF NOT EXISTS style_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES swipe_lp_projects,
  slide_number INT,
  style_id TEXT REFERENCES design_styles,
  business_type TEXT,
  target_audience TEXT,
  was_selected BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_design_styles_category ON design_styles(category);
CREATE INDEX IF NOT EXISTS idx_design_styles_tags ON design_styles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_style_usage_logs_project ON style_usage_logs(project_id);

-- RLS ポリシー (design_styles)
ALTER TABLE design_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public styles are viewable by everyone" ON design_styles;
CREATE POLICY "Public styles are viewable by everyone"
  ON design_styles FOR SELECT
  USING (is_public = true OR auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can insert own styles" ON design_styles;
CREATE POLICY "Users can insert own styles"
  ON design_styles FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- RLS ポリシー (style_usage_logs)
ALTER TABLE style_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own logs" ON style_usage_logs;
CREATE POLICY "Users can view own logs"
  ON style_usage_logs FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM swipe_lp_projects WHERE user_id = auth.uid()
    )
  );
