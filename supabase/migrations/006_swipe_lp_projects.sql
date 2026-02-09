-- スワイプLPプロジェクト用テーブル
CREATE TABLE swipe_lp_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 入力（URL または 画像）
  input_type TEXT NOT NULL CHECK (input_type IN ('url', 'image')),
  input_url TEXT,
  input_image_url TEXT,

  -- AI分析結果
  analysis JSONB,

  -- スライド構成（配列）
  slides JSONB DEFAULT '[]'::jsonb,

  -- ステータス
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'analyzing', 'ready', 'completed')),

  -- プロジェクト名（編集可能）
  project_name TEXT DEFAULT 'スワイプLPプロジェクト'
);

-- RLS ポリシー
ALTER TABLE swipe_lp_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON swipe_lp_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON swipe_lp_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON swipe_lp_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON swipe_lp_projects FOR DELETE
  USING (auth.uid() = user_id);

-- インデックス
CREATE INDEX idx_swipe_lp_projects_user_id ON swipe_lp_projects(user_id);
CREATE INDEX idx_swipe_lp_projects_status ON swipe_lp_projects(status);
CREATE INDEX idx_swipe_lp_projects_created_at ON swipe_lp_projects(created_at DESC);

-- updated_at の自動更新（PostgreSQL 11+ では EXECUTE FUNCTION）
CREATE OR REPLACE FUNCTION update_swipe_lp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_swipe_lp_projects_updated_at
  BEFORE UPDATE ON swipe_lp_projects
  FOR EACH ROW
  EXECUTE PROCEDURE update_swipe_lp_updated_at();
