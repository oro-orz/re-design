-- ============================================================
-- SwipeLP v3 + プロンプトライブラリ 用 SQL
-- Supabase Studio の SQL Editor で実行
-- ============================================================

-- updated_at 関数（006で作成済みの場合はスキップされる）
CREATE OR REPLACE FUNCTION update_swipe_lp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- prompt_templates テーブル
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prompt_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sample_image_url TEXT,
  base_prompt TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- image_urls, prompt_text, memo カラム（011）
ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]';
ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS prompt_text TEXT;
ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS memo TEXT;

ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view prompt_templates" ON prompt_templates;
CREATE POLICY "Authenticated users can view prompt_templates"
  ON prompt_templates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert prompt_templates" ON prompt_templates;
CREATE POLICY "Authenticated users can insert prompt_templates"
  ON prompt_templates FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update prompt_templates" ON prompt_templates;
CREATE POLICY "Authenticated users can update prompt_templates"
  ON prompt_templates FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete prompt_templates" ON prompt_templates;
CREATE POLICY "Authenticated users can delete prompt_templates"
  ON prompt_templates FOR DELETE TO authenticated USING (true);

DROP TRIGGER IF EXISTS update_prompt_templates_updated_at ON prompt_templates;
CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON prompt_templates
  FOR EACH ROW
  EXECUTE PROCEDURE update_swipe_lp_updated_at();

-- ------------------------------------------------------------
-- swipe_lp_v3_projects テーブル
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS swipe_lp_v3_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  input_url TEXT NOT NULL,
  status TEXT DEFAULT 'url_input' CHECK (status IN (
    'url_input', 'analyzing', 'analysis_done',
    'supplement_input', 'slides_ready', 'prompts_ready'
  )),
  marketing_analysis JSONB,
  user_supplement TEXT,
  slides JSONB DEFAULT '[]'::jsonb,
  selected_template_id TEXT REFERENCES prompt_templates(id) ON DELETE SET NULL
);

ALTER TABLE swipe_lp_v3_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own v3 projects" ON swipe_lp_v3_projects;
CREATE POLICY "Users can view own v3 projects"
  ON swipe_lp_v3_projects FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own v3 projects" ON swipe_lp_v3_projects;
CREATE POLICY "Users can insert own v3 projects"
  ON swipe_lp_v3_projects FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own v3 projects" ON swipe_lp_v3_projects;
CREATE POLICY "Users can update own v3 projects"
  ON swipe_lp_v3_projects FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own v3 projects" ON swipe_lp_v3_projects;
CREATE POLICY "Users can delete own v3 projects"
  ON swipe_lp_v3_projects FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_swipe_lp_v3_projects_user_id ON swipe_lp_v3_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_lp_v3_projects_status ON swipe_lp_v3_projects(status);
CREATE INDEX IF NOT EXISTS idx_swipe_lp_v3_projects_created_at ON swipe_lp_v3_projects(created_at DESC);

DROP TRIGGER IF EXISTS update_swipe_lp_v3_projects_updated_at ON swipe_lp_v3_projects;
CREATE TRIGGER update_swipe_lp_v3_projects_updated_at
  BEFORE UPDATE ON swipe_lp_v3_projects
  FOR EACH ROW
  EXECUTE PROCEDURE update_swipe_lp_updated_at();

-- ------------------------------------------------------------
-- Storage: prompt-templates アップロードポリシー
-- パス: prompt-templates/{user_id}/*
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload prompt_templates" ON storage.objects;
CREATE POLICY "Authenticated users can upload prompt_templates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'images'
    AND (storage.foldername(name))[1] = 'prompt-templates'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- ------------------------------------------------------------
-- シード（オプション）
-- ------------------------------------------------------------
INSERT INTO prompt_templates (id, name, category, base_prompt, prompt_text)
VALUES
  ('minimal-pastel', 'ミニマル・パステル', 'minimal-pastel',
   'ミニマルで柔らかいパステル調のデザイン。余白を活かし、丸ゴシック体のタイトル。',
   'ミニマルで柔らかいパステル調のデザイン。余白を活かし、丸ゴシック体のタイトル。'),
  ('pop-comic', 'ポップ・コミック', 'pop-comic',
   'ポップでコミック風のデザイン。太いアウトライン、鮮やかな色使い。',
   'ポップでコミック風のデザイン。太いアウトライン、鮮やかな色使い。')
ON CONFLICT (id) DO NOTHING;
