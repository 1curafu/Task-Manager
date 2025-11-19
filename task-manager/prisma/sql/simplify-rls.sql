-- SIMPLIFIED RLS APPROACH
-- This completely replaces fix-teams-policies.sql with a cleaner solution

-- Step 1: Clean up existing policies
DROP POLICY IF EXISTS "Users can view own teams" ON "Team";
DROP POLICY IF EXISTS "Members can view their teams" ON "Team";
DROP POLICY IF EXISTS "Users can view owned teams" ON "Team";
DROP POLICY IF EXISTS "team_owner_all" ON "Team";
DROP POLICY IF EXISTS "team_member_select" ON "Team";
DROP POLICY IF EXISTS "Users can create teams" ON "Team";
DROP POLICY IF EXISTS "Owners can update teams" ON "Team";
DROP POLICY IF EXISTS "Owners can delete teams" ON "Team";
DROP POLICY IF EXISTS "Users can view team members" ON "TeamMember";
DROP POLICY IF EXISTS "Users can view own memberships" ON "TeamMember";
DROP POLICY IF EXISTS "Users can view pending invites to their email" ON "TeamMember";
DROP POLICY IF EXISTS "Users can view all pending invites" ON "TeamMember";
DROP POLICY IF EXISTS "teammember_select" ON "TeamMember";
DROP POLICY IF EXISTS "teammember_insert" ON "TeamMember";
DROP POLICY IF EXISTS "teammember_update" ON "TeamMember";
DROP POLICY IF EXISTS "teammember_delete" ON "TeamMember";
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
DROP POLICY IF EXISTS "task_select" ON "Task";
DROP POLICY IF EXISTS "task_insert" ON "Task";
DROP POLICY IF EXISTS "task_update" ON "Task";
DROP POLICY IF EXISTS "task_delete" ON "Task";
DROP POLICY IF EXISTS "Users can update own tasks" ON "Task";
DROP POLICY IF EXISTS "Users can delete own tasks" ON "Task";

-- Step 2: Enable RLS on all tables
ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

-- Step 3: Create helper function to get current user email
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Step 4: SUPER SIMPLE RLS POLICIES

-- Team: Only owners can see/manage via RLS (members use helper function)
CREATE POLICY "team_owner_all" ON "Team"
    FOR ALL
    USING ("ownerId" = auth.uid()::text)
    WITH CHECK ("ownerId" = auth.uid()::text);

-- TeamMember: Simple checks only - NO JOIN to avoid recursion
CREATE POLICY "teammember_select" ON "TeamMember"
    FOR SELECT
    USING (
        "userId" = auth.uid()::text
        OR
        ("status" = 'pending' AND "userEmail" = get_current_user_email())
    );

CREATE POLICY "teammember_insert" ON "TeamMember"
    FOR INSERT
    WITH CHECK (auth.uid()::text IS NOT NULL);

CREATE POLICY "teammember_update" ON "TeamMember"
    FOR UPDATE
    USING (
        "userId" = auth.uid()::text
        OR
        ("userId" IS NULL OR "userId" = '')
        OR
        ("status" = 'pending' AND "userEmail" = get_current_user_email())
    )
    WITH CHECK (
        "userId" = auth.uid()::text
        OR
        ("status" IN ('pending', 'accepted', 'declined') AND "userEmail" = get_current_user_email())
    );

CREATE POLICY "teammember_delete" ON "TeamMember"
    FOR DELETE
    USING ("userId" = auth.uid()::text AND "role" != 'owner');

-- Task: Can see if you created it or assigned to you
CREATE POLICY "task_select" ON "Task"
    FOR SELECT
    USING (
        "userId" = auth.uid()::text
        OR
        "assignedToId" = auth.uid()::text
    );

CREATE POLICY "task_insert" ON "Task"
    FOR INSERT
    WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "task_update" ON "Task"
    FOR UPDATE
    USING ("userId" = auth.uid()::text OR "assignedToId" = auth.uid()::text)
    WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "task_delete" ON "Task"
    FOR DELETE
    USING ("userId" = auth.uid()::text);

-- Step 5: Keep the secure accept/decline functions
CREATE OR REPLACE FUNCTION accept_team_invite(invite_id text, user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invite_team_id text;
BEGIN
    -- Get the teamId from the pending invite
    SELECT "teamId" INTO invite_team_id
    FROM "TeamMember"
    WHERE "id"::text = invite_id
    AND "status" = 'pending';
    
    -- Delete any existing membership for this user in this team
    DELETE FROM "TeamMember"
    WHERE "teamId" = invite_team_id
    AND "userId" = user_id
    AND "id"::text != invite_id;
    
    -- Accept the new invite
    UPDATE "TeamMember"
    SET "userId" = user_id,
        "status" = 'accepted',
        "respondedAt" = NOW()
    WHERE "id"::text = invite_id
    AND "status" = 'pending';
END;
$$;

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
    WHERE "id"::text = invite_id
    AND "status" = 'pending'
    AND ("userId" IS NULL OR "userId" = '' OR "userId" = user_id);
END;
$$;

-- Step 6: Helper function to get member teams (bypasses RLS)
DROP FUNCTION IF EXISTS get_user_member_teams(text);
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
    AND t."ownerId" != user_id_param;
END;
$$;

-- Helper function to get invite details (bypasses RLS)
DROP FUNCTION IF EXISTS get_invite_details(text);
CREATE OR REPLACE FUNCTION get_invite_details(invite_id_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_row json;
BEGIN
    SELECT json_build_object(
        'team_name', t.name,
        'owner_email', (SELECT email FROM auth.users WHERE id::text = t."ownerId"),
        'invite_role', tm.role
    ) INTO result_row
    FROM "TeamMember" tm
    INNER JOIN "Team" t ON t.id::text = tm."teamId"
    WHERE tm.id::text = invite_id_param
    AND tm.status = 'pending';
    
    RETURN result_row;
END;
$$;

-- Helper function to get team details if user is owner or member
DROP FUNCTION IF EXISTS get_team_details(text, text);
CREATE OR REPLACE FUNCTION get_team_details(team_id_param text, user_id_param text)
RETURNS SETOF "Team"
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT t.*
    FROM "Team" t
    WHERE t.id::text = team_id_param
    AND (
        t."ownerId" = user_id_param
        OR
        EXISTS (
            SELECT 1 FROM "TeamMember" tm
            WHERE tm."teamId"::text = team_id_param
            AND tm."userId" = user_id_param
            AND tm."status" = 'accepted'
        )
    );
END;
$$;

-- Helper function to get team members if user is part of the team
DROP FUNCTION IF EXISTS get_team_members(text, text);
CREATE OR REPLACE FUNCTION get_team_members(team_id_param text, user_id_param text)
RETURNS SETOF "TeamMember"
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is owner or member of this team
    IF EXISTS (
        SELECT 1 FROM "Team" t
        WHERE t.id::text = team_id_param
        AND t."ownerId" = user_id_param
    ) OR EXISTS (
        SELECT 1 FROM "TeamMember" tm
        WHERE tm."teamId"::text = team_id_param
        AND tm."userId" = user_id_param
        AND tm."status" = 'accepted'
    ) THEN
        -- Return all members of this team
        RETURN QUERY
        SELECT tm.*
        FROM "TeamMember" tm
        WHERE tm."teamId"::text = team_id_param
        ORDER BY tm.role;
    END IF;
END;
$$;

-- Helper function to remove a team member (owner/admin only)
DROP FUNCTION IF EXISTS remove_team_member(text, text);
CREATE OR REPLACE FUNCTION remove_team_member(member_id_param text, user_id_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    member_team_id text;
    member_role text;
    requester_role text;
BEGIN
    -- Get the team ID and role of the member to be removed
    SELECT "teamId", role INTO member_team_id, member_role
    FROM "TeamMember"
    WHERE id::text = member_id_param;
    
    IF member_team_id IS NULL THEN
        RAISE EXCEPTION 'Member not found';
    END IF;
    
    -- Get the role of the user making the request
    SELECT role INTO requester_role
    FROM "TeamMember"
    WHERE "teamId" = member_team_id
    AND "userId" = user_id_param
    AND "status" = 'accepted';
    
    -- Check if requester has permission (owner or admin)
    IF requester_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Permission denied: only owners and admins can remove members';
    END IF;
    
    -- Can't remove the owner
    IF member_role = 'owner' THEN
        RAISE EXCEPTION 'Cannot remove the team owner';
    END IF;
    
    -- Delete the member
    DELETE FROM "TeamMember"
    WHERE id::text = member_id_param;
END;
$$;

-- Helper function to delete a team (owner only)
DROP FUNCTION IF EXISTS delete_team(text, text);
CREATE OR REPLACE FUNCTION delete_team(team_id_param text, user_id_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    team_owner_id text;
BEGIN
    -- Get the team owner
    SELECT "ownerId" INTO team_owner_id
    FROM "Team"
    WHERE id::text = team_id_param;
    
    IF team_owner_id IS NULL THEN
        RAISE EXCEPTION 'Team not found';
    END IF;
    
    -- Check if user is the owner
    IF team_owner_id != user_id_param THEN
        RAISE EXCEPTION 'Permission denied: only the team owner can delete the team';
    END IF;
    
    -- Delete all tasks for this team
    DELETE FROM "Task"
    WHERE "teamId"::text = team_id_param;
    
    -- Delete all team members
    DELETE FROM "TeamMember"
    WHERE "teamId"::text = team_id_param;
    
    -- Delete the team
    DELETE FROM "Team"
    WHERE id::text = team_id_param;
END;
$$;

-- Helper function to invite a team member (owner/admin only)
DROP FUNCTION IF EXISTS invite_team_member(text, text, text, text, text);
CREATE OR REPLACE FUNCTION invite_team_member(
    team_id_param text,
    user_id_param text,
    invite_email_param text,
    invite_role_param text,
    invited_by_param text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    requester_role text;
    existing_member_id text;
    existing_member_status text;
BEGIN
    -- Check if requester is owner or admin of the team
    SELECT role INTO requester_role
    FROM "TeamMember"
    WHERE "teamId" = team_id_param
    AND "userId" = user_id_param
    AND "status" = 'accepted';
    
    -- If not found in TeamMember, check if user is team owner
    IF requester_role IS NULL THEN
        SELECT 'owner' INTO requester_role
        FROM "Team"
        WHERE id::text = team_id_param
        AND "ownerId" = user_id_param;
    END IF;
    
    IF requester_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Permission denied: only owners and admins can invite members';
    END IF;
    
    -- Check for existing membership with this email
    SELECT id, status INTO existing_member_id, existing_member_status
    FROM "TeamMember"
    WHERE "teamId" = team_id_param
    AND "userEmail" = invite_email_param;
    
    IF existing_member_id IS NOT NULL THEN
        IF existing_member_status = 'accepted' THEN
            RAISE EXCEPTION 'This user is already a member of the team';
        ELSIF existing_member_status = 'pending' THEN
            RAISE EXCEPTION 'An invitation is already pending for this email';
        ELSIF existing_member_status = 'declined' THEN
            -- Re-invite by updating the existing declined invite
            UPDATE "TeamMember"
            SET status = 'pending',
                role = invite_role_param,
                "invitedBy" = invited_by_param,
                "invitedAt" = NOW(),
                "respondedAt" = NULL
            WHERE id = existing_member_id;
            
            RETURN json_build_object('success', true, 'action', 're-invited');
        END IF;
    ELSE
        -- Insert new invite
        INSERT INTO "TeamMember" (
            "teamId",
            "userId",
            "userEmail",
            role,
            status,
            "invitedBy"
        ) VALUES (
            team_id_param,
            NULL,
            invite_email_param,
            invite_role_param,
            'pending',
            invited_by_param
        );
        
        RETURN json_build_object('success', true, 'action', 'invited');
    END IF;
END;
$$;
