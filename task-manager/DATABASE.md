# 🗄️ Database Setup Guide

Complete database setup for Task Manager with Supabase PostgreSQL and Row-Level Security (RLS).

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Database Schema](#database-schema)
- [Complete Setup SQL](#complete-setup-sql)
- [RLS Policies Explained](#rls-policies-explained)
- [Storage Setup](#storage-setup)
- [Admin Setup](#admin-setup)
- [Troubleshooting](#troubleshooting)

---

## Overview

This application uses:
- **PostgreSQL** via Supabase
- **Prisma ORM** for type-safe queries
- **Row-Level Security (RLS)** for data protection
- **Supabase Auth** for user authentication
- **Supabase Storage** for avatar uploads

### Database Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────┐ │
│  │   Task   │  │   Team   │  │ TeamMember   │  │ Profile │ │
│  └──────────┘  └──────────┘  └──────────────┘  └─────────┘ │
│                                                               │
│  ┌──────────┐  ┌──────────────┐                             │
│  │   Note   │  │ Notification │                             │
│  └──────────┘  └──────────────┘                             │
│                                                               │
│  + Row-Level Security (RLS) Policies                         │
│  + Helper Functions (is_admin, etc.)                         │
│  + UUID Generation (uuid_generate_v4)                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 2. Execute Complete Setup in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the entire contents of `prisma/COMPLETE_SETUP.sql` (below)
5. Paste and click **Run**

### 3. Configure Admin Users

After running the setup, make yourself an admin:

```sql
-- Replace with your email
SELECT set_admin_status('your-email@example.com', true);
```

### 4. Verify Setup

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check admin users
SELECT email, raw_user_meta_data->>'isAdmin' as is_admin 
FROM auth.users 
WHERE (raw_user_meta_data->>'isAdmin')::boolean = true;

-- Verify storage bucket
SELECT * FROM storage.buckets WHERE id = 'avatars';
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│      User       │ (Supabase Auth)
│  - id (UUID)    │
│  - email        │
│  - metadata     │
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐
│    Profile      │
│  - id           │
│  - userId   ───┼─── FK to auth.users
│  - name         │
│  - avatar       │
└─────────────────┘

         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐
│      Task       │       │      Note       │
│  - id           │       │  - id           │
│  - name         │       │  - content      │
│  - dueDate      │       │  - userId       │
│  - userId   ────┼───┐   └─────────────────┘
│  - teamId       │   │
│  - assignedToId │   │   ┌─────────────────┐
│  - createdById  │   │   │  Notification   │
│  - completed    │   │   │  - id           │
└─────────┬───────┘   │   │  - userId       │
          │           │   │  - type         │
          │ N:1       │   │  - message      │
          ▼           │   └─────────────────┘
┌─────────────────┐   │
│      Team       │   │
│  - id           │   │
│  - name         │   │
│  - ownerId  ────┼───┘
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│   TeamMember    │
│  - id           │
│  - teamId       │
│  - userId       │
│  - userEmail    │
│  - role         │
│  - status       │
└─────────────────┘
```

### Table Definitions

#### Task Table
```sql
{
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  dueDate      TIMESTAMP NOT NULL,
  responsible  TEXT,
  category     TEXT,
  notes        TEXT,
  links        TEXT,
  userId       TEXT NOT NULL,        -- Task owner
  teamId       TEXT,                 -- Team assignment
  assignedToId TEXT,                 -- Assigned user
  createdById  TEXT,                 -- Task creator
  completed    BOOLEAN DEFAULT false,
  createdAt    TIMESTAMP DEFAULT now(),
  lastUpdated  TIMESTAMP DEFAULT now()
}
```

#### Team Table
```sql
{
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  ownerId     TEXT NOT NULL,
  createdAt   TIMESTAMP DEFAULT now(),
  updatedAt   TIMESTAMP DEFAULT now()
}
```

#### TeamMember Table
```sql
{
  id          TEXT PRIMARY KEY,
  teamId      TEXT NOT NULL,
  userId      TEXT,
  userEmail   TEXT NOT NULL,
  role        TEXT DEFAULT 'member',    -- owner, admin, member
  status      TEXT DEFAULT 'pending',   -- pending, accepted, declined
  invitedBy   TEXT NOT NULL,
  invitedAt   TIMESTAMP DEFAULT now(),
  respondedAt TIMESTAMP
}
```

#### Profile Table
```sql
{
  id        TEXT PRIMARY KEY,
  userId    TEXT NOT NULL UNIQUE,
  name      TEXT,
  avatar    TEXT,                      -- Supabase Storage URL
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
}
```

#### Note Table
```sql
{
  id        TEXT PRIMARY KEY,
  content   TEXT NOT NULL,
  userId    TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
}
```

#### Notification Table
```sql
{
  id        TEXT PRIMARY KEY,
  userId    TEXT NOT NULL,
  type      TEXT NOT NULL,
  title     TEXT NOT NULL,
  message   TEXT NOT NULL,
  isRead    BOOLEAN DEFAULT false,
  link      TEXT,
  createdAt TIMESTAMP DEFAULT now()
}
```

---

## Complete Setup SQL

Save this as `prisma/COMPLETE_SETUP.sql` and run in Supabase SQL Editor:

```sql
-- =====================================================
-- COMPLETE DATABASE SETUP FOR TASK MANAGER
-- =====================================================
-- Run this entire script in Supabase SQL Editor
-- This will set up all tables, RLS policies, storage, and admin functions

-- =====================================================
-- STEP 1: ENABLE UUID EXTENSION
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- STEP 2: CREATE ADMIN HELPER FUNCTIONS
-- =====================================================

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (raw_user_meta_data->>'isAdmin')::boolean,
    false
  )
  FROM auth.users
  WHERE id = user_id;
$$;

-- Function to set admin status
CREATE OR REPLACE FUNCTION set_admin_status(user_email text, is_admin_value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users 
  SET raw_user_meta_data = 
    CASE 
      WHEN is_admin_value THEN raw_user_meta_data || '{"isAdmin": true}'::jsonb
      ELSE raw_user_meta_data - 'isAdmin'
    END
  WHERE email = user_email;
END;
$$;

-- =====================================================
-- STEP 3: CREATE PROFILE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS "Profile" (
  id TEXT PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  "userId" TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Profile_userId_idx" ON "Profile"("userId");

-- Enable RLS on Profile
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;

-- Profile Policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON "Profile";
CREATE POLICY "Anyone can view profiles"
ON "Profile" FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Users can create own profile" ON "Profile";
CREATE POLICY "Users can create own profile"
ON "Profile" FOR INSERT
TO authenticated
WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own profile" ON "Profile";
CREATE POLICY "Users can update own profile"
ON "Profile" FOR UPDATE
TO authenticated
USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON "Profile";
CREATE POLICY "Admins can manage all profiles"
ON "Profile" FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- STEP 4: TASK RLS POLICIES
-- =====================================================

ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

-- SELECT: View accessible tasks
DROP POLICY IF EXISTS "Users can view accessible tasks" ON "Task";
CREATE POLICY "Users can view accessible tasks" ON "Task"
FOR SELECT
USING (
    "userId" = auth.uid()::text
    OR "assignedToId" = auth.uid()::text
    OR "createdById" = auth.uid()::text
    OR EXISTS (
        SELECT 1 FROM "TeamMember" tm
        WHERE tm."teamId" = "Task"."teamId"
        AND tm."userId" = auth.uid()::text
        AND tm."status" = 'accepted'
    )
);

-- INSERT: Create tasks
DROP POLICY IF EXISTS "Users can create tasks" ON "Task";
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

-- UPDATE: Update tasks
DROP POLICY IF EXISTS "Users can update tasks" ON "Task";
CREATE POLICY "Users can update tasks" ON "Task"
FOR UPDATE
USING (
    "createdById" = auth.uid()::text
    OR "assignedToId" = auth.uid()::text
    OR "userId" = auth.uid()::text
    OR EXISTS (
        SELECT 1 FROM "TeamMember" tm
        WHERE tm."teamId" = "Task"."teamId"
        AND tm."userId" = auth.uid()::text
        AND tm."role" IN ('owner', 'admin')
        AND tm."status" = 'accepted'
    )
);

-- DELETE: Delete own created tasks
DROP POLICY IF EXISTS "Users can delete own created tasks" ON "Task";
CREATE POLICY "Users can delete own created tasks" ON "Task"
FOR DELETE
USING (
    "createdById" = auth.uid()::text
    OR ("userId" = auth.uid()::text AND "createdById" IS NULL)
);

-- =====================================================
-- STEP 5: TEAM RLS POLICIES
-- =====================================================

ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;

-- SELECT: View teams you're a member of
DROP POLICY IF EXISTS "Users can view their teams" ON "Team";
CREATE POLICY "Users can view their teams" ON "Team"
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM "TeamMember" tm
        WHERE tm."teamId" = "Team".id
        AND tm."userId" = auth.uid()::text
        AND tm."status" = 'accepted'
    )
);

-- INSERT: Create teams
DROP POLICY IF EXISTS "Users can create teams" ON "Team";
CREATE POLICY "Users can create teams" ON "Team"
FOR INSERT
WITH CHECK ("ownerId" = auth.uid()::text);

-- UPDATE: Owners can update
DROP POLICY IF EXISTS "Owners can update teams" ON "Team";
CREATE POLICY "Owners can update teams" ON "Team"
FOR UPDATE
USING ("ownerId" = auth.uid()::text);

-- DELETE: Owners can delete
DROP POLICY IF EXISTS "Owners can delete teams" ON "Team";
CREATE POLICY "Owners can delete teams" ON "Team"
FOR DELETE
USING ("ownerId" = auth.uid()::text);

-- =====================================================
-- STEP 6: TEAM MEMBER RLS POLICIES
-- =====================================================

ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;

-- SELECT: View team members
DROP POLICY IF EXISTS "Users can view team members" ON "TeamMember";
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

-- INSERT: Owners/admins can invite
DROP POLICY IF EXISTS "Owners and admins can invite members" ON "TeamMember";
CREATE POLICY "Owners and admins can invite members" ON "TeamMember"
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "TeamMember" tm
        WHERE tm."teamId" = "TeamMember"."teamId"
        AND tm."userId" = auth.uid()::text
        AND tm."role" IN ('owner', 'admin')
        AND tm."status" = 'accepted'
    )
);

-- UPDATE: Members can update their own membership
DROP POLICY IF EXISTS "Members can update own membership" ON "TeamMember";
CREATE POLICY "Members can update own membership" ON "TeamMember"
FOR UPDATE
USING ("userId" = auth.uid()::text);

-- DELETE: Owners/admins can remove members
DROP POLICY IF EXISTS "Owners and admins can remove members" ON "TeamMember";
CREATE POLICY "Owners and admins can remove members" ON "TeamMember"
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM "TeamMember" tm
        WHERE tm."teamId" = "TeamMember"."teamId"
        AND tm."userId" = auth.uid()::text
        AND tm."role" IN ('owner', 'admin')
        AND tm."status" = 'accepted'
    )
);

-- =====================================================
-- STEP 7: NOTE RLS POLICIES
-- =====================================================

ALTER TABLE "Note" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notes" ON "Note";
CREATE POLICY "Users can view own notes" ON "Note"
FOR SELECT
USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can create notes" ON "Note";
CREATE POLICY "Users can create notes" ON "Note"
FOR INSERT
WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own notes" ON "Note";
CREATE POLICY "Users can update own notes" ON "Note"
FOR UPDATE
USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own notes" ON "Note";
CREATE POLICY "Users can delete own notes" ON "Note"
FOR DELETE
USING ("userId" = auth.uid()::text);

-- =====================================================
-- STEP 8: NOTIFICATION RLS POLICIES
-- =====================================================

ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON "Notification";
CREATE POLICY "Users can view own notifications" ON "Notification"
FOR SELECT
USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can create notifications" ON "Notification";
CREATE POLICY "Users can create notifications" ON "Notification"
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON "Notification";
CREATE POLICY "Users can update own notifications" ON "Notification"
FOR UPDATE
USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own notifications" ON "Notification";
CREATE POLICY "Users can delete own notifications" ON "Notification"
FOR DELETE
USING ("userId" = auth.uid()::text);

-- =====================================================
-- STEP 9: AVATAR STORAGE SETUP
-- =====================================================

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Configure bucket
UPDATE storage.buckets
SET file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
WHERE id = 'avatars';

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Storage policies
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next steps:
-- 1. Set admin status: SELECT set_admin_status('your-email@example.com', true);
-- 2. Verify RLS: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- 3. Test authentication and data access
-- =====================================================
```

---

## RLS Policies Explained

### Task Policies

| Policy | Action | Who Can Access |
|--------|--------|----------------|
| **View tasks** | SELECT | • Task owner (`userId`)<br>• Assigned user (`assignedToId`)<br>• Task creator (`createdById`)<br>• Team members (if `teamId` set) |
| **Create tasks** | INSERT | • Anyone for personal tasks<br>• Team owners/admins for team tasks |
| **Update tasks** | UPDATE | • Task creator<br>• Assigned user<br>• Task owner<br>• Team owners/admins |
| **Delete tasks** | DELETE | • Only task creator<br>• Task owner (for old tasks without `createdById`) |

### Team Policies

| Policy | Action | Who Can Access |
|--------|--------|----------------|
| **View teams** | SELECT | • Team members with `accepted` status |
| **Create teams** | INSERT | • Any authenticated user |
| **Update teams** | UPDATE | • Team owner only |
| **Delete teams** | DELETE | • Team owner only |

### TeamMember Policies

| Policy | Action | Who Can Access |
|--------|--------|----------------|
| **View members** | SELECT | • The member themselves<br>• Other members of the same team |
| **Invite members** | INSERT | • Team owners<br>• Team admins |
| **Update membership** | UPDATE | • The member themselves (to accept/decline) |
| **Remove members** | DELETE | • Team owners<br>• Team admins |

### Profile Policies

| Policy | Action | Who Can Access |
|--------|--------|----------------|
| **View profiles** | SELECT | • Everyone (public read) |
| **Create profile** | INSERT | • Users can create their own profile |
| **Update profile** | UPDATE | • Users can update their own profile<br>• Admins have full access |
| **Delete profile** | DELETE | • Admins only |

### Note Policies

| Policy | Action | Who Can Access |
|--------|--------|----------------|
| **View notes** | SELECT | • Note owner only |
| **Create notes** | INSERT | • Any authenticated user |
| **Update notes** | UPDATE | • Note owner only |
| **Delete notes** | DELETE | • Note owner only |

### Notification Policies

| Policy | Action | Who Can Access |
|--------|--------|----------------|
| **View notifications** | SELECT | • Notification recipient only |
| **Create notifications** | INSERT | • Anyone (for system notifications) |
| **Update notifications** | UPDATE | • Notification recipient (mark as read) |
| **Delete notifications** | DELETE | • Notification recipient only |

---

## Storage Setup

### Avatar Storage Structure

```
avatars/
└── {userId}/
    ├── {timestamp1}.jpg
    ├── {timestamp2}.png
    └── {timestamp3}.webp
```

### Storage Policies

- **Upload**: Users can only upload to their own folder (`avatars/{userId}/`)
- **Update**: Users can only update files in their own folder
- **Delete**: Users can only delete files in their own folder
- **View**: Anyone can view all avatars (public bucket)

### File Constraints

- **Max file size**: 2MB (2,097,152 bytes)
- **Allowed types**: PNG, JPEG, JPG, GIF, WebP
- **Path structure**: `avatars/{userId}/{timestamp}.{ext}`

### Upload Example

```typescript
const file = avatarFile;
const userId = session.user.id;
const timestamp = Date.now();
const ext = file.name.split('.').pop();
const filePath = `${userId}/${timestamp}.${ext}`;

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(filePath, file);
```

---

## Admin Setup

### Making Users Admins

```sql
-- Set admin status
SELECT set_admin_status('admin@example.com', true);

-- Remove admin status
SELECT set_admin_status('user@example.com', false);
```

### Verify Admin Users

```sql
SELECT 
  email, 
  raw_user_meta_data->>'isAdmin' as is_admin 
FROM auth.users 
WHERE (raw_user_meta_data->>'isAdmin')::boolean = true;
```

### Admin Function

The `is_admin()` function checks user metadata:

```sql
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (raw_user_meta_data->>'isAdmin')::boolean,
    false
  )
  FROM auth.users
  WHERE id = user_id;
$$;
```

### Admin Permissions

Admins have full access to:
- ✅ All user profiles
- ✅ All teams and members
- ✅ All tasks and notes
- ✅ All notifications
- ✅ User management API routes

---

## Troubleshooting

### RLS Not Working

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Enable RLS if missing
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
-- ... etc
```

### Can't Upload Avatars

```sql
-- Verify bucket exists
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- Check storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- Recreate bucket if needed
DELETE FROM storage.buckets WHERE id = 'avatars';
-- Then rerun storage setup section
```

### Tasks Not Showing

```sql
-- Check task policies
SELECT * FROM pg_policies WHERE tablename = 'Task';

-- Test query as specific user
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM "Task";
```

### Admin Function Not Working

```sql
-- Verify function exists
SELECT proname FROM pg_proc WHERE proname = 'is_admin';

-- Test function
SELECT is_admin('user-uuid-here'::uuid);

-- Check user metadata
SELECT raw_user_meta_data FROM auth.users WHERE id = 'user-uuid-here';
```

### Reset All Policies

```sql
-- Drop all policies on a table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'Task'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "Task"';
    END LOOP;
END $$;

-- Then rerun the policy creation for that table
```

---

## Maintenance

### Backup Database

```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Using pg_dump
pg_dump $DATABASE_URL > backup.sql
```

### Restore Database

```bash
# Using psql
psql $DATABASE_URL < backup.sql
```

### Monitor Performance

```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Visual Database Schema

### Tables Overview

![Database Schema](https://via.placeholder.com/800x600.png?text=Database+Schema+Diagram)

*Note: Replace with actual ERD diagram image*

### RLS Policy Flow

```
User Request
    │
    ▼
┌─────────────────┐
│  Supabase Auth  │
│  Validates JWT  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   RLS Policies  │
│  Check Access   │
└────────┬────────┘
         │
         ├─ ✅ Allowed  ──→  Return Data
         │
         └─ ❌ Denied   ──→  Empty Result
```

---

**Database Setup Complete! 🎉**

For questions or issues, check the [main README](./README.md) or open an issue on GitHub.
