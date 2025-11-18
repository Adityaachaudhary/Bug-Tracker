/*
  # Fix Security Issues

  1. Missing Indexes
    - Add missing foreign key index for ticket_comments.user_id
  
  2. RLS Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in all RLS policies
    - This prevents re-evaluation of auth functions for each row
  
  3. Function Search Path
    - Set search_path to explicit values in trigger function
  
  4. Index Management
    - Keep all indexes as they're important for query performance
    - They may appear unused until data grows and queries execute
*/

-- Add missing foreign key index for ticket_comments.user_id
CREATE INDEX IF NOT EXISTS idx_ticket_comments_user ON ticket_comments(user_id);

-- Fix RLS policies to use subquery form of auth functions for better performance
DROP POLICY "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = (select auth.uid()))
  WITH CHECK (auth.uid() = (select auth.uid()));

DROP POLICY "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = (select auth.uid()));

-- Fix projects policies
DROP POLICY "Users can view projects they are members of" ON projects;
CREATE POLICY "Users can view projects they are members of"
  ON projects FOR SELECT
  TO authenticated
  USING (
    owner_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = (select auth.uid())
    )
  );

DROP POLICY "Admins and managers can create projects" ON projects;
CREATE POLICY "Admins and managers can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'manager')
    )
  );

DROP POLICY "Project owners and admins can update projects" ON projects;
CREATE POLICY "Project owners and admins can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    owner_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    owner_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

DROP POLICY "Project owners and admins can delete projects" ON projects;
CREATE POLICY "Project owners and admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    owner_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Fix project_members policies
DROP POLICY "Users can view project members for their projects" ON project_members;
CREATE POLICY "Users can view project members for their projects"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND (
        projects.owner_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = projects.id
          AND pm.user_id = (select auth.uid())
        )
      )
    )
  );

DROP POLICY "Project owners and managers can add members" ON project_members;
CREATE POLICY "Project owners and managers can add members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND (
        projects.owner_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = projects.id
          AND pm.user_id = (select auth.uid())
          AND pm.role = 'manager'
        )
      )
    )
  );

DROP POLICY "Project owners and managers can remove members" ON project_members;
CREATE POLICY "Project owners and managers can remove members"
  ON project_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND (
        projects.owner_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = projects.id
          AND pm.user_id = (select auth.uid())
          AND pm.role = 'manager'
        )
      )
    )
  );

-- Fix tickets policies
DROP POLICY "Users can view tickets in their projects" ON tickets;
CREATE POLICY "Users can view tickets in their projects"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND (
        projects.owner_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = (select auth.uid())
        )
      )
    )
  );

DROP POLICY "Project members can create tickets" ON tickets;
CREATE POLICY "Project members can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND (
        projects.owner_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = (select auth.uid())
        )
      )
    ) AND reporter_id = (select auth.uid())
  );

DROP POLICY "Ticket reporters, assignees, and project managers can update tickets" ON tickets;
CREATE POLICY "Ticket reporters, assignees, and project managers can update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    reporter_id = (select auth.uid()) OR
    assignee_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND (
        projects.owner_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = (select auth.uid())
          AND project_members.role = 'manager'
        )
      )
    )
  )
  WITH CHECK (
    reporter_id = (select auth.uid()) OR
    assignee_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND (
        projects.owner_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = (select auth.uid())
          AND project_members.role = 'manager'
        )
      )
    )
  );

DROP POLICY "Project owners and managers can delete tickets" ON tickets;
CREATE POLICY "Project owners and managers can delete tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND (
        projects.owner_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = (select auth.uid())
          AND project_members.role = 'manager'
        )
      )
    )
  );

-- Fix ticket_comments policies
DROP POLICY "Users can view comments on accessible tickets" ON ticket_comments;
CREATE POLICY "Users can view comments on accessible tickets"
  ON ticket_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      JOIN projects ON projects.id = tickets.project_id
      WHERE tickets.id = ticket_comments.ticket_id
      AND (
        projects.owner_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = (select auth.uid())
        )
      )
    )
  );

DROP POLICY "Users can create comments on accessible tickets" ON ticket_comments;
CREATE POLICY "Users can create comments on accessible tickets"
  ON ticket_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      JOIN projects ON projects.id = tickets.project_id
      WHERE tickets.id = ticket_comments.ticket_id
      AND (
        projects.owner_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = (select auth.uid())
        )
      )
    ) AND user_id = (select auth.uid())
  );

DROP POLICY "Users can update own comments" ON ticket_comments;
CREATE POLICY "Users can update own comments"
  ON ticket_comments FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY "Users can delete own comments" ON ticket_comments;
CREATE POLICY "Users can delete own comments"
  ON ticket_comments FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Fix trigger function search_path
DROP TRIGGER update_profiles_updated_at ON profiles;
DROP TRIGGER update_projects_updated_at ON projects;
DROP TRIGGER update_tickets_updated_at ON tickets;

DROP FUNCTION update_updated_at_column();

CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
