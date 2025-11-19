-- Complete update for Task RLS policies to support team task assignment
-- This file updates all Task policies to work with the new features:
-- 1. Team owners/admins can assign tasks to members
-- 2. Members can only delete tasks they created
-- 3. Assigned users can view and update tasks assigned to them

-- ============================================================
-- SELECT Policy: View own tasks and tasks assigned to you
-- ============================================================
DROP POLICY IF EXISTS "Users can view own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can view own and team tasks" ON "Task";

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

-- ============================================================
-- INSERT Policy: Create personal tasks or assign team tasks (owner/admin only)
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can create tasks" ON "Task";

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

-- ============================================================
-- UPDATE Policy: Update tasks you created or are assigned to
-- ============================================================
DROP POLICY IF EXISTS "Users can update own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can update tasks" ON "Task";

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

-- ============================================================
-- DELETE Policy: Only creators can delete tasks
-- ============================================================
DROP POLICY IF EXISTS "Users can delete own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can delete tasks" ON "Task";
DROP POLICY IF EXISTS "Users can delete own created tasks" ON "Task";

CREATE POLICY "Users can delete own created tasks" ON "Task"
    FOR DELETE
    USING (
        -- Only the creator can delete
        "createdById" = auth.uid()::text
        -- OR owner of personal tasks (fallback for old tasks without createdById)
        OR ("userId" = auth.uid()::text AND "createdById" IS NULL)
    );

-- ============================================================
-- Summary of permissions:
-- ============================================================
-- SELECT (View):
--   - Own tasks (userId = current user)
--   - Tasks assigned to you (assignedToId = current user)
--   - Tasks you created (createdById = current user)
--   - Team tasks if you're a team member
--
-- INSERT (Create):
--   - Personal tasks (no teamId)
--   - Team tasks only if you're owner/admin of that team
--
-- UPDATE (Edit):
--   - Tasks you created
--   - Tasks assigned to you (e.g., to mark complete)
--   - Team tasks if you're owner/admin
--
-- DELETE (Remove):
--   - ONLY tasks you created
--   - Assigned users CANNOT delete tasks given to them
-- ============================================================
