export type Issue = {
  id: string;
  seq_id?: number; // Sequential global ID
  title: string;
  description: string;
  tags: string[];
  segment: 'auth' | 'code' | 'tool' | 'misc';
  status: 'waiting_for_help' | 'in_progress' | 'resolved' | 'blocked' | 'archived';
  submitted_by: string;
  assigned_to: string | null;
  ready_for_delivery: boolean;
  created_at: string;
  updated_at: string;
  resolved_by?: string;
  resolved_at?: string;
  archived_at?: string;
  affected_user_name?: string;
  affected_user_email?: string;
}

export type Comment = {
  id: string;
  issue_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export type NewIssue = {
  title: string;
  description: string;
  tags: string[];
  segment: 'auth' | 'code' | 'tool' | 'misc';
  status: string;
  submitted_by: string;
  assigned_to: string | null;
  affected_user_name?: string;
  affected_user_email?: string;
}

export type NewComment = Omit<Comment, 'id' | 'created_at'>;
