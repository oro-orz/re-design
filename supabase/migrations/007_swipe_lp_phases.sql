-- 4フェーズ構造対応: phase1〜phase4 と overall_status を追加
-- MVP: Phase 1-3 の基本機能用。Phase 4（実行履歴）は後回し。

ALTER TABLE swipe_lp_projects ADD COLUMN IF NOT EXISTS phase1 JSONB;
ALTER TABLE swipe_lp_projects ADD COLUMN IF NOT EXISTS phase2 JSONB;
ALTER TABLE swipe_lp_projects ADD COLUMN IF NOT EXISTS phase3 JSONB;
ALTER TABLE swipe_lp_projects ADD COLUMN IF NOT EXISTS phase4 JSONB;
ALTER TABLE swipe_lp_projects ADD COLUMN IF NOT EXISTS overall_status TEXT DEFAULT 'draft';

-- overall_status の制約（既存の status は従来互換のため残す）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'swipe_lp_projects_overall_status_check'
  ) THEN
    ALTER TABLE swipe_lp_projects ADD CONSTRAINT swipe_lp_projects_overall_status_check
      CHECK (overall_status IN ('draft', 'phase1', 'phase2', 'phase3', 'phase4', 'completed'));
  END IF;
END $$;

-- 既存行で overall_status が NULL の場合は 'draft' に更新
UPDATE swipe_lp_projects SET overall_status = 'draft' WHERE overall_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_swipe_lp_projects_overall_status ON swipe_lp_projects(overall_status);
