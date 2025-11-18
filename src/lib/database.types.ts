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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: 'admin' | 'manager' | 'developer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'developer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'developer'
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          status: 'active' | 'archived' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          status?: 'active' | 'archived' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          status?: 'active' | 'archived' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'manager' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: 'manager' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: 'manager' | 'member'
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          priority: 'low' | 'medium' | 'high'
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          type: 'bug' | 'feature' | 'task'
          reporter_id: string
          assignee_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          type?: 'bug' | 'feature' | 'task'
          reporter_id: string
          assignee_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          type?: 'bug' | 'feature' | 'task'
          reporter_id?: string
          assignee_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ticket_comments: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}
