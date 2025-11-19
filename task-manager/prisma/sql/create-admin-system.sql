-- =====================================================
-- ADMIN SYSTEM SETUP
-- =====================================================
-- This file creates the admin role system for the application
-- Run this in Supabase SQL Editor

-- 1. Create helper function to check if a user is an admin
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

-- 2. Create function to set admin status (for initial setup)
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

-- 3. Example: Set admin status for specific users
-- IMPORTANT: Replace with your actual admin email(s)
-- SELECT set_admin_status('your-admin@email.com', true);
-- SELECT set_admin_status('another-admin@email.com', true);

-- 4. Verify admin users
-- SELECT email, raw_user_meta_data->>'isAdmin' as is_admin 
-- FROM auth.users 
-- WHERE (raw_user_meta_data->>'isAdmin')::boolean = true;
