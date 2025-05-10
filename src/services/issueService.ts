import { supabase } from "@/integrations/supabase/client";
import { Issue, NewIssue, Comment, NewComment } from "@/types/issueTypes";
import { toast } from "sonner";

// Define the restricted status type
type IssueStatus = 'waiting_for_help' | 'in_progress' | 'resolved' | 'blocked' | 'archived';

// Issues
export const fetchIssues = async () => {
  // Simple fetch of all issues
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching issues from Supabase:', error);
    toast.error('Failed to load issues');
    throw error;
  }

  // Return empty array if data is null
  return (data || []) as Issue[];
};

export const fetchIssuesBySegment = async (segment: string) => {
  console.log(`Fetching issues for segment: "${segment}"`);
  
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('segment', segment)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error(`Failed to load ${segment} issues:`, error);
    toast.error(`Failed to load ${segment} issues`);
    throw error;
  }
  
  console.log(`Found ${data?.length || 0} issues for segment "${segment}"`);
  return data as Issue[];
};

export const fetchIssuesByStatus = async (status: string) => {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });
    
  if (error) {
    toast.error(`Failed to load ${status} issues`);
    throw error;
  }
  
  return data as Issue[];
};

export const createIssue = async (issue: NewIssue) => {
  try {
    // Validate required fields
    if (!issue.title || !issue.title.trim()) {
      throw new Error('Issue title is required');
    }
    
    if (!issue.description || !issue.description.trim()) {
      throw new Error('Issue description is required');
    }
    
    if (!issue.segment) {
      throw new Error('Issue category is required');
    }
    
    if (!issue.submitted_by) {
      throw new Error('Issue submitter information is missing');
    }
    
    // Make the Supabase API call
    const { data, error } = await supabase
      .from('issues')
      .insert(issue)
      .select()
      .single();
      
    if (error) {
      console.error('Supabase error creating issue:', error);
      toast.error(`Failed to create issue: ${error.message || 'Database error'}`);
      throw new Error(`Failed to create issue: ${error.message || 'Database error'}`);
    }
    
    if (!data) {
      toast.error('Issue was created but no data was returned');
      throw new Error('Issue was created but no data was returned');
    }
    
    toast.success('Issue created successfully');
    return data as Issue;
  } catch (error) {
    // Handle any other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error creating issue';
    console.error('Error in createIssue:', errorMessage);
    toast.error(errorMessage);
    throw error;
  }
};

export const updateIssueStatus = async (
  id: string, 
  status: IssueStatus, 
  resolvedBy?: string
) => {
  try {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    // If the issue is being resolved, record who resolved it and when
    if (status === 'resolved' && resolvedBy) {
      updateData.resolved_by = resolvedBy;
      updateData.resolved_at = new Date().toISOString();
    } else if (status !== 'resolved') {
      // Clear resolved information if changing to a non-resolved status
      updateData.resolved_by = null;
      updateData.resolved_at = null;
    }
    
    console.log('Updating issue status with data:', updateData);
    
    const { error } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating issue status:', error);
      toast.error(`Failed to update status: ${error.message}`);
      throw new Error(`Failed to update issue status: ${error.message}`);
    }
    
    toast.success(`Issue status updated to ${status}`);
    return true;
  } catch (error) {
    console.error('Error in updateIssueStatus:', error);
    toast.error('Failed to update issue status');
    throw error;
  }
};

export const updateReadyForDelivery = async (id: string, ready: boolean) => {
  const { data, error } = await supabase
    .from('issues')
    .update({ ready_for_delivery: ready })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    toast.error('Failed to update delivery status');
    throw error;
  }
  
  toast.success(`Issue marked ${ready ? 'ready' : 'not ready'} for delivery`);
  return data as Issue;
};

// Comments
export const fetchComments = async (issueId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: true });
    
  if (error) {
    toast.error('Failed to load comments');
    throw error;
  }
  
  return data as Comment[];
};

export const addComment = async (comment: NewComment) => {
  const { data, error } = await supabase
    .from('comments')
    .insert(comment)
    .select()
    .single();
    
  if (error) {
    toast.error('Failed to add comment');
    throw error;
  }
  
  toast.success('Comment added successfully');
  return data as Comment;
};

// Direct count function that can be used as a fallback
export const fetchIssueCountsBySegment = async () => {
  console.log('Fetching direct issue counts by segment');
  
  try {
    // Get counts for each segment directly from Supabase
    const authCountQuery = await supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('segment', 'auth');
    
    const codeCountQuery = await supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('segment', 'code');
    
    const toolCountQuery = await supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('segment', 'tool');
    
    const miscCountQuery = await supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('segment', 'misc');
    
    // Check for errors
    if (authCountQuery.error || codeCountQuery.error || toolCountQuery.error || miscCountQuery.error) {
      console.error('Error fetching issue counts:', 
        authCountQuery.error || codeCountQuery.error || toolCountQuery.error || miscCountQuery.error);
      throw new Error('Failed to fetch issue counts');
    }
    
    // Extract the counts
    const counts = {
      auth: authCountQuery.count || 0,
      code: codeCountQuery.count || 0,
      tool: toolCountQuery.count || 0,
      misc: miscCountQuery.count || 0
    };
    
    const total = counts.auth + counts.code + counts.tool + counts.misc;
    console.log(`Direct count query successful. Total: ${total}, by segment: auth=${counts.auth}, code=${counts.code}, tool=${counts.tool}, misc=${counts.misc}`);
    
    return counts;
  } catch (error) {
    console.error('Error in fetchIssueCountsBySegment:', error);
    return { auth: 0, code: 0, tool: 0, misc: 0 };
  }
};

// Fetch counts directly by status for reliable metrics
export const fetchIssueCountsByStatus = async () => {
  console.log('Fetching direct issue counts by status');
  
  try {
    // Get counts for each status directly from Supabase
    const inProgressCountQuery = await supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress');
    
    const waitingForHelpCountQuery = await supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'waiting_for_help');
    
    const blockedCountQuery = await supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'blocked');
    
    const resolvedCountQuery = await supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'resolved');
    
    const archivedCountQuery = await supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'archived');
    
    // Check for errors in any of the queries
    const errors = [
      inProgressCountQuery.error,
      waitingForHelpCountQuery.error,
      blockedCountQuery.error,
      resolvedCountQuery.error,
      archivedCountQuery.error
    ].filter(Boolean);
    
    if (errors.length > 0) {
      console.error('Error fetching status counts:', errors[0]);
      throw new Error('Failed to fetch status counts');
    }
    
    // Extract the counts
    const counts = {
      in_progress: inProgressCountQuery.count || 0,
      waiting_for_help: waitingForHelpCountQuery.count || 0,
      blocked: blockedCountQuery.count || 0,
      resolved: resolvedCountQuery.count || 0,
      archived: archivedCountQuery.count || 0
    };
    
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`Direct status count query successful. Total: ${total}, by status:`, counts);
    
    return counts;
  } catch (error) {
    console.error('Error in fetchIssueCountsByStatus:', error);
    return {
      in_progress: 0,
      waiting_for_help: 0,
      blocked: 0,
      resolved: 0,
      archived: 0
    };
  }
};
