-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION public.check_column_exists(p_table_name text, p_column_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = p_table_name
    AND column_name = p_column_name
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$;

-- Function to add the attachments column if it doesn't exist
CREATE OR REPLACE FUNCTION public.add_attachments_column()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  column_exists boolean;
BEGIN
  -- Check if the column exists
  SELECT public.check_column_exists('circle_issues', 'attachments') INTO column_exists;
  
  -- Add the column if it doesn't exist
  IF NOT column_exists THEN
    EXECUTE 'ALTER TABLE public.circle_issues ADD COLUMN attachments text[] DEFAULT NULL';
  END IF;
END;
$$;

-- Update the upsert_circle_issue function to handle attachments
CREATE OR REPLACE FUNCTION public.upsert_circle_issue(
  p_message_id text,
  p_thread_id text,
  p_title text,
  p_body text,
  p_author_name text,
  p_author_email text,
  p_space_name text,
  p_space_id text,
  p_link text,
  p_is_thread boolean,
  p_is_triaged boolean,
  p_triage_confidence numeric,
  p_attachments text[],
  p_raw_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_issue_id uuid;
BEGIN
  -- Try to find an existing issue with the same message_id
  SELECT id INTO v_issue_id
  FROM public.circle_issues
  WHERE message_id = p_message_id;
  
  -- Update or insert the issue
  IF v_issue_id IS NOT NULL THEN
    UPDATE public.circle_issues
    SET 
      thread_id = p_thread_id,
      title = p_title,
      body = p_body,
      author_name = p_author_name,
      author_email = p_author_email,
      space_name = p_space_name,
      space_id = p_space_id,
      link = p_link,
      is_thread = p_is_thread,
      is_triaged = p_is_triaged,
      triage_confidence = p_triage_confidence,
      attachments = p_attachments,
      raw_data = COALESCE(p_raw_data, raw_data),
      last_updated_at = NOW()
    WHERE id = v_issue_id;
    
    RETURN v_issue_id;
  ELSE
    -- Insert a new issue
    INSERT INTO public.circle_issues (
      message_id,
      thread_id,
      title,
      body,
      author_name,
      author_email,
      space_name,
      space_id,
      link,
      is_thread,
      is_triaged,
      triage_confidence,
      attachments,
      raw_data,
      created_at,
      imported_at,
      last_updated_at
    ) VALUES (
      p_message_id,
      p_thread_id,
      p_title,
      p_body,
      p_author_name,
      p_author_email,
      p_space_name,
      p_space_id,
      p_link,
      p_is_thread,
      p_is_triaged,
      p_triage_confidence,
      p_attachments,
      p_raw_data,
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING id INTO v_issue_id;
    
    RETURN v_issue_id;
  END IF;
END;
$$; 