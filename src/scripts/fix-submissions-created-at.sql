-- Align submissions timestamp column with the current application code.
-- The app and generated types use submissions.created_at. Older schema drafts used submitted_at.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'submissions'
      AND column_name = 'submitted_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'submissions'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.submissions RENAME COLUMN submitted_at TO created_at;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'submissions'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.submissions
      ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'submissions'
      AND column_name = 'submitted_at'
  ) THEN
    EXECUTE 'UPDATE public.submissions SET created_at = COALESCE(created_at, submitted_at) WHERE created_at IS NULL';
  END IF;
END $$;

ALTER TABLE public.submissions
  ALTER COLUMN created_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at);

COMMENT ON COLUMN public.submissions.created_at IS 'Submission creation timestamp used by the Talent3X app.';
