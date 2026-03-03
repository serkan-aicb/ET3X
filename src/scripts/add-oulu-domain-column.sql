-- ============================================================
-- NOTE: No migration needed.
--
-- public.skills.oulu_domain already exists as TEXT in the database.
-- Its 6 valid values are:
--   'Analytical, Critical & Creative Thinking'
--   'Sustainability, Responsibility & Ethics'
--   'Communication, Interaction & Digital'
--   'International & Multicultural'
--   'Well-being & Self-Development'
--   'Multidisciplinary & Interdisciplinary'
--
-- The previous version of this file incorrectly attempted to ADD
-- an INTEGER column and remap skills by hardcoded IDs (1-20).
-- That was based on wrong assumptions and has been reverted.
--
-- The only useful index (if not already present):
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_skills_oulu_domain ON skills(oulu_domain);
