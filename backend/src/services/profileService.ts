import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Profile } from '../types/index.js';

export class ProfileService {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return null;
    }

    return data as Profile;
  }

  async getPublicProfile(userId: string): Promise<Partial<Profile> | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, avatar_url, bio, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.display_name !== undefined) dbUpdates.display_name = updates.display_name;
    if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.role !== undefined) dbUpdates.role = updates.role;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError(400, error.message);
    }

    return data as Profile;
  }

  async checkUsername(username: string, excludeUserId?: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
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
          return true; // Taken
        }
      } catch (e) {}
    }
    return false; // Available
  }

  async searchProfiles(query: string, limit = 10): Promise<Partial<Profile>[]> {
    if (!query || !query.trim()) return [];
    const cleanQ = query.trim().replace(/^@/, '');
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, avatar_url, bio, created_at')
      .or(`display_name.ilike.%${cleanQ}%,bio.ilike.%${cleanQ}%`)
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data;
  }
}