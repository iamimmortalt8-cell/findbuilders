-- ==============================================================================
-- FindBuilders Follows System Schema
-- ==============================================================================

-- 1. Create the follows table
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);

-- 2. Prevent users from following themselves
ALTER TABLE public.follows ADD CONSTRAINT cannot_follow_self CHECK (follower_id != following_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies

-- Anyone can read followers and following relationships
CREATE POLICY "Anyone can read follows"
    ON public.follows FOR SELECT
    USING (true);

-- Authenticated users can insert their own follows
CREATE POLICY "Users can follow others"
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

-- Authenticated users can delete their own follows
CREATE POLICY "Users can unfollow"
    ON public.follows FOR DELETE
    USING (auth.uid() = follower_id);

-- 5. Add indexes for performance (to quickly lookup followers/following)
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
