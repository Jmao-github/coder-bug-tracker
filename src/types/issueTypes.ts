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
  is_test?: boolean; // Flag to identify test issues that can be safely deleted
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
  is_test?: boolean; // Flag to identify test issues for easy deletion
}

export type NewComment = Omit<Comment, 'id' | 'created_at'>;

interface CircleMessageMapping {
  // Source fields → Bug tracker fields
  id: string;                   // UUID for the bug tracker issue
  title: string;                // From message.content.issue_title
  type: 'Auth/Login' | 'Code Generation' | 'Tool' | 'Other'; // Normalized from message.content.type
  description: string;          // From body or parent_body (with formatted replies)
  chatRoomName: string;         // Looked up via chat_room_uuid from circle_spaces table
  authorName: string;           // From sender.name or parent_sender
  createdAt: string;            // From created_at or parent_created_at
  status: string;               // Default to 'waiting_for_help' for new imports
  repliesCount: number;         // From replies_count
  segment: 'auth' | 'code' | 'tool' | 'misc'; // Derived from type mapping:
                                // 'Auth/Login' → 'auth'
                                // 'Code Generation' → 'code'
                                // 'Tool' → 'tool'
                                // 'Other' → 'misc'
}

// Order issue cards by descending created_at timestamp
const sortedIssues = issues.sort((a, b) => 
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);
