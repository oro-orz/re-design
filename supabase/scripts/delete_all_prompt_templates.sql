-- プロンプトライブラリの全件削除（実行前に確認すること）
-- Supabase SQL Editor で実行
--
-- ※ swipe_lp_v3_projects の selected_template_id は ON DELETE SET NULL のため、
--    削除後は自動で NULL になります（プロジェクトのスライド内の選択も同様に未選択になります）。

DELETE FROM prompt_templates;
