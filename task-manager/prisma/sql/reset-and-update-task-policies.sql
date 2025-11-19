-- RESET AND UPDATE Task RLS Policies
-- This script safely drops all existing Task policies and creates new ones
-- Safe to run multiple times - handles ALL possible policy names from all migration files

-- ============================================================
-- STEP 1: Drop ALL existing Task policies (from all SQL files)
-- ============================================================

-- From enable-rls.sql
DROP POLICY IF EXISTS "Users can view their own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can insert their own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can update their own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can delete their own tasks" ON "Task";

-- From simplify-rls.sql
DROP POLICY IF EXISTS "task_select" ON "Task";
DROP POLICY IF EXISTS "task_insert" ON "Task";
DROP POLICY IF EXISTS "task_update" ON "Task";
DROP POLICY IF EXISTS "task_delete" ON "Task";

-- From create-teams-tables.sql
DROP POLICY IF EXISTS "Users can view own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can view own and team tasks" ON "Task";
DROP POLICY IF EXISTS "Users can insert own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can create tasks" ON "Task";
DROP POLICY IF EXISTS "Users can update own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can update tasks" ON "Task";
DROP POLICY IF EXISTS "Users can delete own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can delete tasks" ON "Task";

-- From update-task-policies-complete.sql
DROP POLICY IF EXISTS "Users can view accessible tasks" ON "Task";
DROP POLICY IF EXISTS "Users can delete own created tasks" ON "Task";

-- From fix-teams-policies.sql
DROP POLICY IF EXISTS "Users can create own tasks" ON "Task";

-- ============================================================
-- STEP 2: Create NEW policies with correct logic
-- ============================================================

-- SELECT Policy: View own tasks and tasks assigned to you
CREATE POLICY "Users can view accessible tasks" ON "Task"
    FOR SELECT
    USING (
        -- Personal tasks (creator or assigned user)
        "userId" = auth.uid()::text
        OR "assignedToId" = auth.uid()::text
        OR "createdById" = auth.uid()::text
        -- OR team member can see team tasks
        OR EXISTS (
            SELECT 1 FROM "TeamMember" tm
            WHERE tm."teamId" = "Task"."teamId"
            AND tm."userId" = auth.uid()::text
            AND tm."status" = 'accepted'
        )
    );

-- INSERT Policy: Create personal tasks or assign team tasks (owner/admin only)
CREATE POLICY "Users can create tasks" ON "Task"
    FOR INSERT
    WITH CHECK (
        -- Must be the creator
        auth.uid()::text = "createdById"
        AND (
            -- Personal task (no team)
            "teamId" IS NULL
            -- OR team task where user is owner/admin
            OR EXISTS (
                SELECT 1 FROM "TeamMember" tm
                WHERE tm."teamId" = "Task"."teamId"
                AND tm."userId" = auth.uid()::text
                AND tm."role" IN ('owner', 'admin')
                AND tm."status" = 'accepted'
            )
        )
    );

-- UPDATE Policy: Update tasks you created or are assigned to
CREATE POLICY "Users can update tasks" ON "Task"
    FOR UPDATE
    USING (
        -- Creator can always update
        "createdById" = auth.uid()::text
        -- Assigned user can update (e.g., mark as complete)
        OR "assignedToId" = auth.uid()::text
        -- Owner of task can update (covers both personal and assigned tasks)
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

-- DELETE Policy: Only creators can delete tasks
CREATE POLICY "Users can delete own created tasks" ON "Task"
    FOR DELETE
    USING (
        -- Only the creator can delete
        "createdById" = auth.uid()::text
        -- OR owner of personal tasks (fallback for old tasks without createdById)
        OR ("userId" = auth.uid()::text AND "createdById" IS NULL)
    );

-- ============================================================
-- STEP 3: Verify RLS is enabled
-- ============================================================
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE 'Task RLS policies have been successfully updated!';
    RAISE NOTICE 'Created 4 policies:';
    RAISE NOTICE '  1. Users can view accessible tasks (SELECT)';
    RAISE NOTICE '  2. Users can create tasks (INSERT)';
    RAISE NOTICE '  3. Users can update tasks (UPDATE)';
    RAISE NOTICE '  4. Users can delete own created tasks (DELETE)';
END $$;
