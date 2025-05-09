
export type Issue = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  segment: 'auth' | 'code' | 'other';
  status: 'pending' | 'in-progress' | 'blocked' | 'solved';
  submitted_by: string;
  assigned_to: string | null;
  ready_for_delivery: boolean;
  created_at: string;
  updated_at: string;
}

export type Comment = {
  id: string;
  issue_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export type NewIssue = Omit<Issue, 'id' | 'segment' | 'created_at' | 'updated_at' | 'ready_for_delivery'>;
export type NewComment = Omit<Comment, 'id' | 'created_at'>;
