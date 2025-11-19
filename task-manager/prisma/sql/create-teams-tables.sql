-- Create Team table
CREATE TABLE IF NOT EXISTS "Team" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create TeamMember table
CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitedBy" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    CONSTRAINT "TeamMember_teamId_userId_unique" UNIQUE ("teamId", "userId")
);

-- Update Task table to add team fields
ALTER TABLE "Task" 
ADD COLUMN IF NOT EXISTS "teamId" TEXT,
ADD COLUMN IF NOT EXISTS "assignedToId" TEXT,
ADD COLUMN IF NOT EXISTS "createdById" TEXT;

-- Update existing tasks to set createdById = userId
UPDATE "Task" SET "createdById" = "userId" WHERE "createdById" IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "Team_ownerId_idx" ON "Team"("ownerId");
CREATE INDEX IF NOT EXISTS "TeamMember_teamId_idx" ON "TeamMember"("teamId");
CREATE INDEX IF NOT EXISTS "TeamMember_userId_idx" ON "TeamMember"("userId");
CREATE INDEX IF NOT EXISTS "TeamMember_status_idx" ON "TeamMember"("status");
CREATE INDEX IF NOT EXISTS "Task_teamId_idx" ON "Task"("teamId");
CREATE INDEX IF NOT EXISTS "Task_assignedToId_idx" ON "Task"("assignedToId");

-- Enable Row Level Security (RLS)
ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Team table
-- Users can view teams they own or are members of
CREATE POLICY "Users can view own teams" ON "Team"
    FOR SELECT
    USING (
        "ownerId" = auth.uid()::text 
        OR EXISTS (
            SELECT 1 FROM "TeamMember" 
            WHERE "TeamMember"."teamId" = "Team"."id" 
            AND "TeamMember"."userId" = auth.uid()::text
            AND "TeamMember"."status" = 'accepted'
        )
    );

-- Users can create teams
CREATE POLICY "Users can create teams" ON "Team"
    FOR INSERT
    WITH CHECK (auth.uid()::text = "ownerId");

-- Only team owners can update teams
CREATE POLICY "Owners can update teams" ON "Team"
    FOR UPDATE
    USING ("ownerId" = auth.uid()::text);

-- Only team owners can delete teams
CREATE POLICY "Owners can delete teams" ON "Team"
    FOR DELETE
    USING ("ownerId" = auth.uid()::text);

-- RLS Policies for TeamMember table
-- Users can view team members of teams they belong to
CREATE POLICY "Users can view team members" ON "TeamMember"
    FOR SELECT
    USING (
        "userId" = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM "TeamMember" tm
            WHERE tm."teamId" = "TeamMember"."teamId"
            AND tm."userId" = auth.uid()::text
            AND tm."status" = 'accepted'
        )
    );

-- Owners and admins can invite members
CREATE POLICY "Owners and admins can invite" ON "TeamMember"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Team" t
            WHERE t."id" = "teamId"
            AND t."ownerId" = auth.uid()::text
        )
        OR EXISTS (
            SELECT 1 FROM "TeamMember" tm
            WHERE tm."teamId" = "teamId"
            AND tm."userId" = auth.uid()::text
            AND tm."role" IN ('owner', 'admin')
            AND tm."status" = 'accepted'
        )
    );

-- Users can update their own membership (accept/decline)
CREATE POLICY "Users can update own membership" ON "TeamMember"
    FOR UPDATE
    USING ("userId" = auth.uid()::text);

-- Owners and admins can update member roles
CREATE POLICY "Owners and admins can manage members" ON "TeamMember"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "Team" t
            WHERE t."id" = "teamId"
            AND t."ownerId" = auth.uid()::text
        )
        OR EXISTS (
            SELECT 1 FROM "TeamMember" tm
            WHERE tm."teamId" = "teamId"
            AND tm."userId" = auth.uid()::text
            AND tm."role" = 'admin'
            AND tm."status" = 'accepted'
        )
    );

-- Users can leave teams (delete their membership)
CREATE POLICY "Users can leave teams" ON "TeamMember"
    FOR DELETE
    USING ("userId" = auth.uid()::text);

-- Update Task RLS policies to include team tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON "Task";
CREATE POLICY "Users can view own and team tasks" ON "Task"
    FOR SELECT
    USING (
        "userId" = auth.uid()::text
        OR "assignedToId" = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM "TeamMember" tm
            WHERE tm."teamId" = "Task"."teamId"
            AND tm."userId" = auth.uid()::text
            AND tm."status" = 'accepted'
        )
    );

DROP POLICY IF EXISTS "Users can insert own tasks" ON "Task";
CREATE POLICY "Users can create tasks" ON "Task"
    FOR INSERT
    WITH CHECK (
        auth.uid()::text = "createdById"
        AND (
            "teamId" IS NULL
            OR EXISTS (
                SELECT 1 FROM "TeamMember" tm
                WHERE tm."teamId" = "Task"."teamId"
                AND tm."userId" = auth.uid()::text
                AND tm."role" IN ('owner', 'admin')
                AND tm."status" = 'accepted'
            )
        )
    );

DROP POLICY IF EXISTS "Users can update own tasks" ON "Task";
CREATE POLICY "Users can update tasks" ON "Task"
    FOR UPDATE
    USING (
        "createdById" = auth.uid()::text
        OR "assignedToId" = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM "TeamMember" tm
            WHERE tm."teamId" = "Task"."teamId"
            AND tm."userId" = auth.uid()::text
            AND tm."role" IN ('owner', 'admin')
            AND tm."status" = 'accepted'
        )
    );

DROP POLICY IF EXISTS "Users can delete own tasks" ON "Task";
CREATE POLICY "Users can delete tasks" ON "Task"
    FOR DELETE
    USING (
        "createdById" = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM "TeamMember" tm
            WHERE tm."teamId" = "Task"."teamId"
            AND tm."userId" = auth.uid()::text
            AND tm."role" IN ('owner', 'admin')
            AND tm."status" = 'accepted'
        )
    );
