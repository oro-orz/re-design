-- 画像→AI自動プロンプト生成対応

-- prompt_templates に image_urls, prompt_text, memo を追加
ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]';
ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS prompt_text TEXT;
ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS memo TEXT;

-- 既存の base_prompt を prompt_text にコピー（移行用）
UPDATE prompt_templates SET prompt_text = base_prompt WHERE prompt_text IS NULL AND base_prompt IS NOT NULL;
