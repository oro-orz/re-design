-- プロンプトテンプレートのスタイル＋スロット（一本化：新規はすべて構造化）
-- style_json / slots_json があればプロンプト生成時に被写体・シーン・テキストを案件に合わせて生成

ALTER TABLE prompt_templates
ADD COLUMN IF NOT EXISTS style_json JSONB,
ADD COLUMN IF NOT EXISTS slots_json JSONB;

COMMENT ON COLUMN prompt_templates.style_json IS 'デザインスタイル定義（配色・レイアウト・フォント等）。ある場合は構造化として扱う';
COMMENT ON COLUMN prompt_templates.slots_json IS 'テキストスロット定義（textSlots）。構造化時のみ使用';
