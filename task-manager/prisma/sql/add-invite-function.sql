-- Run this in Supabase SQL Editor to fix invite functionality

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
