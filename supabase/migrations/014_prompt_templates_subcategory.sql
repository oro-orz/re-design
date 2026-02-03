-- プロンプトテンプレートにサブカテゴリを追加
ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS subcategory TEXT;
