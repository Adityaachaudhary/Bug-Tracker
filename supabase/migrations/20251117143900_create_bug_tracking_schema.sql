/*
  # Bug Tracking System Database Schema

  ## Overview
  This migration creates the complete database structure for a bug tracking system (Mini Jira clone).
  It includes tables for users, projects, tickets, and their relationships.

  ## New Tables

  ### 1. `profiles`
  Extends auth.users with additional user information
  - `id` (uuid, references auth.users)
  - `email` (text)
  - `full_name` (text)
  - `avatar_url` (text, optional)
  - `role` (text) - admin, manager, or developer
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `projects`
  Stores project information
  - `id` (uuid, primary key)
  - `name` (text)
  - `description` (text)
  - `owner_id` (uuid, references profiles)
  - `status` (text) - active, archived, or completed
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `project_members`
  Junction table for project team members
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `user_id` (uuid, references profiles)
  - `role` (text) - manager or member
  - `created_at` (timestamptz)

  ### 4. `tickets`
  Stores bug/task tickets
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `title` (text)
  - `description` (text)
  - `priority` (text) - low, medium, or high
  - `status` (text) - open, in_progress, resolved, or closed
  - `type` (text) - bug, feature, or task
  - `reporter_id` (uuid, references profiles)
  - `assignee_id` (uuid, references profiles, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `ticket_comments`
  Stores comments on tickets
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, references tickets)
  - `user_id` (uuid, references profiles)
  - `content` (text)
  - `created_at` (timestamptz)

  ## Security
  
  ### Row Level Security (RLS)
  All tables have RLS enabled with comprehensive policies:
  
  1. **profiles**: Users can read all profiles, update only their own
  2. **projects**: Users can read projects they're members of, admins/managers can create
  3. **project_members**: Users can read memberships for their projects
  4. **tickets**: Users can read/create tickets in their projects, update tickets assigned to them
  5. **ticket_comments**: Users can read comments on accessible tickets, create their own comments

  ## Indexes
  - Created indexes on foreign keys for better query performance
  - Created indexes on frequently queried fields (status, priority, assignee)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  role text NOT NULL DEFAULT 'developer' CHECK (role IN ('admin', 'manager', 'developer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('manager', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  type text NOT NULL DEFAULT 'bug' CHECK (type IN ('bug', 'feature', 'task')),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create ticket_comments table
CREATE TABLE IF NOT EXISTS ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_project ON tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_reporter ON tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for projects
CREATE POLICY "Users can view projects they are members of"
  ON projects FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Project owners and admins can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Project owners and admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for project_members
CREATE POLICY "Users can view project members for their projects"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = projects.id
          AND pm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project owners and managers can add members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = projects.id
          AND pm.user_id = auth.uid()
          AND pm.role = 'manager'
        )
      )
    )
  );

CREATE POLICY "Project owners and managers can remove members"
  ON project_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = projects.id
          AND pm.user_id = auth.uid()
          AND pm.role = 'manager'
        )
      )
    )
  );

-- RLS Policies for tickets
CREATE POLICY "Users can view tickets in their projects"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    ) AND reporter_id = auth.uid()
  );

CREATE POLICY "Ticket reporters, assignees, and project managers can update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    reporter_id = auth.uid() OR
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
          AND project_members.role = 'manager'
        )
      )
    )
  )
  WITH CHECK (
    reporter_id = auth.uid() OR
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
          AND project_members.role = 'manager'
        )
      )
    )
  );

CREATE POLICY "Project owners and managers can delete tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
          AND project_members.role = 'manager'
        )
      )
    )
  );

-- RLS Policies for ticket_comments
CREATE POLICY "Users can view comments on accessible tickets"
  ON ticket_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      JOIN projects ON projects.id = tickets.project_id
      WHERE tickets.id = ticket_comments.ticket_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create comments on accessible tickets"
  ON ticket_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      JOIN projects ON projects.id = tickets.project_id
      WHERE tickets.id = ticket_comments.ticket_id
      AND (
        projects.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    ) AND user_id = auth.uid()
  );

CREATE POLICY "Users can update own comments"
  ON ticket_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON ticket_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();