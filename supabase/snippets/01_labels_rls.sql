-- =====================================================
-- RLS POLICIES FOR LABELS AND DRAG & DROP
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Enable RLS on new tables
ALTER TABLE "Label" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskLabel" ENABLE ROW LEVEL SECURITY;

-- 2. Label Policies (Personal to each user)
DROP POLICY IF EXISTS "Users can view own labels" ON "Label";
CREATE POLICY "Users can view own labels" ON "Label"
FOR SELECT USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can create own labels" ON "Label";
CREATE POLICY "Users can create own labels" ON "Label"
FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own labels" ON "Label";
CREATE POLICY "Users can update own labels" ON "Label"
FOR UPDATE USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own labels" ON "Label";
CREATE POLICY "Users can delete own labels" ON "Label"
FOR DELETE USING ("userId" = auth.uid()::text);

-- 3. TaskLabel Policies (Access driven by Task and Label access)
-- A user can see a TaskLabel if they can see the underlying Task
DROP POLICY IF EXISTS "Users can view associated TaskLabels" ON "TaskLabel";
CREATE POLICY "Users can view associated TaskLabels" ON "TaskLabel"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Task" t
    WHERE t.id = "TaskLabel"."taskId"
    -- basic check, true proper task access is enforced when querying Tasks directly
  )
);

-- Users can link labels if they own the label and have access to update the task
-- (Simplified for now: allow if they own the label)
DROP POLICY IF EXISTS "Users can create TaskLabels" ON "TaskLabel";
CREATE POLICY "Users can create TaskLabels" ON "TaskLabel"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Label" l
    WHERE l.id = "TaskLabel"."labelId"
    AND l."userId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can delete TaskLabels" ON "TaskLabel";
CREATE POLICY "Users can delete TaskLabels" ON "TaskLabel"
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM "Label" l
    WHERE l.id = "TaskLabel"."labelId"
    AND l."userId" = auth.uid()::text
  )
);

-- 4. Add them to Realtime Publication (optional but good for live updates)
DO $$
BEGIN
  -- Add Label to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE "Label";
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Label already in realtime';
  END;

  -- Add TaskLabel to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE "TaskLabel";
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'TaskLabel already in realtime';
  END;
END $$;
