-- Step 1: Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_name TEXT NOT NULL,
  profile_role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.user_sessions IS 'Stores user profile selections for logging purposes';

-- Create index on profile_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_profile_name ON public.user_sessions(profile_name);

-- Step 2: Add resolved_by and resolved_at columns to issues table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'issues' AND column_name = 'resolved_by') THEN
    ALTER TABLE public.issues ADD COLUMN resolved_by TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'issues' AND column_name = 'resolved_at') THEN
    ALTER TABLE public.issues ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
  END IF;
END$$;

-- Step 3: Create issue_activity_log view
CREATE OR REPLACE VIEW public.issue_activity_log AS
SELECT
  i.id,
  i.title as issue_title,
  i.segment,
  i.status,
  i.assigned_to,
  -- For resolved_by, get the user who changed status to 'solved'
  (
    SELECT isl.changed_by
    FROM issue_status_logs isl
    WHERE isl.issue_id = i.id AND isl.new_status = 'solved'
    ORDER BY isl.changed_at DESC
    LIMIT 1
  ) as resolved_by,
  -- For resolved_at, get the timestamp when status changed to 'solved'
  (
    SELECT isl.changed_at
    FROM issue_status_logs isl
    WHERE isl.issue_id = i.id AND isl.new_status = 'solved'
    ORDER BY isl.changed_at DESC
    LIMIT 1
  ) as resolved_at,
  -- Get the most recent commenter
  (
    SELECT c.author_name
    FROM comments c
    WHERE c.issue_id = i.id
    ORDER BY c.created_at DESC
    LIMIT 1
  ) as last_commenter,
  -- Get the most recent comment timestamp
  (
    SELECT c.created_at
    FROM comments c
    WHERE c.issue_id = i.id
    ORDER BY c.created_at DESC
    LIMIT 1
  ) as last_comment_at
FROM
  issues i;

COMMENT ON VIEW public.issue_activity_log IS 'Shows which team member handled each issue, when, and how';

-- Step 4: Setup RLS policies (if needed)
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to user_sessions" ON public.user_sessions FOR ALL USING (true);

SELECT COUNT(*) FROM public.issues;
SELECT * FROM public.issues LIMIT 5; 