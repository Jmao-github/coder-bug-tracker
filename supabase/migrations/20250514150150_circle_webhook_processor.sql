-- Migration: 20250514150150_circle_webhook_processor.sql
-- Purpose: Create a function to process n8n webhook payloads for Circle.so data
-- This migration adds a function specifically designed to handle the n8n webhook JSON format

-- process_circle_webhook: Function to process n8n webhook data
create or replace function public.process_circle_webhook(
    p_payload jsonb,
    p_import_source text default 'n8n_webhook',
    p_imported_by text default 'system'
) returns jsonb language plpgsql as $$
declare
    v_message_type text;
    v_parent_message jsonb;
    v_replies jsonb;
    v_issue_details jsonb;
    v_circle_issue_id uuid;
    v_issue_id uuid;
    v_issue_title text;
    v_issue_segment text;
    v_message_id text;
    v_thread_id text;
    v_parent_body text;
    v_parent_sender text;
    v_chat_room_uuid text;
    v_space_name text;
    v_message_url text;
    v_created_at timestamp with time zone;
    v_has_replies boolean;
    v_reply record;
    v_result jsonb = '{}'::jsonb;
    v_reply_count integer = 0;
begin
    -- Extract key components from the payload
    v_message_type = p_payload->>'Type';
    v_parent_message = p_payload->'Parent_Message';
    v_replies = p_payload->'Replies';
    v_issue_details = p_payload->'Issue_Details';
    
    -- Extract common fields from parent message
    v_message_id = v_parent_message->>'message_id';
    v_thread_id = v_parent_message->>'chat_thread_id';
    v_parent_body = v_parent_message->>'body';
    
    -- Handle different formats for sender name
    v_parent_sender = coalesce(
        v_parent_message->>'sender',
        v_parent_message->>'parent_sender',
        'Unknown User'
    );
    
    v_chat_room_uuid = v_parent_message->>'chat_room_uuid';
    v_space_name = v_parent_message->>'space_name';
    v_message_url = v_parent_message->>'message_url';
    v_created_at = (v_parent_message->>'created_at')::timestamp with time zone;
    v_has_replies = (v_parent_message->>'has_replies')::boolean;
    
    -- Use issue details if available, otherwise generate defaults
    if v_issue_details is not null and (v_issue_details->>'is_issue')::boolean then
        v_issue_title = v_issue_details->>'issue_title';
        v_issue_segment = lower(v_issue_details->>'type');
        
        -- Ensure segment is one of the allowed values
        if v_issue_segment not in ('auth', 'code', 'tool', 'misc') then
            v_issue_segment = 'misc';
        end if;
    else
        -- Generate title and determine segment automatically
        v_issue_title = substring(v_parent_body from 1 for 50) || 
                     case when length(v_parent_body) > 50 then '...' else '' end;
        v_issue_segment = public.determine_segment(v_issue_title, v_parent_body);
    end if;
    
    -- Insert or update the circle issue
    v_circle_issue_id = public.upsert_circle_issue(
        v_message_id,
        v_thread_id::text,
        v_issue_title,
        v_parent_body,
        v_parent_sender,
        null, -- email is often not provided
        v_space_name,
        null, -- space_id is often not provided
        v_message_url,
        v_message_type = 'thread',
        p_payload
    );
    
    v_result = jsonb_build_object(
        'circle_issue_id', v_circle_issue_id,
        'message_type', v_message_type,
        'title', v_issue_title,
        'segment', v_issue_segment
    );
    
    -- Process replies if this is a thread
    if v_message_type = 'thread' and jsonb_array_length(v_replies) > 0 then
        -- Delete existing replies to avoid duplicates
        delete from public.circle_replies 
        where circle_issue_id = v_circle_issue_id;
        
        -- Insert all replies
        for v_reply in select * from jsonb_array_elements(v_replies)
        loop
            v_reply_count = v_reply_count + 1;
            
            insert into public.circle_replies (
                message_id,
                circle_issue_id,
                reply_index,
                author_name,
                body,
                created_at,
                edited_at,
                raw_data
            ) values (
                v_reply.value->>'message_id',
                v_circle_issue_id,
                (v_reply.value->>'reply_index')::integer,
                coalesce(v_reply.value->>'replier ' || (v_reply.value->>'reply_index'), 'Unknown'),
                v_reply.value->>'body',
                (v_reply.value->>'created_at')::timestamp with time zone,
                (v_reply.value->>'edited_at')::timestamp with time zone,
                v_reply.value
            );
        end loop;
        
        v_result = v_result || jsonb_build_object('replies_processed', v_reply_count);
    end if;
    
    -- If this issue hasn't been mapped to a bug tracker issue yet, create one
    select mapped_to_issue_id into v_issue_id 
    from public.circle_issues 
    where id = v_circle_issue_id;
    
    if v_issue_id is null then
        -- Create a new issue
        insert into public.issues (
            title,
            description,
            status,
            segment,
            submitted_by,
            tags,
            created_at
        ) values (
            v_issue_title,
            public.format_circle_message_description(v_circle_issue_id),
            'waiting_for_help',
            v_issue_segment,
            v_parent_sender,
            array[v_issue_segment, 'circle'],
            v_created_at
        )
        returning id into v_issue_id;
        
        -- Update the circle issue with the mapped issue id
        update public.circle_issues
        set mapped_to_issue_id = v_issue_id,
            is_triaged = true,
            triage_confidence = 1.0
        where id = v_circle_issue_id;
        
        -- Log the import
        insert into public.issue_import_logs (
            circle_issue_id,
            issue_id,
            imported_by,
            import_source,
            import_notes,
            is_automatic
        ) values (
            v_circle_issue_id,
            v_issue_id,
            p_imported_by,
            p_import_source,
            'Automatically imported from n8n webhook',
            true
        );
        
        v_result = v_result || jsonb_build_object(
            'issue_id', v_issue_id,
            'action', 'created'
        );
    else
        -- Update the existing issue if needed
        update public.issues
        set description = public.format_circle_message_description(v_circle_issue_id),
            updated_at = now()
        where id = v_issue_id;
        
        v_result = v_result || jsonb_build_object(
            'issue_id', v_issue_id,
            'action', 'updated'
        );
    end if;
    
    return v_result;
end;
$$;

comment on function public.process_circle_webhook is 'Processes n8n webhook payloads for Circle.so data and creates/updates issues';

-- Create a secure API endpoint for the webhook
-- NOTE: In a production environment, this would be protected with proper authentication
-- This example uses a simple API key approach - replace with proper authentication in production
create or replace function public.api_receive_circle_webhook(
    p_payload jsonb,
    p_api_key text
) returns jsonb language plpgsql security definer as $$
declare
    v_valid_key text = 'your_api_key_here'; -- Replace with secure key management
    v_result jsonb;
begin
    -- Validate API key
    if p_api_key != v_valid_key then
        return jsonb_build_object(
            'success', false,
            'error', 'Invalid API key'
        );
    end if;
    
    -- Process the webhook
    v_result = public.process_circle_webhook(p_payload);
    
    return jsonb_build_object(
        'success', true,
        'data', v_result
    );
exception
    when others then
        return jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'detail', SQLSTATE
        );
end;
$$;

comment on function public.api_receive_circle_webhook is 'API endpoint for receiving n8n webhooks with Circle.so data';

-- Grant execute permission to anon role for webhook access
grant execute on function public.api_receive_circle_webhook to anon; 