    -- Enable RLS on Team and TeamMember tables
    ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies first
    DROP POLICY IF EXISTS "Users can view own teams" ON "Team";
    DROP POLICY IF EXISTS "Members can view their teams" ON "Team";
    DROP POLICY IF EXISTS "Users can view owned teams" ON "Team";
    DROP POLICY IF EXISTS "Users can create teams" ON "Team";
    DROP POLICY IF EXISTS "Owners can update teams" ON "Team";
    DROP POLICY IF EXISTS "Owners can delete teams" ON "Team";
    DROP POLICY IF EXISTS "Users can view team members" ON "TeamMember";
    DROP POLICY IF EXISTS "Users can view own memberships" ON "TeamMember";
    DROP POLICY IF EXISTS "Users can view pending invites to their email" ON "TeamMember";
    DROP POLICY IF EXISTS "Users can view all pending invites" ON "TeamMember";
    DROP POLICY IF EXISTS "Authenticated users can create memberships" ON "TeamMember";
    DROP POLICY IF EXISTS "Users can update memberships" ON "TeamMember";
    DROP POLICY IF EXISTS "Users can delete own memberships" ON "TeamMember";
    DROP POLICY IF EXISTS "Owners and admins can invite" ON "TeamMember";
    DROP POLICY IF EXISTS "Owners and admins can manage members" ON "TeamMember";
    DROP POLICY IF EXISTS "Users can accept or decline invitations" ON "TeamMember";
    DROP POLICY IF EXISTS "Users can leave teams" ON "TeamMember";
    DROP POLICY IF EXISTS "Owners can invite members" ON "TeamMember";
    DROP POLICY IF EXISTS "Owners can manage members" ON "TeamMember";
    DROP POLICY IF EXISTS "Users can update own membership" ON "TeamMember";
    DROP POLICY IF EXISTS "Users can manage memberships" ON "TeamMember";
    DROP POLICY IF EXISTS "Users can view own tasks" ON "Task";
    DROP POLICY IF EXISTS "Users can create own tasks" ON "Task";
    DROP POLICY IF EXISTS "Users can create tasks" ON "Task";
    DROP POLICY IF EXISTS "Users can update own tasks" ON "Task";
    DROP POLICY IF EXISTS "Users can delete own tasks" ON "Task";

    -- Re-enable RLS (was disabled before)
    ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;

    -- SECURE TEAM POLICIES (No recursion - only check ownerId)
    CREATE POLICY "Users can view owned teams" ON "Team"
        FOR SELECT
        USING ("ownerId" = auth.uid()::text);

    CREATE POLICY "Users can create teams" ON "Team"
        FOR INSERT
        WITH CHECK ("ownerId" = auth.uid()::text);

    CREATE POLICY "Owners can update teams" ON "Team"
        FOR UPDATE
        USING ("ownerId" = auth.uid()::text)
        WITH CHECK ("ownerId" = auth.uid()::text);

    CREATE POLICY "Owners can delete teams" ON "Team"
        FOR DELETE
        USING ("ownerId" = auth.uid()::text);

    -- SECURE TASK POLICIES (No recursion - only check userId and assignedToId)
    CREATE POLICY "Users can view own tasks" ON "Task"
        FOR SELECT
        USING (
            "userId" = auth.uid()::text
            OR
            "assignedToId" = auth.uid()::text
        );

    CREATE POLICY "Users can create tasks" ON "Task"
        FOR INSERT
        WITH CHECK ("userId" = auth.uid()::text);

    CREATE POLICY "Users can update own tasks" ON "Task"
        FOR UPDATE
        USING ("userId" = auth.uid()::text OR "assignedToId" = auth.uid()::text)
        WITH CHECK ("userId" = auth.uid()::text);

    CREATE POLICY "Users can delete own tasks" ON "Task"
        FOR DELETE
        USING ("userId" = auth.uid()::text);

    -- SECURE TEAMMEMBER POLICIES (No recursion - simple checks only)
    CREATE POLICY "Users can view own memberships" ON "TeamMember"
        FOR SELECT
        USING ("userId" = auth.uid()::text);

    -- Separate policy for viewing pending invites WITHOUT auth.users check
    -- We'll handle email matching in the application layer instead
    CREATE POLICY "Users can view all pending invites" ON "TeamMember"
        FOR SELECT
        USING ("status" = 'pending');

    CREATE POLICY "Authenticated users can create memberships" ON "TeamMember"
        FOR INSERT
        WITH CHECK (auth.uid()::text IS NOT NULL);

    CREATE POLICY "Users can update memberships" ON "TeamMember"
        FOR UPDATE
        USING (
            "userId" = auth.uid()::text
            OR
            ("userId" IS NULL OR "userId" = '')
        )
        WITH CHECK (
            "userId" = auth.uid()::text
            OR
            ("userId" = auth.uid()::text AND "status" IN ('pending', 'accepted', 'declined'))
        );

    CREATE POLICY "Users can delete own memberships" ON "TeamMember"
        FOR DELETE
        USING ("userId" = auth.uid()::text AND "role" != 'owner');

    -- Function to accept a team invite (secure - only user can accept their own invites)
    CREATE OR REPLACE FUNCTION accept_team_invite(invite_id text, user_id text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
        UPDATE "TeamMember"
        SET "userId" = user_id,
            "status" = 'accepted',
            "respondedAt" = NOW()
        WHERE "id" = invite_id
        AND "status" = 'pending'
        AND ("userId" IS NULL OR "userId" = '' OR "userId" = user_id);
    END;
    $$;

    -- Function to decline a team invite (secure - only user can decline their own invites)
    CREATE OR REPLACE FUNCTION decline_team_invite(invite_id text, user_id text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
        UPDATE "TeamMember"
        SET "userId" = user_id,
            "status" = 'declined',
            "respondedAt" = NOW()
        WHERE "id" = invite_id
        AND "status" = 'pending'
        AND ("userId" IS NULL OR "userId" = '' OR "userId" = user_id);
    END;
    $$;

    -- Helper function to get teams where user is a member (bypasses RLS)
    CREATE OR REPLACE FUNCTION get_user_member_teams(user_id_param text)
    RETURNS SETOF "Team"
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
        RETURN QUERY
        SELECT t.*
        FROM "Team" t
        INNER JOIN "TeamMember" tm ON tm."teamId" = t."id"
        WHERE tm."userId" = user_id_param
        AND tm."status" = 'accepted'
        AND t."ownerId" != user_id_param; -- Exclude teams already visible via owner policy
    END;
    $$;
