-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can insert their own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can update their own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can delete their own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can view their own notes" ON "Note";
DROP POLICY IF EXISTS "Users can insert their own notes" ON "Note";
DROP POLICY IF EXISTS "Users can update their own notes" ON "Note";
DROP POLICY IF EXISTS "Users can delete their own notes" ON "Note";

-- Enable Row Level Security on Task and Note tables
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Note" ENABLE ROW LEVEL SECURITY;

-- Task Policies: Users can only see and manage their own tasks

-- Policy: Users can view their own tasks
CREATE POLICY "Users can view their own tasks"
ON "Task"
FOR SELECT
USING (auth.uid() = "userId"::uuid);

-- Policy: Users can insert their own tasks
CREATE POLICY "Users can insert their own tasks"
ON "Task"
FOR INSERT
WITH CHECK (auth.uid() = "userId"::uuid);

-- Policy: Users can update their own tasks
CREATE POLICY "Users can update their own tasks"
ON "Task"
FOR UPDATE
USING (auth.uid() = "userId"::uuid)
WITH CHECK (auth.uid() = "userId"::uuid);

-- Policy: Users can delete their own tasks
CREATE POLICY "Users can delete their own tasks"
ON "Task"
FOR DELETE
USING (auth.uid() = "userId"::uuid);

-- Note Policies: Users can only see and manage their own notes

-- Policy: Users can view their own notes
CREATE POLICY "Users can view their own notes"
ON "Note"
FOR SELECT
USING (auth.uid() = "userId"::uuid);

-- Policy: Users can insert their own notes
CREATE POLICY "Users can insert their own notes"
ON "Note"
FOR INSERT
WITH CHECK (auth.uid() = "userId"::uuid);

-- Policy: Users can update their own notes
CREATE POLICY "Users can update their own notes"
ON "Note"
FOR UPDATE
USING (auth.uid() = "userId"::uuid)
WITH CHECK (auth.uid() = "userId"::uuid);

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete their own notes"
ON "Note"
FOR DELETE
USING (auth.uid() = "userId"::uuid);
