-- slide_review ステータスを追加
ALTER TABLE swipe_lp_projects DROP CONSTRAINT IF EXISTS swipe_lp_projects_status_check;

ALTER TABLE swipe_lp_projects
ADD CONSTRAINT swipe_lp_projects_status_check
CHECK (status IN ('draft', 'analyzing', 'slide_review', 'design_selection', 'ready', 'completed'));
