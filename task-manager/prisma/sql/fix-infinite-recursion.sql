-- =====================================================
-- FIX INFINITE RECURSION IN TEAMMEMBER POLICIES
-- =====================================================
-- This fixes the circular reference in TeamMember SELECT policy

-- Drop and recreate TeamMember SELECT policy WITHOUT recursive lookup
DROP POLICY IF EXISTS "Users can view team members" ON "TeamMember";
CREATE POLICY "Users can view team members" ON "TeamMember"
  FOR SELECT
  USING (
    is_admin(auth.uid())  -- Admins can see all team members
    OR "userId" = auth.uid()::text
    OR "userEmail" IN (SELECT email FROM auth.users WHERE id = auth.uid())
    OR "teamId" IN (
      SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text
    )
  );

-- Fix TeamMember UPDATE policy - remove self-referencing lookup
DROP POLICY IF EXISTS "Team members can update their membership" ON "TeamMember";
CREATE POLICY "Team members can update their membership" ON "TeamMember"
  FOR UPDATE
  USING (
    is_admin(auth.uid())  -- Admins can update all team memberships
    OR "userId" = auth.uid()::text
    OR "userEmail" IN (SELECT email FROM auth.users WHERE id = auth.uid())
    OR "teamId" IN (
      SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text
    )
  );

-- Fix TeamMember DELETE policy - remove self-referencing lookup
DROP POLICY IF EXISTS "Team owners and admins can remove members" ON "TeamMember";
CREATE POLICY "Team owners and admins can remove members" ON "TeamMember"
  FOR DELETE
  USING (
    is_admin(auth.uid())  -- Admins can remove any team member
    OR "userId" = auth.uid()::text
    OR "userEmail" IN (SELECT email FROM auth.users WHERE id = auth.uid())
    OR "teamId" IN (
      SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text
    )
  );

-- Fix TeamMember INSERT policy - simplify to avoid recursion
DROP POLICY IF EXISTS "Team owners and admins can invite members" ON "TeamMember";
CREATE POLICY "Team owners and admins can invite members" ON "TeamMember"
  FOR INSERT
  WITH CHECK (
    is_admin(auth.uid())  -- Admins can invite anyone to any team
    OR "teamId" IN (
      SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text
    )
  );

-- =====================================================
-- FIX TASK POLICIES - REMOVE TEAMMEMBER RECURSION
-- =====================================================

-- Fix Task SELECT policy - remove TeamMember lookup to prevent recursion
DROP POLICY IF EXISTS "Users can view accessible tasks" ON "Task";
CREATE POLICY "Users can view accessible tasks" ON "Task"
  FOR SELECT
  USING (
    is_admin(auth.uid())  -- Admins can see all tasks
    OR "userId" = auth.uid()::text
    OR "assignedToId" = auth.uid()::text
    OR "createdById" = auth.uid()::text
    OR "teamId" IN (
      SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text
    )
  );

-- Fix Task INSERT policy
DROP POLICY IF EXISTS "Users can create tasks" ON "Task";
CREATE POLICY "Users can create tasks" ON "Task"
  FOR INSERT
  WITH CHECK (
    is_admin(auth.uid())  -- Admins can create tasks for anyone
    OR "userId" = auth.uid()::text
    OR "createdById" = auth.uid()::text
    OR "teamId" IN (
      SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text
    )
  );

-- Fix Task UPDATE policy
DROP POLICY IF EXISTS "Users can update accessible tasks" ON "Task";
CREATE POLICY "Users can update accessible tasks" ON "Task"
  FOR UPDATE
  USING (
    is_admin(auth.uid())  -- Admins can update all tasks
    OR "userId" = auth.uid()::text
    OR "assignedToId" = auth.uid()::text
    OR "createdById" = auth.uid()::text
    OR "teamId" IN (
      SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text
    )
  );

-- Fix Task DELETE policy
DROP POLICY IF EXISTS "Users can delete their tasks" ON "Task";
CREATE POLICY "Users can delete their tasks" ON "Task"
  FOR DELETE
  USING (
    is_admin(auth.uid())  -- Admins can delete all tasks
    OR "userId" = auth.uid()::text
    OR "createdById" = auth.uid()::text
    OR "teamId" IN (
      SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text
    )
  );
