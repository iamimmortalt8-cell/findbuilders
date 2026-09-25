-- ==============================================================================
-- FindBuilders Email Events Schema (Persistent Idempotency Guard)
-- Run this in the Supabase SQL Editor
-- ==============================================================================

-- 1. Create email_events table
CREATE TABLE IF NOT EXISTS public.email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_key TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL CHECK (event_type IN ('WELCOME', 'PRODUCT_SUBMITTED', 'PRODUCT_APPROVED', 'PRODUCT_REJECTED')),
    recipient TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENDING', 'SENT', 'FAILED')),
    provider_message_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Indexes for fast status lookups and audit queries
CREATE INDEX IF NOT EXISTS idx_email_events_status ON public.email_events(status);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON public.email_events(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- 4. Admins can view email events for auditing
CREATE POLICY "Admins can view email events"
    ON public.email_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
