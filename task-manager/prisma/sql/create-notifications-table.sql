-- Create Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");

-- Enable Row Level Security (RLS)
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON "Notification"
    FOR SELECT
    USING (auth.uid()::text = "userId");

-- Users can only insert their own notifications
CREATE POLICY "Users can insert own notifications" ON "Notification"
    FOR INSERT
    WITH CHECK (auth.uid()::text = "userId");

-- Users can only update their own notifications
CREATE POLICY "Users can update own notifications" ON "Notification"
    FOR UPDATE
    USING (auth.uid()::text = "userId");

-- Users can only delete their own notifications
CREATE POLICY "Users can delete own notifications" ON "Notification"
    FOR DELETE
    USING (auth.uid()::text = "userId");
