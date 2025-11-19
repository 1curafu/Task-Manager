-- =====================================================
-- COMPLETE POLICY CLEANUP AND RECREATION
-- =====================================================
-- This removes ALL duplicate policies and recreates clean ones

-- =====================================================
-- 1. DROP ALL OLD POLICIES
-- =====================================================

-- Drop ALL Note policies
DROP POLICY IF EXISTS "Users can create notes" ON "Note";
DROP POLICY IF EXISTS "Users can delete their notes" ON "Note";
DROP POLICY IF EXISTS "Users can delete their own notes" ON "Note";
DROP POLICY IF EXISTS "Users can insert their own notes" ON "Note";
DROP POLICY IF EXISTS "Users can update their notes" ON "Note";
DROP POLICY IF EXISTS "Users can update their own notes" ON "Note";
DROP POLICY IF EXISTS "Users can view their notes" ON "Note";
DROP POLICY IF EXISTS "Users can view their own notes" ON "Note";

-- Drop ALL Notification policies
DROP POLICY IF EXISTS "Users can create notifications" ON "Notification";
DROP POLICY IF EXISTS "Users can delete own notifications" ON "Notification";
DROP POLICY IF EXISTS "Users can delete their notifications" ON "Notification";
DROP POLICY IF EXISTS "Users can insert own notifications" ON "Notification";
DROP POLICY IF EXISTS "Users can update own notifications" ON "Notification";
DROP POLICY IF EXISTS "Users can update their notifications" ON "Notification";
DROP POLICY IF EXISTS "Users can view own notifications" ON "Notification";
DROP POLICY IF EXISTS "Users can view their notifications" ON "Notification";

-- Drop ALL Task policies
DROP POLICY IF EXISTS "Users can create tasks" ON "Task";
DROP POLICY IF EXISTS "Users can delete own created tasks" ON "Task";
DROP POLICY IF EXISTS "Users can delete their tasks" ON "Task";
DROP POLICY IF EXISTS "Users can update accessible tasks" ON "Task";
DROP POLICY IF EXISTS "Users can update tasks" ON "Task";
DROP POLICY IF EXISTS "Users can view accessible tasks" ON "Task";

-- Drop ALL Team policies
DROP POLICY IF EXISTS "Owners can delete teams" ON "Team";
DROP POLICY IF EXISTS "Team owners can update teams" ON "Team";
DROP POLICY IF EXISTS "Users can create teams" ON "Team";
DROP POLICY IF EXISTS "Users can view teams they are members of" ON "Team";
DROP POLICY IF EXISTS "team_owner_all" ON "Team";

-- Drop ALL TeamMember policies
DROP POLICY IF EXISTS "Team members can update their membership" ON "TeamMember";
DROP POLICY IF EXISTS "Team owners and admins can invite members" ON "TeamMember";
DROP POLICY IF EXISTS "Team owners and admins can remove members" ON "TeamMember";
DROP POLICY IF EXISTS "Users can view team members" ON "TeamMember";
DROP POLICY IF EXISTS "teammember_delete" ON "TeamMember";
DROP POLICY IF EXISTS "teammember_insert" ON "TeamMember";
DROP POLICY IF EXISTS "teammember_select" ON "TeamMember";
DROP POLICY IF EXISTS "teammember_update" ON "TeamMember";

-- =====================================================
-- 2. CREATE CLEAN POLICIES (NO RECURSION)
-- =====================================================

-- NOTE POLICIES (Simple - no recursion possible)
CREATE POLICY "Users can view their notes" ON "Note"
  FOR SELECT
  USING (is_admin(auth.uid()) OR "userId" = auth.uid()::text);

CREATE POLICY "Users can create notes" ON "Note"
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()) OR "userId" = auth.uid()::text);

CREATE POLICY "Users can update their notes" ON "Note"
  FOR UPDATE
  USING (is_admin(auth.uid()) OR "userId" = auth.uid()::text);

CREATE POLICY "Users can delete their notes" ON "Note"
  FOR DELETE
  USING (is_admin(auth.uid()) OR "userId" = auth.uid()::text);

-- NOTIFICATION POLICIES (Simple - no recursion possible)
CREATE POLICY "Users can view their notifications" ON "Notification"
  FOR SELECT
  USING (is_admin(auth.uid()) OR "userId" = auth.uid()::text);

CREATE POLICY "Users can create notifications" ON "Notification"
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()) OR "userId" = auth.uid()::text);

CREATE POLICY "Users can update their notifications" ON "Notification"
  FOR UPDATE
  USING (is_admin(auth.uid()) OR "userId" = auth.uid()::text);

CREATE POLICY "Users can delete their notifications" ON "Notification"
  FOR DELETE
  USING (is_admin(auth.uid()) OR "userId" = auth.uid()::text);

-- TEAM POLICIES (NO TeamMember lookups to prevent recursion)
CREATE POLICY "Users can view teams they are members of" ON "Team"
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR "ownerId" = auth.uid()::text
  );

CREATE POLICY "Users can create teams" ON "Team"
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()) OR "ownerId" = auth.uid()::text);

CREATE POLICY "Team owners can update teams" ON "Team"
  FOR UPDATE
  USING (is_admin(auth.uid()) OR "ownerId" = auth.uid()::text);

CREATE POLICY "Owners can delete teams" ON "Team"
  FOR DELETE
  USING (is_admin(auth.uid()) OR "ownerId" = auth.uid()::text);

-- TEAMMEMBER POLICIES (NO self-reference, NO Team lookups that could recurse)
CREATE POLICY "Users can view team members" ON "TeamMember"
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR "userId" = auth.uid()::text
    OR "userEmail" IN (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Team owners and admins can invite members" ON "TeamMember"
  FOR INSERT
  WITH CHECK (
    is_admin(auth.uid())
    OR "teamId" IN (SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text)
  );

CREATE POLICY "Team members can update their membership" ON "TeamMember"
  FOR UPDATE
  USING (
    is_admin(auth.uid())
    OR "userId" = auth.uid()::text
    OR "userEmail" IN (SELECT email FROM auth.users WHERE id = auth.uid())
    OR "teamId" IN (SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text)
  );

CREATE POLICY "Team owners and admins can remove members" ON "TeamMember"
  FOR DELETE
  USING (
    is_admin(auth.uid())
    OR "userId" = auth.uid()::text
    OR "userEmail" IN (SELECT email FROM auth.users WHERE id = auth.uid())
    OR "teamId" IN (SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text)
  );

-- TASK POLICIES (NO TeamMember lookups to prevent recursion)
CREATE POLICY "Users can view accessible tasks" ON "Task"
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR "userId" = auth.uid()::text
    OR "assignedToId" = auth.uid()::text
    OR "createdById" = auth.uid()::text
    OR "teamId" IN (SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text)
  );

CREATE POLICY "Users can create tasks" ON "Task"
  FOR INSERT
  WITH CHECK (
    is_admin(auth.uid())
    OR "userId" = auth.uid()::text
    OR "createdById" = auth.uid()::text
    OR "teamId" IN (SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text)
  );

CREATE POLICY "Users can update accessible tasks" ON "Task"
  FOR UPDATE
  USING (
    is_admin(auth.uid())
    OR "userId" = auth.uid()::text
    OR "assignedToId" = auth.uid()::text
    OR "createdById" = auth.uid()::text
    OR "teamId" IN (SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text)
  );

CREATE POLICY "Users can delete their tasks" ON "Task"
  FOR DELETE
  USING (
    is_admin(auth.uid())
    OR "userId" = auth.uid()::text
    OR "createdById" = auth.uid()::text
    OR "teamId" IN (SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text)
  );
