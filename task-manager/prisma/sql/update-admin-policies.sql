-- =====================================================
-- UPDATE RLS POLICIES FOR ADMIN ACCESS
-- =====================================================
-- This file updates all RLS policies to grant admins full access
-- Run this in Supabase SQL Editor AFTER running create-admin-system.sql

-- =====================================================
-- TASK POLICIES
-- =====================================================

-- Drop and recreate Task SELECT policy with admin access
DROP POLICY IF EXISTS "Users can view accessible tasks" ON "Task";
CREATE POLICY "Users can view accessible tasks" ON "Task"
  FOR SELECT
  USING (
    is_admin(auth.uid())  -- Admins can see all tasks
    OR "userId" = auth.uid()::text
    OR "assignedToId" = auth.uid()::text
    OR "createdById" = auth.uid()::text
    OR "teamId" IN (
      SELECT "teamId" FROM "TeamMember"
      WHERE ("userId" = auth.uid()::text OR "userEmail" IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ))
      AND "status" = 'accepted'
    )
  );

-- Drop and recreate Task INSERT policy with admin access
DROP POLICY IF EXISTS "Users can create tasks" ON "Task";
CREATE POLICY "Users can create tasks" ON "Task"
  FOR INSERT
  WITH CHECK (
    is_admin(auth.uid())  -- Admins can create tasks for anyone
    OR "userId" = auth.uid()::text
    OR "createdById" = auth.uid()::text
    OR ("teamId" IN (
      SELECT "teamId" FROM "TeamMember"
      WHERE ("userId" = auth.uid()::text OR "userEmail" IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ))
      AND "status" = 'accepted'
      AND "role" IN ('owner', 'admin')
    ))
  );

-- Drop and recreate Task UPDATE policy with admin access
DROP POLICY IF EXISTS "Users can update accessible tasks" ON "Task";
CREATE POLICY "Users can update accessible tasks" ON "Task"
  FOR UPDATE
  USING (
    is_admin(auth.uid())  -- Admins can update all tasks
    OR "userId" = auth.uid()::text
    OR "assignedToId" = auth.uid()::text
    OR "createdById" = auth.uid()::text
    OR "teamId" IN (
      SELECT "teamId" FROM "TeamMember"
      WHERE ("userId" = auth.uid()::text OR "userEmail" IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ))
      AND "status" = 'accepted'
      AND "role" IN ('owner', 'admin')
    )
  );

-- Drop and recreate Task DELETE policy with admin access
DROP POLICY IF EXISTS "Users can delete their tasks" ON "Task";
CREATE POLICY "Users can delete their tasks" ON "Task"
  FOR DELETE
  USING (
    is_admin(auth.uid())  -- Admins can delete all tasks
    OR "userId" = auth.uid()::text
    OR "createdById" = auth.uid()::text
    OR "teamId" IN (
      SELECT "teamId" FROM "TeamMember"
      WHERE ("userId" = auth.uid()::text OR "userEmail" IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ))
      AND "status" = 'accepted'
      AND "role" IN ('owner', 'admin')
    )
  );

-- =====================================================
-- NOTE POLICIES
-- =====================================================

-- Drop and recreate Note SELECT policy with admin access
DROP POLICY IF EXISTS "Users can view their notes" ON "Note";
CREATE POLICY "Users can view their notes" ON "Note"
  FOR SELECT
  USING (
    is_admin(auth.uid())  -- Admins can see all notes
    OR "userId" = auth.uid()::text
  );

-- Drop and recreate Note INSERT policy with admin access
DROP POLICY IF EXISTS "Users can create notes" ON "Note";
CREATE POLICY "Users can create notes" ON "Note"
  FOR INSERT
  WITH CHECK (
    is_admin(auth.uid())  -- Admins can create notes for anyone
    OR "userId" = auth.uid()::text
  );

-- Drop and recreate Note UPDATE policy with admin access
DROP POLICY IF EXISTS "Users can update their notes" ON "Note";
CREATE POLICY "Users can update their notes" ON "Note"
  FOR UPDATE
  USING (
    is_admin(auth.uid())  -- Admins can update all notes
    OR "userId" = auth.uid()::text
  );

-- Drop and recreate Note DELETE policy with admin access
DROP POLICY IF EXISTS "Users can delete their notes" ON "Note";
CREATE POLICY "Users can delete their notes" ON "Note"
  FOR DELETE
  USING (
    is_admin(auth.uid())  -- Admins can delete all notes
    OR "userId" = auth.uid()::text
  );

-- =====================================================
-- NOTIFICATION POLICIES
-- =====================================================

-- Drop and recreate Notification SELECT policy with admin access
DROP POLICY IF EXISTS "Users can view their notifications" ON "Notification";
CREATE POLICY "Users can view their notifications" ON "Notification"
  FOR SELECT
  USING (
    is_admin(auth.uid())  -- Admins can see all notifications
    OR "userId" = auth.uid()::text
  );

-- Drop and recreate Notification INSERT policy with admin access
DROP POLICY IF EXISTS "Users can create notifications" ON "Notification";
CREATE POLICY "Users can create notifications" ON "Notification"
  FOR INSERT
  WITH CHECK (
    is_admin(auth.uid())  -- Admins can create notifications for anyone
    OR "userId" = auth.uid()::text
  );

-- Drop and recreate Notification UPDATE policy with admin access
DROP POLICY IF EXISTS "Users can update their notifications" ON "Notification";
CREATE POLICY "Users can update their notifications" ON "Notification"
  FOR UPDATE
  USING (
    is_admin(auth.uid())  -- Admins can update all notifications
    OR "userId" = auth.uid()::text
  );

-- Drop and recreate Notification DELETE policy with admin access
DROP POLICY IF EXISTS "Users can delete their notifications" ON "Notification";
CREATE POLICY "Users can delete their notifications" ON "Notification"
  FOR DELETE
  USING (
    is_admin(auth.uid())  -- Admins can delete all notifications
    OR "userId" = auth.uid()::text
  );

-- =====================================================
-- TEAM POLICIES
-- =====================================================

-- Drop and recreate Team SELECT policy with admin access
DROP POLICY IF EXISTS "Users can view teams they are members of" ON "Team";
CREATE POLICY "Users can view teams they are members of" ON "Team"
  FOR SELECT
  USING (
    is_admin(auth.uid())  -- Admins can see all teams
    OR "ownerId" = auth.uid()::text
    OR id IN (
      SELECT "teamId" FROM "TeamMember"
      WHERE ("userId" = auth.uid()::text OR "userEmail" IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ))
      AND "status" = 'accepted'
    )
  );

-- Drop and recreate Team INSERT policy with admin access
DROP POLICY IF EXISTS "Users can create teams" ON "Team";
CREATE POLICY "Users can create teams" ON "Team"
  FOR INSERT
  WITH CHECK (
    is_admin(auth.uid())  -- Admins can create teams for anyone
    OR "ownerId" = auth.uid()::text
  );

-- Drop and recreate Team UPDATE policy with admin access
DROP POLICY IF EXISTS "Team owners can update teams" ON "Team";
CREATE POLICY "Team owners can update teams" ON "Team"
  FOR UPDATE
  USING (
    is_admin(auth.uid())  -- Admins can update all teams
    OR "ownerId" = auth.uid()::text
  );

-- Drop and recreate Team DELETE policy with admin access
DROP POLICY IF EXISTS "Owners can delete teams" ON "Team";
CREATE POLICY "Owners can delete teams" ON "Team"
  FOR DELETE
  USING (
    is_admin(auth.uid())  -- Admins can delete all teams
    OR "ownerId" = auth.uid()::text
  );

-- =====================================================
-- TEAM MEMBER POLICIES
-- =====================================================

-- Drop and recreate TeamMember SELECT policy with admin access
DROP POLICY IF EXISTS "Users can view team members" ON "TeamMember";
CREATE POLICY "Users can view team members" ON "TeamMember"
  FOR SELECT
  USING (
    is_admin(auth.uid())  -- Admins can see all team members
    OR "userId" = auth.uid()::text
    OR "userEmail" IN (SELECT email FROM auth.users WHERE id = auth.uid())
    OR "teamId" IN (
      SELECT "teamId" FROM "TeamMember"
      WHERE ("userId" = auth.uid()::text OR "userEmail" IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ))
      AND "status" = 'accepted'
    )
  );

-- Drop and recreate TeamMember INSERT policy with admin access
DROP POLICY IF EXISTS "Team owners and admins can invite members" ON "TeamMember";
CREATE POLICY "Team owners and admins can invite members" ON "TeamMember"
  FOR INSERT
  WITH CHECK (
    is_admin(auth.uid())  -- Admins can invite anyone to any team
    OR "teamId" IN (
      SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text
    )
    OR "teamId" IN (
      SELECT "teamId" FROM "TeamMember"
      WHERE ("userId" = auth.uid()::text OR "userEmail" IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ))
      AND "status" = 'accepted'
      AND "role" IN ('owner', 'admin')
    )
  );

-- Drop and recreate TeamMember UPDATE policy with admin access
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
    OR "teamId" IN (
      SELECT "teamId" FROM "TeamMember"
      WHERE ("userId" = auth.uid()::text OR "userEmail" IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ))
      AND "status" = 'accepted'
      AND "role" IN ('owner', 'admin')
    )
  );

-- Drop and recreate TeamMember DELETE policy with admin access
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
    OR "teamId" IN (
      SELECT "teamId" FROM "TeamMember"
      WHERE ("userId" = auth.uid()::text OR "userEmail" IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ))
      AND "status" = 'accepted'
      AND "role" IN ('owner', 'admin')
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify all policies include admin access:
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
