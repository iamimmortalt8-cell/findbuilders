import { supabase } from './supabase';
import type { Profile, Product } from './types';
import { api } from './api';

export const supabaseProfileService = {
    // --- Profile Data ---
    async getProfile(userId: string): Promise<Profile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
        return data as Profile;
    },

    async getPublicProfile(userId: string): Promise<Profile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, bio, created_at')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
        return data as Profile;
    },

    async updateProfile(updates: Partial<Profile>): Promise<Profile> {
        try {
            return await api.updateProfile(updates);
        } catch (error: any) {
            throw new Error(error.message || "Failed to update profile");
        }
    },

    async checkUsername(username: string, excludeUserId?: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, bio')
            .ilike('bio', `%"username":"${username}"%`);

        if (error || !data) return false;

        for (const profile of data) {
            if (excludeUserId && profile.id === excludeUserId) continue;
            if (!profile.bio) continue;
            try {
                const parsed = JSON.parse(profile.bio);
                if (parsed.username && parsed.username.toLowerCase() === username.toLowerCase()) {
                    return true;
                }
            } catch (e) {
                // ignore
            }
        }
        return false;
    },

    async searchProfiles(query: string, limit = 8): Promise<Profile[]> {
        if (!query || !query.trim()) return [];
        const cleanQ = query.trim().replace(/^@/, '');
        const { data, error } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, bio, created_at')
            .or(`display_name.ilike.%${cleanQ}%,bio.ilike.%${cleanQ}%`)
            .limit(limit);

        if (error || !data) {
            console.error('supabaseProfileService.searchProfiles error:', error);
            return [];
        }
        return data as Profile[];
    },

    // --- Avatar Storage ---
    async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
        // 1MB limit check
        if (file.size > 1024 * 1024) {
            throw new Error("File size must be less than 1 MB");
        }
        try {
            return await api.uploadAvatar(file);
        } catch (error: any) {
            throw new Error(error.message || "Failed to upload avatar");
        }
    },

    async deleteAvatar(): Promise<void> {
        // Optional placeholder if we need it
    },

    // --- Products ---
    async getUserPublicProducts(userId: string): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                category:categories(id, name, slug)
            `)
            .eq('maker_id', userId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data as Product[];
    },

    // --- Follow System ---
    async followUser(followingId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        if (user.id === followingId) throw new Error("Cannot follow yourself");

        const { error } = await supabase
            .from('follows')
            .insert({ follower_id: user.id, following_id: followingId });

        if (error) {
            if (error.code === '23505') return; // already following
            throw new Error(error.message);
        }
    },

    async unfollowUser(followingId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', followingId);

        if (error) throw new Error(error.message);
    },

    async getFollowStats(userId: string, currentUserId?: string) {
        // Run concurrent counts
        const [followersRes, followingRes] = await Promise.all([
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
            supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
        ]);

        let isFollowing = false;
        if (currentUserId) {
            const { data } = await supabase.from('follows')
                .select('created_at')
                .eq('follower_id', currentUserId)
                .eq('following_id', userId)
                .single();
            isFollowing = !!data;
        }

        return {
            followersCount: followersRes.count || 0,
            followingCount: followingRes.count || 0,
            isFollowing
        };
    },

    async getFollowers(userId: string): Promise<Partial<Profile>[]> {
        const { data: follows, error } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', userId);

        if (error || !follows) return [];
        const ids = follows.map(f => f.follower_id);
        if (ids.length === 0) return [];

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, bio, created_at')
            .in('id', ids);

        return profiles || [];
    },

    async getFollowing(userId: string): Promise<Partial<Profile>[]> {
        const { data: follows, error } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId);

        if (error || !follows) return [];
        const ids = follows.map(f => f.following_id);
        if (ids.length === 0) return [];

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, bio, created_at')
            .in('id', ids);

        return profiles || [];
    }
};
