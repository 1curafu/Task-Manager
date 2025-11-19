-- Add completed field to Task table
-- Run this in Supabase SQL Editor

ALTER TABLE "Task" 
ADD COLUMN IF NOT EXISTS "completed" BOOLEAN DEFAULT false;

-- Update existing tasks to have completed = false
UPDATE "Task" 
SET "completed" = false 
WHERE "completed" IS NULL;
