import { createClient } from '@supabase/supabase-js';

export interface CircleIssueRow {
  id: string;
  message_id: string;
  thread_id: string | null;
  title: string;
  body: string;
  author_name: string;
  author_email: string | null;
  space_name: string | null;
  space_id: string | null;
  link: string | null;
  is_thread: boolean;
  is_triaged: boolean;
  triage_confidence: number;
  raw_data: any | null;
  mapped_to_issue_id: string | null;
  created_at: string;
  imported_at: string;
  last_updated_at: string | null;
}

export interface IssueImportLogRow {
  id: string;
  circle_issue_id: string;
  issue_id: string;
  imported_by: string;
  import_source: string;
  import_notes: string | null;
  is_automatic: boolean;
  imported_at: string;
}

export interface CircleSpaceRow {
  id: number;
  space_id: number;
  space_name: string;
  chat_room_uuid: string;
  space_member_id: number | null;
  created_at: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      circle_issues: {
        Row: CircleIssueRow;
        Insert: Omit<CircleIssueRow, 'id' | 'created_at' | 'imported_at' | 'last_updated_at'> & {
          id?: string;
          created_at?: string;
          imported_at?: string;
          last_updated_at?: string;
        };
        Update: Partial<Omit<CircleIssueRow, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: "circle_issues_mapped_to_issue_id_fkey";
            columns: ["mapped_to_issue_id"];
            referencedRelation: "issues";
            referencedColumns: ["id"];
          }
        ];
      };
      issue_import_logs: {
        Row: IssueImportLogRow;
        Insert: Omit<IssueImportLogRow, 'id' | 'imported_at'> & {
          id?: string;
          imported_at?: string;
        };
        Update: Partial<Omit<IssueImportLogRow, 'id' | 'imported_at'>>;
        Relationships: [
          {
            foreignKeyName: "issue_import_logs_circle_issue_id_fkey";
            columns: ["circle_issue_id"];
            referencedRelation: "circle_issues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "issue_import_logs_issue_id_fkey";
            columns: ["issue_id"];
            referencedRelation: "issues";
            referencedColumns: ["id"];
          }
        ];
      };
      circle_spaces: {
        Row: CircleSpaceRow;
        Insert: Omit<CircleSpaceRow, 'id' | 'created_at'> & {
          id?: number;
          created_at?: string;
        };
        Update: Partial<Omit<CircleSpaceRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      // Include existing tables but with just basic type info to prevent conflicts
      issues: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      comments: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      issue_status_logs: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      issue_tags: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
      tags: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
    };
    Functions: {
      upsert_circle_issue: {
        Args: {
          p_message_id: string;
          p_thread_id: string | null;
          p_title: string;
          p_body: string;
          p_author_name: string;
          p_author_email: string | null;
          p_space_name: string | null;
          p_space_id: string | null;
          p_link: string | null;
          p_is_thread: boolean;
          p_is_triaged: boolean;
          p_triage_confidence: number;
          p_raw_data: any | null;
        };
        Returns: string;
      };
      determine_segment: {
        Args: {
          title: string;
          body: string;
        };
        Returns: 'auth' | 'code' | 'tool' | 'misc';
      };
    };
    Views: {
      issue_activity_log: {
        Row: Record<string, any>;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
}

export const Constants = {
  public: {
    Enums: {},
  },
} as const
