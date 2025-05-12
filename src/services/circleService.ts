import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * CircleIssue represents an issue from Circle that can be imported into the bug tracker
 */
export type CircleIssue = {
  id?: string;
  message_id: string;
  thread_id?: string;
  title: string;
  body: string;
  author_name: string; 
  author_email?: string;
  space_name?: string;
  space_id?: string;
  link?: string;
  is_thread?: boolean;
  is_triaged?: boolean;
  triage_confidence?: number;
  mapped_to_issue_id?: string;
  raw_data?: Record<string, unknown>;
  created_at?: string;
  imported_at?: string;
  last_updated_at?: string;
};

/**
 * Fetches issues imported from Circle
 */
export const fetchCircleIssues = async (limit = 50, includeRawData = false) => {
  try {
    let query = supabase
      .from('circle_issues')
      .select(includeRawData ? '*' : '*, raw_data')
      .order('imported_at', { ascending: false })
      .limit(limit);
      
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching Circle issues:', error);
      toast.error('Failed to load Circle issues');
      throw error;
    }
    
    return data as CircleIssue[];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error fetching Circle issues';
    toast.error(message);
    throw error;
  }
};

/**
 * Imports a Circle issue into the system
 * @param circleIssue The Circle issue to import
 * @returns The ID of the imported Circle issue
 */
export const importCircleIssue = async (circleIssue: CircleIssue) => {
  try {
    // 1. Insert the Circle issue record
    const { data, error } = await supabase.rpc(
      'upsert_circle_issue',
      {
        p_message_id: circleIssue.message_id,
        p_thread_id: circleIssue.thread_id || null,
        p_title: circleIssue.title,
        p_body: circleIssue.body,
        p_author_name: circleIssue.author_name,
        p_author_email: circleIssue.author_email || null,
        p_space_name: circleIssue.space_name || null,
        p_space_id: circleIssue.space_id || null,
        p_link: circleIssue.link || null,
        p_is_thread: circleIssue.is_thread || false,
        p_is_triaged: circleIssue.is_triaged || false,
        p_triage_confidence: circleIssue.triage_confidence || 0,
        p_raw_data: circleIssue.raw_data || null
      }
    );
    
    if (error) {
      console.error('Error importing Circle issue:', error);
      toast.error(`Failed to import Circle issue: ${error.message}`);
      throw error;
    }
    
    toast.success('Circle issue imported successfully');
    return data as string;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error importing Circle issue';
    toast.error(message);
    throw error;
  }
};

/**
 * Helper function to create a bug tracker issue from a Circle issue
 * This is used to test the import process
 * @param circleIssueId The ID of the Circle issue to convert
 * @param submittedBy The name of the user submitting the issue
 */
export const createIssueFromCircle = async (circleIssueId: string, submittedBy: string) => {
  try {
    // 1. Fetch the Circle issue
    const { data: circleIssue, error: fetchError } = await supabase
      .from('circle_issues')
      .select('*')
      .eq('id', circleIssueId)
      .single();
      
    if (fetchError) {
      throw new Error(`Error fetching Circle issue: ${fetchError.message}`);
    }
    
    if (!circleIssue) {
      throw new Error('Circle issue not found');
    }
    
    // 2. Create an issue record
    const { data: issue, error: createError } = await supabase
      .from('issues')
      .insert({
        title: circleIssue.title,
        description: `${circleIssue.body}\n\n*Imported from Circle*\n${circleIssue.link || ''}`,
        tags: ['circle', 'imported'],
        segment: determineSegment(circleIssue.title, circleIssue.body),
        status: 'in_progress',
        submitted_by: submittedBy,
        is_test: false // Mark as real data, not test
      })
      .select()
      .single();
      
    if (createError) {
      throw new Error(`Error creating issue: ${createError.message}`);
    }
    
    // 3. Update the Circle issue with the mapped issue ID
    const { error: updateError } = await supabase
      .from('circle_issues')
      .update({ mapped_to_issue_id: issue.id })
      .eq('id', circleIssueId);
      
    if (updateError) {
      console.error('Error updating Circle issue mapping:', updateError);
      // Continue despite error
    }
    
    // 4. Add an import log entry
    const { error: logError } = await supabase
      .from('issue_import_logs')
      .insert({
        circle_issue_id: circleIssueId,
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
 * Helper function to determine the likely segment for an issue based on title and body
 */
const determineSegment = (title: string, body: string): 'auth' | 'code' | 'tool' | 'misc' => {
  const fullText = `${title} ${body}`.toLowerCase();
  
  // Check for auth-related keywords
  if (
    fullText.includes('login') || 
    fullText.includes('auth') || 
    fullText.includes('password') || 
    fullText.includes('sign in') || 
    fullText.includes('signin') ||
    fullText.includes('account')
  ) {
    return 'auth';
  }
  
  // Check for code-related keywords
  if (
    fullText.includes('error') || 
    fullText.includes('bug') || 
    fullText.includes('exception') || 
    fullText.includes('crash') || 
    fullText.includes('function') ||
    fullText.includes('method') ||
    fullText.includes('class') ||
    fullText.includes('component')
  ) {
    return 'code';
  }
  
  // Check for tool-related keywords
  if (
    fullText.includes('tool') || 
    fullText.includes('cli') || 
    fullText.includes('command') || 
    fullText.includes('script') || 
    fullText.includes('automation') ||
    fullText.includes('workflow')
  ) {
    return 'tool';
  }
  
  // Default to misc
  return 'misc';
}; 