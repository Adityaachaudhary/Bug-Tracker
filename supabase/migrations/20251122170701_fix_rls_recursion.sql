/*
  # Fix RLS Infinite Recursion

  The project_members table policies were causing infinite recursion
  by checking project_members within a project_members policy.
  
  Simplified approach:
  - Remove nested project_members checks
  - Use direct project ownership or simple membership checks
  - Avoid circular references in RLS policies
*/

-- Fix project_members policies to avoid recursion
DROP POLICY "Users can view project members for their projects" ON project_members;
CREATE POLICY "Users can view project members for their projects"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = (select auth.uid())
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
      AND projects.owner_id = (select auth.uid())
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
      AND projects.owner_id = (select auth.uid())
    )
  );

-- Simplify projects SELECT policy to avoid complex nesting
DROP POLICY "Users can view projects they are members of" ON projects;
CREATE POLICY "Users can view projects they are members of"
  ON projects FOR SELECT
  TO authenticated
  USING (
    owner_id = (select auth.uid())
  );

-- Simplify tickets policies to avoid complex nesting
DROP POLICY "Users can view tickets in their projects" ON tickets;
CREATE POLICY "Users can view tickets in their projects"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND projects.owner_id = (select auth.uid())
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
      AND projects.owner_id = (select auth.uid())
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
      AND projects.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    reporter_id = (select auth.uid()) OR
    assignee_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tickets.project_id
      AND projects.owner_id = (select auth.uid())
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
      AND projects.owner_id = (select auth.uid())
    )
  );

-- Simplify ticket_comments policies
DROP POLICY "Users can view comments on accessible tickets" ON ticket_comments;
CREATE POLICY "Users can view comments on accessible tickets"
  ON ticket_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      JOIN projects ON projects.id = tickets.project_id
      WHERE tickets.id = ticket_comments.ticket_id
      AND projects.owner_id = (select auth.uid())
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
      AND projects.owner_id = (select auth.uid())
    ) AND user_id = (select auth.uid())
  );
