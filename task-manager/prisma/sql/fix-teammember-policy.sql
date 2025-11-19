-- Fix TeamMember SELECT policy to allow viewing team memberships
DROP POLICY IF EXISTS "Users can view team members" ON "TeamMember";

CREATE POLICY "Users can view team members" ON "TeamMember"
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR "userId" = auth.uid()::text
    OR "teamId" IN (SELECT id FROM "Team" WHERE "ownerId" = auth.uid()::text)
  );
