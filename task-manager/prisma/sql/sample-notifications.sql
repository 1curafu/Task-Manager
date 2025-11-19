-- Sample notifications for testing
-- Replace 'YOUR_USER_ID' with your actual user ID from Supabase Auth

-- Welcome notification
INSERT INTO "Notification" ("userId", "type", "title", "message", "isRead", "createdAt")
VALUES 
  ('4f53e3d8-7ff3-40b0-a976-bd289a351bc6', 'system', 'Welcome to Vela! 🎉', 'Thanks for joining! Start by creating your first task or note.', false, NOW());

-- Task reminder
INSERT INTO "Notification" ("userId", "type", "title", "message", "isRead", "createdAt")
VALUES 
  ('4f53e3d8-7ff3-40b0-a976-bd289a351bc6', 'task_reminder', 'Task due soon ⏰', 'You have 3 tasks due today. Check your dashboard to stay on track!', false, NOW() - INTERVAL '2 hours');

-- System update
INSERT INTO "Notification" ("userId", "type", "title", "message", "isRead", "createdAt")
VALUES 
  ('4f53e3d8-7ff3-40b0-a976-bd289a351bc6', 'system', 'New feature: Inbox 📬', 'We added an inbox to keep you updated on tasks, invites, and system updates!', true, NOW() - INTERVAL '1 day');

-- How to get your user ID:
-- 1. Go to Supabase Dashboard
-- 2. Authentication > Users
-- 3. Copy your User UID
-- 4. Replace 'YOUR_USER_ID' above with your actual UID
-- 5. Run this SQL in Supabase SQL Editor
