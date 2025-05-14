-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the table if it exists
DROP TABLE IF EXISTS public.circle_messages;

-- Create the circle_messages table
CREATE TABLE public.circle_messages (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id BIGINT NOT NULL UNIQUE,
  
  -- Flattened fields for efficient querying
  type TEXT NOT NULL CHECK (type IN ('thread', 'single')),
  chat_thread_id BIGINT NOT NULL,
  parent_id BIGINT,
  chat_room_uuid UUID,
  space_name TEXT,
  sender TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE,
  body TEXT,
  message_url TEXT,
  has_replies BOOLEAN DEFAULT FALSE,
  replies_count INTEGER DEFAULT 0,
  
  -- Issue triage fields
  is_issue BOOLEAN DEFAULT FALSE,
  issue_title TEXT,
  issue_type TEXT,
  
  -- Complete JSON storage
  parent_message_json JSONB NOT NULL,
  replies_json JSONB DEFAULT '[]'::jsonb,
  issue_details_json JSONB,
  raw_json JSONB NOT NULL,
  
  -- Metadata
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mapped_to_issue_id UUID
);

-- Create indexes for efficient querying
CREATE INDEX idx_circle_messages_chat_thread_id ON public.circle_messages (chat_thread_id);
CREATE INDEX idx_circle_messages_parent_id ON public.circle_messages (parent_id);
CREATE INDEX idx_circle_messages_created_at ON public.circle_messages (created_at);
CREATE INDEX idx_circle_messages_is_issue ON public.circle_messages (is_issue);
CREATE INDEX idx_circle_messages_type ON public.circle_messages (type);
CREATE INDEX idx_circle_messages_issue_type ON public.circle_messages (issue_type);

-- Create JSON indexing for frequently accessed fields
CREATE INDEX idx_circle_messages_replies_json ON public.circle_messages USING GIN (replies_json);
CREATE INDEX idx_circle_messages_issue_details_json ON public.circle_messages USING GIN (issue_details_json);

-- Create a function to upsert circle messages
CREATE OR REPLACE FUNCTION public.upsert_circle_message(
  p_raw_json JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result_id UUID;
  v_message_id BIGINT;
  v_type TEXT;
  v_chat_thread_id BIGINT;
  v_parent_id BIGINT;
  v_chat_room_uuid UUID;
  v_space_name TEXT;
  v_sender TEXT;
  v_created_at TIMESTAMP WITH TIME ZONE;
  v_edited_at TIMESTAMP WITH TIME ZONE;
  v_body TEXT;
  v_message_url TEXT;
  v_has_replies BOOLEAN;
  v_replies_count INTEGER;
  v_is_issue BOOLEAN;
  v_issue_title TEXT;
  v_issue_type TEXT;
  v_parent_message_json JSONB;
  v_replies_json JSONB;
  v_issue_details_json JSONB;
BEGIN
  -- Extract values from the JSON
  v_type := p_raw_json->>'Type';
  v_parent_message_json := p_raw_json->'Parent_Message';
  v_replies_json := p_raw_json->'Replies';
  v_issue_details_json := p_raw_json->'Issue_Details';
  
  -- Extract flattened fields from parent message
  v_message_id := (v_parent_message_json->>'message_id')::BIGINT;
  v_chat_thread_id := (v_parent_message_json->>'chat_thread_id')::BIGINT;
  v_parent_id := NULLIF(v_parent_message_json->>'parent_id', 'null')::BIGINT;
  
  BEGIN
    v_chat_room_uuid := (v_parent_message_json->>'chat_room_uuid')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_chat_room_uuid := NULL;
  END;
  
  v_space_name := v_parent_message_json->>'space_name';
  
  -- Handle sender differences between thread and single
  IF v_type = 'thread' THEN
    v_sender := v_parent_message_json->>'parent_sender';
  ELSE
    v_sender := v_parent_message_json->>'sender';
  END IF;
  
  v_created_at := (v_parent_message_json->>'created_at')::TIMESTAMP WITH TIME ZONE;
  
  IF v_parent_message_json->>'edited_at' IS NOT NULL AND v_parent_message_json->>'edited_at' != 'null' THEN
    v_edited_at := (v_parent_message_json->>'edited_at')::TIMESTAMP WITH TIME ZONE;
  ELSE
    v_edited_at := NULL;
  END IF;
  
  v_body := v_parent_message_json->>'body';
  v_message_url := v_parent_message_json->>'message_url';
  v_has_replies := (v_parent_message_json->>'has_replies')::BOOLEAN;
  v_replies_count := (v_parent_message_json->>'replies_count')::INTEGER;
  
  -- Extract issue details
  v_is_issue := COALESCE((v_issue_details_json->>'is_issue')::BOOLEAN, FALSE);
  v_issue_title := v_issue_details_json->>'issue_title';
  v_issue_type := v_issue_details_json->>'type';
  
  -- Check if record already exists
  SELECT id INTO v_result_id
  FROM public.circle_messages
  WHERE message_id = v_message_id;
  
  IF v_result_id IS NOT NULL THEN
    -- Update existing record
    UPDATE public.circle_messages
    SET
      type = v_type,
      chat_thread_id = v_chat_thread_id,
      parent_id = v_parent_id,
      chat_room_uuid = v_chat_room_uuid,
      space_name = v_space_name,
      sender = v_sender,
      created_at = v_created_at,
      edited_at = v_edited_at,
      body = v_body,
      message_url = v_message_url,
      has_replies = v_has_replies,
      replies_count = v_replies_count,
      is_issue = v_is_issue,
      issue_title = v_issue_title,
      issue_type = v_issue_type,
      parent_message_json = v_parent_message_json,
      replies_json = v_replies_json,
      issue_details_json = v_issue_details_json,
      raw_json = p_raw_json,
      last_updated_at = NOW()
    WHERE id = v_result_id;
  ELSE
    -- Insert new record
    INSERT INTO public.circle_messages (
      message_id,
      type,
      chat_thread_id,
      parent_id,
      chat_room_uuid,
      space_name,
      sender,
      created_at,
      edited_at,
      body,
      message_url,
      has_replies,
      replies_count,
      is_issue,
      issue_title,
      issue_type,
      parent_message_json,
      replies_json,
      issue_details_json,
      raw_json,
      imported_at,
      last_updated_at
    ) VALUES (
      v_message_id,
      v_type,
      v_chat_thread_id,
      v_parent_id,
      v_chat_room_uuid,
      v_space_name,
      v_sender,
      v_created_at,
      v_edited_at,
      v_body,
      v_message_url,
      v_has_replies,
      v_replies_count,
      v_is_issue,
      v_issue_title,
      v_issue_type,
      v_parent_message_json,
      v_replies_json,
      v_issue_details_json,
      p_raw_json,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_result_id;
  END IF;
  
  RETURN v_result_id;
END;
$$;

-- Create a function to add a reply to an existing thread
CREATE OR REPLACE FUNCTION public.add_circle_message_reply(
  p_chat_thread_id BIGINT,
  p_reply_json JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_thread_exists BOOLEAN;
  v_current_replies JSONB;
  v_reply_exists BOOLEAN := FALSE;
  v_reply_message_id BIGINT;
BEGIN
  -- Check if message exists
  SELECT EXISTS(
    SELECT 1 FROM public.circle_messages 
    WHERE chat_thread_id = p_chat_thread_id
  ) INTO v_thread_exists;
  
  IF NOT v_thread_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Get the current replies
  SELECT replies_json INTO v_current_replies
  FROM public.circle_messages
  WHERE chat_thread_id = p_chat_thread_id;
  
  -- Check if reply already exists
  v_reply_message_id := (p_reply_json->>'message_id')::BIGINT;
  
  IF v_current_replies IS NOT NULL AND jsonb_array_length(v_current_replies) > 0 THEN
    SELECT EXISTS(
      SELECT 1
      FROM jsonb_array_elements(v_current_replies) as reply
      WHERE (reply->>'message_id')::BIGINT = v_reply_message_id
    ) INTO v_reply_exists;
  END IF;
  
  -- If reply doesn't exist, add it
  IF NOT v_reply_exists THEN
    UPDATE public.circle_messages
    SET 
      replies_json = CASE 
        WHEN replies_json IS NULL OR jsonb_array_length(replies_json) = 0 
        THEN jsonb_build_array(p_reply_json)
        ELSE replies_json || p_reply_json
      END,
      has_replies = TRUE,
      replies_count = COALESCE(replies_count, 0) + 1,
      last_updated_at = NOW()
    WHERE chat_thread_id = p_chat_thread_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Create a view for easier access to messages with their replies flattened
CREATE OR REPLACE VIEW public.circle_messages_with_replies AS
SELECT 
  cm.id,
  cm.message_id,
  cm.type,
  cm.chat_thread_id,
  cm.parent_id,
  cm.space_name,
  cm.sender,
  cm.created_at,
  cm.body,
  cm.is_issue,
  cm.issue_title,
  cm.issue_type,
  cm.has_replies,
  cm.replies_count,
  CASE 
    WHEN cm.has_replies AND jsonb_array_length(cm.replies_json) > 0 
    THEN (
      SELECT jsonb_agg(
        jsonb_build_object(
          'message_id', (r->>'message_id')::BIGINT,
          'sender', r->>'replier 1',
          'created_at', (r->>'created_at')::TIMESTAMP WITH TIME ZONE,
          'body', r->>'body'
        )
      )
      FROM jsonb_array_elements(cm.replies_json) r
    )
    ELSE '[]'::jsonb
  END as simplified_replies
FROM 
  public.circle_messages cm;

-- Comments on the tables
COMMENT ON TABLE public.circle_messages IS 'Stores messages from Circle.so, both threads and single messages';
COMMENT ON COLUMN public.circle_messages.id IS 'Internal primary key';
COMMENT ON COLUMN public.circle_messages.message_id IS 'Original message ID from Circle.so';
COMMENT ON COLUMN public.circle_messages.type IS 'Either thread or single';
COMMENT ON COLUMN public.circle_messages.chat_thread_id IS 'Thread ID, same as message_id for single messages';
COMMENT ON COLUMN public.circle_messages.is_issue IS 'Flag indicating if this message is an issue';
COMMENT ON COLUMN public.circle_messages.raw_json IS 'Complete raw JSON from the webhook'; 