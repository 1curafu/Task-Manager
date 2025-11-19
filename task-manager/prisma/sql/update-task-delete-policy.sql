-- Update Task DELETE policy to only allow creators to delete their tasks
-- Tasks assigned by team owners/admins cannot be deleted by assignees

DROP POLICY IF EXISTS "Users can delete tasks" ON "Task";

CREATE POLICY "Users can delete own created tasks" ON "Task"
    FOR DELETE
    USING (
        -- Only the creator can delete the task
        "createdById" = auth.uid()::text
    );

-- Note: This ensures that:
-- 1. Users can only delete tasks they created
-- 2. Team-assigned tasks can only be deleted by the team owner/admin who created them
-- 3. Regular members cannot delete tasks assigned to them by team owners/admins
