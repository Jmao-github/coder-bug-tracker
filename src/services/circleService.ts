import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * CircleMessage represents a unified message from Circle that can be a thread or single message
 */
export type CircleMessage = {
  id?: string;
  message_id: number;
  type: 'thread' | 'single';
  chat_thread_id: number;
  parent_id?: number | null;
  chat_room_uuid?: string;
  space_name?: string;
  sender?: string;
  created_at: string;
  edited_at?: string | null;
  body?: string;
  message_url?: string;
  has_replies?: boolean;
  replies_count?: number;
  is_issue?: boolean;
  issue_title?: string;
  issue_type?: string;
  parent_message_json: Record<string, any>;
  replies_json?: Record<string, any>[];
  issue_details_json?: Record<string, any>;
  raw_json: Record<string, any>;
  imported_at?: string;
  last_updated_at?: string;
  mapped_to_issue_id?: string;
};

/**
 * Reply in a thread
 */
export type CircleReply = {
  reply_index: number;
  chat_thread_id: number;
  message_id: number;
  parent_id: number;
  chat_room_uuid?: string;
  replier?: string;
  created_at: string;
  edited_at?: string | null;
  body: string;
  attachments?: string[];
  message_url?: string;
};

/**
 * Result type for n8n webhook sync
 */
export type SyncResult = {
  processedCount: number;
  importedIds: string[];
  errors: string[];
};

/**
 * Fetches messages imported from Circle
 */
export const fetchCircleMessages = async (limit = 50, filter?: { is_issue?: boolean, type?: 'thread' | 'single' }) => {
  try {
    let query = supabase
      .from('circle_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    // Apply filters if provided
    if (filter) {
      if (filter.is_issue !== undefined) {
        query = query.eq('is_issue', filter.is_issue);
      }
      
      if (filter.type) {
        query = query.eq('type', filter.type);
      }
    }
      
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching Circle messages:', error);
      toast.error('Failed to load Circle messages');
      throw error;
    }
    
    return data || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error fetching Circle messages';
    toast.error(message);
    throw error;
  }
};

/**
 * Imports a Circle message into the system
 * @param rawJson The raw JSON from the webhook
 * @returns The UUID of the imported Circle message
 */
export const importCircleMessage = async (rawJson: Record<string, any>) => {
  try {
    console.log('Importing Circle message:', JSON.stringify(rawJson, null, 2));
    
    try {
      // Use the upsert_circle_message Postgres function
      const { data, error } = await supabase.rpc(
        'upsert_circle_message',
        { p_raw_json: rawJson }
      );
      
      if (error) {
        throw error;
      }
      
      toast.success('Circle message imported successfully');
      return data as string;
    } catch (rpcError) {
      console.error('RPC method failed, trying direct insert/update:', rpcError);
      
      // Extract primary data from the raw JSON
      const type = rawJson.Type;
      const parentMessage = rawJson.Parent_Message;
      const messageId = parentMessage.message_id;
      
      // Check if the message already exists
      const { data: existingMessage } = await supabase
        .from('circle_messages')
        .select('id')
        .eq('message_id', messageId)
        .single();
      
      if (existingMessage) {
        // Update existing record
        const { data: updatedMessage, error: updateError } = await supabase
          .from('circle_messages')
          .update({
            type: type,
            chat_thread_id: parentMessage.chat_thread_id,
            parent_id: parentMessage.parent_id,
            chat_room_uuid: parentMessage.chat_room_uuid,
            space_name: parentMessage.space_name,
            sender: type === 'thread' ? parentMessage.parent_sender : parentMessage.sender,
            created_at: parentMessage.created_at,
            edited_at: parentMessage.edited_at,
            body: parentMessage.body,
            message_url: parentMessage.message_url,
            has_replies: parentMessage.has_replies || false,
            replies_count: parentMessage.replies_count || 0,
            is_issue: rawJson.Issue_Details?.is_issue || false,
            issue_title: rawJson.Issue_Details?.issue_title,
            issue_type: rawJson.Issue_Details?.type,
            parent_message_json: parentMessage,
            replies_json: rawJson.Replies || [],
            issue_details_json: rawJson.Issue_Details || null,
            raw_json: rawJson,
            last_updated_at: new Date().toISOString()
          })
          .eq('id', existingMessage.id)
          .select()
          .single();
          
        if (updateError) {
          throw updateError;
        }
        
        toast.success('Circle message updated successfully');
        return updatedMessage.id;
      } else {
        // Insert new record
        const { data: newMessage, error: insertError } = await supabase
          .from('circle_messages')
          .insert({
            message_id: messageId,
            type: type,
            chat_thread_id: parentMessage.chat_thread_id,
            parent_id: parentMessage.parent_id,
            chat_room_uuid: parentMessage.chat_room_uuid,
            space_name: parentMessage.space_name,
            sender: type === 'thread' ? parentMessage.parent_sender : parentMessage.sender,
            created_at: parentMessage.created_at,
            edited_at: parentMessage.edited_at,
            body: parentMessage.body,
            message_url: parentMessage.message_url,
            has_replies: parentMessage.has_replies || false,
            replies_count: parentMessage.replies_count || 0,
            is_issue: rawJson.Issue_Details?.is_issue || false,
            issue_title: rawJson.Issue_Details?.issue_title,
            issue_type: rawJson.Issue_Details?.type,
            parent_message_json: parentMessage,
            replies_json: rawJson.Replies || [],
            issue_details_json: rawJson.Issue_Details || null,
            raw_json: rawJson,
            imported_at: new Date().toISOString(),
            last_updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (insertError) {
          throw insertError;
        }
        
        toast.success('Circle message imported successfully');
        return newMessage.id;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error importing Circle message';
    console.error('Import error details:', error);
    toast.error(message);
    throw error;
  }
};

/**
 * Adds a reply to an existing thread
 * @param threadId The thread ID to add the reply to
 * @param replyJson The reply JSON object
 * @returns Success status
 */
export const addCircleMessageReply = async (threadId: number, replyJson: Record<string, any>) => {
  try {
    // Use the add_circle_message_reply function
    const { data, error } = await supabase.rpc(
      'add_circle_message_reply',
      {
        p_chat_thread_id: threadId,
        p_reply_json: replyJson
      }
    );
    
    if (error) {
      throw error;
    }
    
    if (data) {
      toast.success('Reply added successfully');
    } else {
      toast.info('Reply was not added (may already exist)');
    }
    
    return data as boolean;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error adding reply';
    console.error('Add reply error:', error);
    toast.error(message);
    throw error;
  }
};

/**
 * Triggers the n8n webhook to fetch and process Circle messages
 * @returns A summary of the sync operation
 */
export const syncCircleMessagesFromN8n = async (): Promise<SyncResult> => {
  try {
    // Always use the production n8n webhook URL
    const webhookUrl = 'https://jayeworkflow.app.n8n.cloud/webhook-test/issue-update';
    console.log(`Using webhook URL: ${webhookUrl}`);

    // 1. Call the webhook using POST method
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        action: "sync",
        timestamp: Date.now()
      })
    });

    // Get the response content for debugging regardless of status
    const responseText = await response.text();
    console.log(`Webhook response status: ${response.status}`);
    console.log(`Webhook raw response: ${responseText}`);

    if (!response.ok) {
      throw new Error(`Webhook returned error: ${response.status} ${responseText}`);
    }

    // 2. Parse the response as JSON
    let circleMessages;
    try {
      circleMessages = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      throw new Error(`Invalid JSON response from webhook: ${responseText.substring(0, 100)}...`);
    }

    // 3. Process the webhook data directly
    return await processWebhookData(circleMessages);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error syncing Circle messages';
    console.error('Sync error:', error);
    toast.error(message);
    throw error;
  }
};

/**
 * Transform legacy format or any non-standard format to our unified format
 * @param message The original message data
 * @returns Properly formatted message object
 */
const transformToUnifiedFormat = (message: any): Record<string, any> => {
  // Check if the message is already in the unified format
  if (message.Type && message.Parent_Message) {
    return message;
  }
  
  // Determine if this is a thread or single message
  const isThread = !!message.chat_thread_id && 
                   message.chat_thread_id !== message.message_id;
  
  // Create the unified structure
  const unifiedMessage: Record<string, any> = {
    Type: isThread ? 'thread' : 'single',
    Parent_Message: {
      chat_thread_id: message.chat_thread_id || message.message_id || message.id,
      message_id: message.message_id || message.id,
      parent_id: message.parent_id || null,
      chat_room_uuid: message.chat_room_uuid || message.space_id,
      space_name: message.space_name || 'Unknown',
      created_at: message.created_at || new Date().toISOString(),
      edited_at: message.edited_at || null,
      body: message.body || message.content || message.text || '',
      attachments: Array.isArray(message.attachments) ? message.attachments : [],
      message_url: message.message_url || message.link || '',
      has_replies: Array.isArray(message.replies) && message.replies.length > 0,
      replies_count: Array.isArray(message.replies) ? message.replies.length : 0
    },
    Replies: [],
    Issue_Details: {
      is_issue: message.is_issue || false,
      issue_title: message.issue_title || message.title || 'Untitled Issue',
      type: message.type || 'Misc',
      reasoning: message.reasoning || 'Automatically imported'
    }
  };
  
  // Handle differences between thread and single message
  if (isThread) {
    unifiedMessage.Parent_Message.parent_sender = message.sender || message.author_name || 'Unknown';
  } else {
    unifiedMessage.Parent_Message.sender = message.sender || message.author_name || 'Unknown';
  }
  
  // Add replies if they exist
  if (Array.isArray(message.replies)) {
    unifiedMessage.Replies = message.replies.map((reply: any, index: number) => ({
      reply_index: index + 1,
      chat_thread_id: unifiedMessage.Parent_Message.chat_thread_id,
      message_id: reply.message_id || reply.id || `reply_${Date.now()}_${index}`,
      parent_id: unifiedMessage.Parent_Message.message_id,
      chat_room_uuid: unifiedMessage.Parent_Message.chat_room_uuid,
      ['replier 1']: reply.sender || reply.author_name || 'Unknown', // Match the expected field name
      created_at: reply.created_at || new Date().toISOString(),
      edited_at: reply.edited_at || null,
      body: reply.body || reply.content || reply.text || '',
      attachments: Array.isArray(reply.attachments) ? reply.attachments : [],
      message_url: reply.message_url || reply.link || ''
    }));
  }
  
  return unifiedMessage;
};

/**
 * Helper function to create a bug tracker issue from a Circle message
 * @param circleMessageId The ID of the Circle message to convert
 * @param submittedBy The name of the user submitting the issue
 */
export const createIssueFromCircleMessage = async (circleMessageId: string, submittedBy: string) => {
  try {
    // 1. Fetch the Circle message
    const { data: circleMessage, error: fetchError } = await supabase
      .from('circle_messages')
      .select('*')
      .eq('id', circleMessageId)
      .single();
      
    if (fetchError) {
      throw new Error(`Error fetching Circle message: ${fetchError.message}`);
    }
    
    if (!circleMessage) {
      throw new Error('Circle message not found');
    }
    
    // 2. Create an issue record
    const { data: issue, error: createError } = await supabase
      .from('issues')
      .insert({
        title: circleMessage.issue_title || circleMessage.title || 'Untitled Issue',
        description: `${circleMessage.body}\n\n*Imported from Circle*\n${circleMessage.message_url || ''}`,
        tags: ['circle', 'imported', circleMessage.type],
        segment: circleMessage.issue_type?.toLowerCase() || 'misc',
        status: 'in_progress',
        submitted_by: submittedBy,
        is_test: false // Mark as real data, not test
      })
      .select()
      .single();
      
    if (createError) {
      throw new Error(`Error creating issue: ${createError.message}`);
    }
    
    // 3. Update the Circle message with the mapped issue ID
    const { error: updateError } = await supabase
      .from('circle_messages')
      .update({ mapped_to_issue_id: issue.id })
      .eq('id', circleMessageId);
      
    if (updateError) {
      console.error('Error updating Circle message mapping:', updateError);
      // Continue despite error
    }
    
    // 4. Add an import log entry
    const { error: logError } = await supabase
      .from('issue_import_logs')
      .insert({
        circle_issue_id: circleMessageId,
        issue_id: issue.id,
        imported_by: submittedBy,
        import_source: 'manual',
        import_notes: 'Manually imported from admin panel',
        is_automatic: false
      });
      
    if (logError) {
      console.error('Error creating import log:', logError);
      // Continue despite error
    }
    
    toast.success('Issue created from Circle data');
    return issue.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error creating issue from Circle';
    toast.error(message);
    throw error;
  }
};

/**
 * Directly processes webhook data through Supabase
 * For when data is received directly and not via n8n
 * @param webhookData The raw webhook JSON data (single item or array)
 * @returns Processing results
 */
export const processWebhookData = async (webhookData: any): Promise<SyncResult> => {
  try {
    console.log('Processing webhook data directly');
    
    // Check if the data is an array - use our batch handler instead of RPC
    if (Array.isArray(webhookData)) {
      console.log(`Processing batch of ${webhookData.length} items sequentially`);
      const results: SyncResult = {
        processedCount: 0,
        importedIds: [],
        errors: []
      };
      
      // Process each item individually
      for (const item of webhookData) {
        try {
          // Process each item using process_circle_webhook
          const { data, error } = await supabase.rpc(
            'process_circle_webhook',
            { 
              p_payload: item,
              p_import_source: 'direct_api',
              p_imported_by: 'system'
            }
          );
          
          if (error) {
            console.error('Error processing item:', error);
            results.errors.push(`Error processing item: ${error.message}`);
            continue;
          }
          
          // Count as processed
          results.processedCount++;
          
          // Add to imported list if we have a circle_issue_id
          if (data && data.circle_issue_id) {
            results.importedIds.push(data.circle_issue_id);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          results.errors.push(`Exception: ${errorMessage}`);
        }
      }
      
      return results;
    }
    
    // Handle single item - use the handle_circle_webhook RPC
    const { data, error } = await supabase.rpc(
      'handle_circle_webhook',
      { request: webhookData }
    );
    
    if (error) {
      console.error('Error processing webhook data:', error);
      throw error;
    }
    
    console.log('Webhook processing result:', data);
    
    // Convert the result to our SyncResult type
    const result: SyncResult = {
      processedCount: parseInt(data.processed) || 0,
      importedIds: Array.isArray(data.imported) ? data.imported : [],
      errors: Array.isArray(data.errors) ? data.errors : []
    };
    
    if (result.importedIds.length > 0) {
      toast.success(`Successfully imported ${result.importedIds.length} messages`);
    } else {
      toast.warning('No messages were imported');
    }
    
    if (result.errors.length > 0) {
      toast.error(`${result.errors.length} errors occurred during import`);
    }
    
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error processing webhook data';
    console.error('Webhook processing error:', error);
    toast.error(message);
    throw error;
  }
}; 