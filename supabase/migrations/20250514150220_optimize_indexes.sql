-- Migration: 20250514150220_optimize_indexes.sql
-- Purpose: Create optimized indexes for common queries
-- This migration adds specialized indexes to improve performance for frontend operations

-- Create indexes for status-based filtering (one of the most common operations)
create index idx_issues_status_created_at on public.issues(status, created_at desc);
create index idx_issues_segment_status on public.issues(segment, status);

-- Create indexes to speed up issue retrieval by segment with proper ordering
create index idx_issues_segment_created_at on public.issues(segment, created_at desc);

-- Create composite index for dashboard queries that filter on multiple conditions
create index idx_issues_status_segment_created_at on public.issues(status, segment, created_at desc);

-- Create index for comment counting and retrieval
create index idx_comments_issue_id_created_at on public.comments(issue_id, created_at desc);

-- Create indexes for efficient resolved issue filtering
create index idx_issues_resolved_at on public.issues(resolved_at desc) where resolved_at is not null;

-- Create index for attachment retrieval
create index idx_issue_attachments_issue_id on public.issue_attachments(issue_id);

-- Create indexes for Circle.so integration queries
create index idx_circle_issues_space_name on public.circle_issues(space_name);
create index idx_circle_issues_is_thread on public.circle_issues(is_thread);
create index idx_circle_issues_is_triaged_created_at on public.circle_issues(is_triaged, created_at desc);

-- Create indexes for efficient status log retrieval
create index idx_issue_status_logs_issue_id_changed_at on public.issue_status_logs(issue_id, changed_at desc);

-- Create partial indexes for common filtered views
create index idx_issues_active on public.issues(created_at desc) 
where status != 'archived' and (archived_at is null);

create index idx_issues_waiting_for_help on public.issues(created_at desc) 
where status = 'waiting_for_help';

create index idx_issues_in_progress on public.issues(created_at desc) 
where status = 'in_progress';

create index idx_issues_blocked on public.issues(created_at desc) 
where status = 'blocked';

create index idx_issues_resolved on public.issues(resolved_at desc) 
where status = 'resolved';

-- Create efficient indexes for the sequential ID lookup (useful for #123 style searches)
create index idx_issues_seq_id on public.issues(seq_id);

-- Create text search support with GIN indexes
create index idx_issues_title_trgm on public.issues using gin (title gin_trgm_ops);
create index idx_issues_description_trgm on public.issues using gin (description gin_trgm_ops);

-- Enable pg_trgm extension if not already enabled (for fuzzy text search)
create extension if not exists pg_trgm; 