-- =====================================================
-- CREATE PROFILES TABLE FOR USER METADATA
-- =====================================================
-- This stores user display names and avatars so they can be
-- fetched client-side without requiring admin API access

CREATE TABLE IF NOT EXISTS "Profile" (
  id TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  "userId" TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "Profile_userId_idx" ON "Profile"("userId");

-- Enable RLS
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read profiles (for displaying names/avatars)
CREATE POLICY "Anyone can view profiles"
ON "Profile" FOR SELECT
TO public
USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can create own profile"
ON "Profile" FOR INSERT
TO authenticated
WITH CHECK ("userId" = auth.uid()::text);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON "Profile" FOR UPDATE
TO authenticated
USING ("userId" = auth.uid()::text);

-- Allow admins full access
CREATE POLICY "Admins can manage all profiles"
ON "Profile" FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
