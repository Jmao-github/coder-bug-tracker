
import { supabase } from "@/integrations/supabase/client";
import { Issue, NewIssue, Comment, NewComment } from "@/types/issueTypes";
import { toast } from "sonner";

// Issues
export const fetchIssues = async () => {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    toast.error('Failed to load issues');
    throw error;
  }
  
  return data as Issue[];
};

export const fetchIssuesBySegment = async (segment: string) => {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('segment', segment)
    .order('created_at', { ascending: false });
    
  if (error) {
    toast.error(`Failed to load ${segment} issues`);
    throw error;
  }
  
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
  const { data, error } = await supabase
    .from('issues')
    .insert(issue)
    .select()
    .single();
    
  if (error) {
    toast.error('Failed to create issue');
    throw error;
  }
  
  toast.success('Issue created successfully');
  return data as Issue;
};

export const updateIssueStatus = async (id: string, status: string) => {
  const { data, error } = await supabase
    .from('issues')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    toast.error('Failed to update issue status');
    throw error;
  }
  
  toast.success(`Issue status updated to ${status}`);
  return data as Issue;
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
