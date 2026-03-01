-- =====================================================
-- COMPLETE DATABASE SETUP FOR TASK MANAGER
-- =====================================================
-- Run this entire script in Supabase SQL Editor
-- This will set up all tables, RLS policies, storage, and admin functions
-- 
-- Author: Task Manager Team
-- Last Updated: November 2025
-- =====================================================

-- =====================================================
-- STEP 1: ENABLE REQUIRED EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- STEP 2: CREATE ADMIN HELPER FUNCTIONS
-- =====================================================

-- Function to check if a user is an admin
-- This is used in RLS policies to grant admin access
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (raw_user_meta_data->>'isAdmin')::boolean,
    false
  )
  FROM auth.users
  WHERE id = user_id;
$$;

COMMENT ON FUNCTION is_admin IS 'Check if a user has admin privileges by reading their metadata';

-- Function to set admin status for a user
-- Usage: SELECT set_admin_status('user@example.com', true);
CREATE OR REPLACE FUNCTION set_admin_status(user_email text, is_admin_value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users 
  SET raw_user_meta_data = 
    CASE 
      WHEN is_admin_value THEN raw_user_meta_data || '{"isAdmin": true}'::jsonb
      ELSE raw_user_meta_data - 'isAdmin'
    END
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$;

COMMENT ON FUNCTION set_admin_status IS 'Set or remove admin status for a user by email';

-- =====================================================
-- STEP 3: CREATE TABLES & PROFILE
-- =====================================================

-- 3.1: Create Profile Table
CREATE TABLE IF NOT EXISTS "Profile" (
  id TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  "userId" TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Profile_userId_idx" ON "Profile"("userId");
COMMENT ON TABLE "Profile" IS 'User profile information for display names and avatars';
-- (RLS policies for Profile follow below...)

-- 3.2: Create Task Table
CREATE TABLE IF NOT EXISTS "Task" (
  id TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  name TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  responsible TEXT,
  category TEXT,
  notes TEXT,
  links TEXT,
  "userId" TEXT NOT NULL,
  "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "teamId" TEXT,
  "assignedToId" TEXT,
  "createdById" TEXT,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "priority" TEXT DEFAULT 'medium'
);
CREATE INDEX IF NOT EXISTS "Task_userId_idx" ON "Task"("userId");
CREATE INDEX IF NOT EXISTS "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX IF NOT EXISTS "Task_assignedToId_idx" ON "Task"("assignedToId");
CREATE INDEX IF NOT EXISTS "Task_teamId_idx" ON "Task"("teamId");

-- 3.3: Create Team Table
CREATE TABLE IF NOT EXISTS "Team" (
  id TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  name TEXT NOT NULL,
  description TEXT,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Team_ownerId_idx" ON "Team"("ownerId");

-- 3.4: Create TeamMember Table
CREATE TABLE IF NOT EXISTS "TeamMember" (
  id TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  "teamId" TEXT NOT NULL,
  "userId" TEXT,
  "userEmail" TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  "invitedBy" TEXT NOT NULL,
  "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "respondedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "TeamMember_teamId_idx" ON "TeamMember"("teamId");
CREATE INDEX IF NOT EXISTS "TeamMember_userId_idx" ON "TeamMember"("userId");
CREATE INDEX IF NOT EXISTS "TeamMember_status_idx" ON "TeamMember"("status");
-- Note: Prisma enforces unique constraint, we can add it optionally but RLS handles logic
-- CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_teamId_userId_unique" ON "TeamMember"("teamId", "userId");

-- 3.5: Create Note Table
CREATE TABLE IF NOT EXISTS "Note" (
  id TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  content TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "Note_userId_idx" ON "Note"("userId");

-- 3.6: Create Notification Table
CREATE TABLE IF NOT EXISTS "Notification" (
  id TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");

-- =====================================================
-- STEP 4: PROFILE RLS
-- =====================================================
-- Enable Row-Level Security on Profile
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;

-- Profile Policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON "Profile";
CREATE POLICY "Anyone can view profiles"
ON "Profile" FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Users can create own profile" ON "Profile";
CREATE POLICY "Users can create own profile"
ON "Profile" FOR INSERT
TO authenticated
WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own profile" ON "Profile";
CREATE POLICY "Users can update own profile"
ON "Profile" FOR UPDATE
TO authenticated
USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON "Profile";
CREATE POLICY "Admins can manage all profiles"
ON "Profile" FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- STEP 5: TASK RLS POLICIES
-- =====================================================
-- Tasks support both personal and team collaboration

ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

-- SELECT: View tasks you have access to
DROP POLICY IF EXISTS "Users can view accessible tasks" ON "Task";
CREATE POLICY "Users can view accessible tasks" ON "Task"
FOR SELECT
USING (
    -- Personal tasks (you own it)
    "userId" = auth.uid()::text
    -- Tasks assigned to you
    OR "assignedToId" = auth.uid()::text
    -- Tasks you created
    OR "createdById" = auth.uid()::text
    -- Team tasks (you're a member)
    OR EXISTS (
        SELECT 1 FROM "TeamMember" tm
        WHERE tm."teamId" = "Task"."teamId"
        AND tm."userId" = auth.uid()::text
        AND tm."status" = 'accepted'
    )
);

-- INSERT: Create personal tasks or assign team tasks (owners/admins only)
DROP POLICY IF EXISTS "Users can create tasks" ON "Task";
CREATE POLICY "Users can create tasks" ON "Task"
FOR INSERT
WITH CHECK (
    -- Must be the creator
    auth.uid()::text = "createdById"
    AND (
        -- Personal task (no team)
        "teamId" IS NULL
        -- OR team task where you're owner/admin
        OR EXISTS (
            SELECT 1 FROM "TeamMember" tm
            WHERE tm."teamId" = "Task"."teamId"
            AND tm."userId" = auth.uid()::text
            AND tm."role" IN ('owner', 'admin')
            AND tm."status" = 'accepted'
        )
    )
);

-- UPDATE: Edit tasks you created, own, or are assigned to
DROP POLICY IF EXISTS "Users can update tasks" ON "Task";
CREATE POLICY "Users can update tasks" ON "Task"
FOR UPDATE
USING (
    -- Creator can always update
    "createdById" = auth.uid()::text
    -- Assigned user can update (e.g., mark complete)
    OR "assignedToId" = auth.uid()::text
    -- Owner can update
    OR "userId" = auth.uid()::text
    -- Team owners/admins can update team tasks
    OR EXISTS (
        SELECT 1 FROM "TeamMember" tm
        WHERE tm."teamId" = "Task"."teamId"
        AND tm."userId" = auth.uid()::text
        AND tm."role" IN ('owner', 'admin')
        AND tm."status" = 'accepted'
    )
);

-- DELETE: Only creators can delete tasks
DROP POLICY IF EXISTS "Users can delete own created tasks" ON "Task";
CREATE POLICY "Users can delete own created tasks" ON "Task"
FOR DELETE
USING (
    -- Only the creator can delete
    "createdById" = auth.uid()::text
    -- OR owner of personal tasks (fallback for old tasks)
    OR ("userId" = auth.uid()::text AND "createdById" IS NULL)
);

-- =====================================================
-- STEP 5: TEAM RLS POLICIES
-- =====================================================
-- Teams enable collaborative task management

ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;

-- SELECT: View teams you're a member of
DROP POLICY IF EXISTS "Users can view their teams" ON "Team";
CREATE POLICY "Users can view their teams" ON "Team"
FOR SELECT
USING (
    "ownerId" = auth.uid()::text
    OR EXISTS (
        SELECT 1 FROM "TeamMember" tm
        WHERE tm."teamId" = "Team".id
        AND tm."userId" = auth.uid()::text
        AND tm."status" = 'accepted'
    )
);

-- INSERT: Anyone can create a team
DROP POLICY IF EXISTS "Users can create teams" ON "Team";
CREATE POLICY "Users can create teams" ON "Team"
FOR INSERT
WITH CHECK ("ownerId" = auth.uid()::text);

-- UPDATE: Only team owners can update team info
DROP POLICY IF EXISTS "Owners can update teams" ON "Team";
CREATE POLICY "Owners can update teams" ON "Team"
FOR UPDATE
USING ("ownerId" = auth.uid()::text);

-- DELETE: Only team owners can delete teams
DROP POLICY IF EXISTS "Owners can delete teams" ON "Team";
CREATE POLICY "Owners can delete teams" ON "Team"
FOR DELETE
USING ("ownerId" = auth.uid()::text);

-- =====================================================
-- STEP 6: TEAM MEMBER RLS POLICIES
-- =====================================================
-- TeamMember manages invitations and roles

ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;

-- SELECT: View members of teams you belong to
-- Helper function to avoid recursion
CREATE OR REPLACE FUNCTION check_is_team_member(team_id_check text, user_id_check text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "TeamMember"
    WHERE "teamId" = team_id_check
    AND "userId" = user_id_check
    AND "status" = 'accepted'
  );
$$;

-- SELECT: View members of teams you belong to
DROP POLICY IF EXISTS "Users can view team members" ON "TeamMember";
CREATE POLICY "Users can view team members" ON "TeamMember"
FOR SELECT
USING (
    -- You can see yourself
    "userId" = auth.uid()::text
    -- OR you are a member of the team (checked via secured function)
    OR check_is_team_member("teamId", auth.uid()::text)
);

-- INSERT: Owners and admins can invite new members
-- INSERT: Owners can invite members OR add themselves
DROP POLICY IF EXISTS "Owners and admins can invite members" ON "TeamMember";
CREATE POLICY "Owners and admins can invite members" ON "TeamMember"
FOR INSERT
WITH CHECK (
    -- Case 1: Existing Admin/Owner inviting someone
    EXISTS (
        SELECT 1 FROM "TeamMember" tm
        WHERE tm."teamId" = "TeamMember"."teamId"
        AND tm."userId" = auth.uid()::text
        AND tm."role" IN ('owner', 'admin')
        AND tm."status" = 'accepted'
    )
    -- Case 2: Team Owner adding themselves (First member)
    OR (
       "userId" = auth.uid()::text
       AND EXISTS (
          SELECT 1 FROM "Team"
          WHERE id = "TeamMember"."teamId"
          AND "ownerId" = auth.uid()::text
       )
    )
);

-- UPDATE: Members can update their own membership (accept/decline invites)
DROP POLICY IF EXISTS "Members can update own membership" ON "TeamMember";
CREATE POLICY "Members can update own membership" ON "TeamMember"
FOR UPDATE
USING ("userId" = auth.uid()::text);

-- DELETE: Owners and admins can remove members
DROP POLICY IF EXISTS "Owners and admins can remove members" ON "TeamMember";
CREATE POLICY "Owners and admins can remove members" ON "TeamMember"
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM "TeamMember" tm
        WHERE tm."teamId" = "TeamMember"."teamId"
        AND tm."userId" = auth.uid()::text
        AND tm."role" IN ('owner', 'admin')
        AND tm."status" = 'accepted'
    )
);

-- DELETE: Members can leave teams (delete own membership)
DROP POLICY IF EXISTS "Members can leave team" ON "TeamMember";
CREATE POLICY "Members can leave team" ON "TeamMember"
FOR DELETE
USING (
    "userId" = auth.uid()::text
);

-- =====================================================
-- STEP 7: NOTE RLS POLICIES
-- =====================================================
-- Personal notes for each user

ALTER TABLE "Note" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notes" ON "Note";
CREATE POLICY "Users can view own notes" ON "Note"
FOR SELECT
USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can create notes" ON "Note";
CREATE POLICY "Users can create notes" ON "Note"
FOR INSERT
WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own notes" ON "Note";
CREATE POLICY "Users can update own notes" ON "Note"
FOR UPDATE
USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own notes" ON "Note";
CREATE POLICY "Users can delete own notes" ON "Note"
FOR DELETE
USING ("userId" = auth.uid()::text);

-- =====================================================
-- STEP 8: NOTIFICATION RLS POLICIES
-- =====================================================
-- Real-time notifications for users

ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON "Notification";
CREATE POLICY "Users can view own notifications" ON "Notification"
FOR SELECT
USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can create notifications" ON "Notification";
CREATE POLICY "Users can create notifications" ON "Notification"
FOR INSERT
WITH CHECK (true); -- Allow system to create notifications

DROP POLICY IF EXISTS "Users can update own notifications" ON "Notification";
CREATE POLICY "Users can update own notifications" ON "Notification"
FOR UPDATE
USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own notifications" ON "Notification";
CREATE POLICY "Users can delete own notifications" ON "Notification"
FOR DELETE
USING ("userId" = auth.uid()::text);

-- =====================================================
-- STEP 9: AVATAR STORAGE SETUP
-- =====================================================
-- Configure Supabase Storage for avatar uploads

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Configure bucket settings
UPDATE storage.buckets
SET file_size_limit = 2097152, -- 2MB limit
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
WHERE id = 'avatars';

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Storage Policy 1: Upload avatars to own folder
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage Policy 2: Update avatars in own folder
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage Policy 3: Delete avatars in own folder
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage Policy 4: Public read access to all avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- =====================================================
-- STEP 10: TEAM MANAGEMENT FUNCTIONS
-- =====================================================

-- RPC to get teams a user is a member of (used by UI)
CREATE OR REPLACE FUNCTION get_user_member_teams(user_id_param text)
RETURNS TABLE (
  id text,
  name text,
  description text,
  "ownerId" text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id, 
    t.name, 
    t.description, 
    t."ownerId", 
    tm.role
  FROM "Team" t
  JOIN "TeamMember" tm ON t.id = tm."teamId"
  WHERE tm."userId" = user_id_param
  AND tm."status" = 'accepted';
END;
$$;

-- Function to invite team members with automatic notifications

-- Drop any existing versions of the function
DROP FUNCTION IF EXISTS invite_team_member(text, text, text, text, text);
DROP FUNCTION IF EXISTS invite_team_member(uuid, uuid, text, text, uuid);

CREATE OR REPLACE FUNCTION invite_team_member(
  team_id_param UUID,
  user_id_param UUID,
  invite_email_param TEXT,
  invite_role_param TEXT,
  invited_by_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  target_team_name TEXT;
  new_member_id UUID;
  inviter_name TEXT;
  normalized_email TEXT;
BEGIN
  normalized_email := LOWER(TRIM(invite_email_param));

  -- Check permissions (must be owner or admin)
  IF NOT EXISTS (
    SELECT 1 FROM "TeamMember"
    WHERE "teamId" = team_id_param::text
    AND "userId" = user_id_param::text
    AND "role" IN ('owner', 'admin')
    AND "status" = 'accepted'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied: You must be an owner or admin to invite members.');
  END IF;

  -- Get Team Name
  SELECT name INTO target_team_name FROM "Team" WHERE id = team_id_param::text;

  -- Get Inviter Name
  SELECT name INTO inviter_name FROM "Profile" WHERE "userId" = user_id_param::text;
  IF inviter_name IS NULL THEN
    inviter_name := 'A team member';
  END IF;

  -- Find the user by email (Case Insensitive)
  SELECT id INTO target_user_id FROM auth.users WHERE LOWER(email) = normalized_email;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM "TeamMember"
    WHERE "teamId" = team_id_param::text
    AND LOWER("userEmail") = normalized_email
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is already a member or has a pending invite.');
  END IF;

  -- Insert TeamMember
  INSERT INTO "TeamMember" (
    "teamId",
    "userId",
    "userEmail",
    "role",
    "status",
    "invitedBy",
    "invitedAt"
  ) VALUES (
    team_id_param::text,
    target_user_id::text,
    normalized_email,
    invite_role_param,
    'pending',
    invited_by_param::text,
    NOW()
  ) RETURNING id INTO new_member_id;

  -- Create Notification (ONLY if user exists)
  IF target_user_id IS NOT NULL THEN
    INSERT INTO "Notification" (
      "userId",
      "type",
      "title",
      "message",
      "isRead",
      "link",
      "createdAt"
    ) VALUES (
      target_user_id::text,
      'team_invite',
      'Team Invitation',
      inviter_name || ' invited you to join ' || target_team_name,
      false,
      '/dashboard?acceptInvite=' || new_member_id::text,
      NOW()
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'member_id', new_member_id,
    'user_found', (target_user_id IS NOT NULL),
    'debug_email', normalized_email
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION invite_team_member IS 'Invite a user to join a team and automatically create a notification if the user exists';

-- Function for a user to leave a team
CREATE OR REPLACE FUNCTION leave_team(team_id_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the membership record for the current user and specified team
  DELETE FROM "TeamMember"
  WHERE "teamId" = team_id_param
  AND "userId" = auth.uid()::text;
END;
$$;

COMMENT ON FUNCTION leave_team IS 'Allows the authenticated user to leave a specific team';

-- =====================================================
-- STEP 11: AUTOMATIC NOTIFICATION TRIGGERS
-- =====================================================
-- Trigger to create notifications when tasks are assigned

CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- CASE 1: New Task Created
  IF (TG_OP = 'INSERT') THEN
    IF (NEW."assignedToId" IS NOT NULL AND NEW."assignedToId" != NEW."createdById") THEN
      INSERT INTO "Notification" ("userId", "type", "title", "message", "isRead", "createdAt")
      VALUES (
        NEW."assignedToId",
        'task_assigned',
        'New Task Assignment',
        'You have been assigned to task: ' || NEW.name,
        false,
        NOW()
      );
    END IF;
  
  -- CASE 2: Task Updated
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (NEW."assignedToId" IS NOT NULL AND 
       (OLD."assignedToId" IS NULL OR NEW."assignedToId" != OLD."assignedToId") AND 
       NEW."assignedToId" != NEW."createdById") THEN
       
      INSERT INTO "Notification" ("userId", "type", "title", "message", "isRead", "createdAt")
      VALUES (
        NEW."assignedToId",
        'task_assigned',
        'New Task Assignment',
        'You have been assigned to task: ' || NEW.name,
        false,
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_task_assigned ON "Task";
CREATE TRIGGER on_task_assigned
AFTER INSERT OR UPDATE ON "Task"
FOR EACH ROW
EXECUTE FUNCTION notify_task_assignment();

COMMENT ON FUNCTION notify_task_assignment IS 'Automatically create notifications when tasks are assigned to users';

-- =====================================================
-- STEP 12: ENABLE REALTIME SUBSCRIPTIONS
-- =====================================================
-- Add tables to the realtime publication for live updates

DO $$
BEGIN
  -- Add Task to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE "Task";
    RAISE NOTICE 'Added Task to realtime';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Task already in realtime';
  END;

  -- Add Notification to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
    RAISE NOTICE 'Added Notification to realtime';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Notification already in realtime';
  END;

  -- Add TeamMember to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE "TeamMember";
    RAISE NOTICE 'Added TeamMember to realtime';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'TeamMember already in realtime';
  END;
END $$;

-- =====================================================
-- STEP 13: VERIFICATION QUERIES
-- =====================================================

-- Verify RLS is enabled on all tables
DO $$
DECLARE
  table_name TEXT;
  tables TEXT[] := ARRAY['Task', 'Team', 'TeamMember', 'Profile', 'Note', 'Notification'];
BEGIN
  FOREACH table_name IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = table_name 
      AND rowsecurity = true
    ) THEN
      RAISE WARNING 'RLS not enabled on table: %', table_name;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- 
-- ✅ Database schema created
-- ✅ Row-Level Security (RLS) enabled
-- ✅ Admin functions installed
-- ✅ Storage bucket configured
-- ✅ All policies applied
-- 
-- NEXT STEPS:
-- 
-- 1. Set admin users:
--    SELECT set_admin_status('your-email@example.com', true);
-- 
-- 2. Verify RLS is working:
--    SELECT tablename, rowsecurity 
--    FROM pg_tables 
--    WHERE schemaname = 'public';
-- 
-- 3. Check admin users:
--    SELECT email, raw_user_meta_data->>'isAdmin' as is_admin 
--    FROM auth.users 
--    WHERE (raw_user_meta_data->>'isAdmin')::boolean = true;
-- 
-- 4. Verify storage bucket:
--    SELECT * FROM storage.buckets WHERE id = 'avatars';
-- 
-- 5. Test your application!
-- 
-- =====================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '
  ╔════════════════════════════════════════════════════╗
  ║                                                    ║
  ║   ✅ TASK MANAGER DATABASE SETUP COMPLETE!        ║
  ║                                                    ║
  ║   Your database is ready to use.                  ║
  ║   Don''t forget to set admin users!               ║
  ║                                                    ║
  ╚════════════════════════════════════════════════════╝
  ';
END $$;
