import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AdminStats, Profile, Product } from '../types/index.js';

// Safely parse bio JSON to extract structured fields
function parseBioJson(bio: string | null): {
  username?: string;
  headline?: string;
  bioText?: string;
  interests?: string[];
  links?: Array<{ title: string; url: string }>;
} {
  if (!bio) return {};
  try {
    const parsed = typeof bio === 'object' ? bio : JSON.parse(bio);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        username: typeof parsed.username === 'string' ? parsed.username : undefined,
        headline: typeof parsed.headline === 'string' ? parsed.headline : undefined,
        bioText: typeof parsed.bioText === 'string' ? parsed.bioText : (typeof parsed.bio === 'string' ? parsed.bio : undefined),
        interests: Array.isArray(parsed.interests) ? parsed.interests.filter((i: unknown) => typeof i === 'string') : undefined,
        links: Array.isArray(parsed.links) ? parsed.links.filter((l: any) => l && typeof l.url === 'string').map((l: any) => ({
          title: (l.title || l.label || l.name || l.url || '').toString().slice(0, 200),
          url: l.url.toString().slice(0, 500),
        })) : undefined,
      };
    }
  } catch { /* legacy plain-text bio — ignore parse error */ }
  return { bioText: bio };
}

export interface AdminUserView {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  bio: string | null;
  created_at: string;
  // Extracted from bio JSON
  username?: string;
  headline?: string;
  // From auth user
  email?: string;
}

export class AdminService {
  async getStats(): Promise<AdminStats> {
    const [products, users, votes, comments] = await Promise.all([
      supabaseAdmin.from('products').select('status', { count: 'exact' }),
      supabaseAdmin.from('profiles').select('id', { count: 'exact' }),
      supabaseAdmin.from('votes').select('id', { count: 'exact' }),
      supabaseAdmin.from('comments').select('id', { count: 'exact' }),
    ]);

    const allProducts = products.data || [];

    return {
      total_products: products.count || 0,
      pending_products: allProducts.filter((p: { status: string }) => p.status === 'pending').length,
      approved_products: allProducts.filter((p: { status: string }) => p.status === 'approved').length,
      rejected_products: allProducts.filter((p: { status: string }) => p.status === 'rejected').length,
      total_users: users.count || 0,
      total_votes: votes.count || 0,
      total_comments: comments.count || 0,
    };
  }

  async getAllUsers(): Promise<AdminUserView[]> {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, avatar_url, role, bio, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(500, error.message);
    }

    // Fetch auth users to get emails and metadata names
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const authMap = new Map<string, { email?: string; name?: string }>();
    if (authData?.users) {
      for (const u of authData.users) {
        const meta = u.user_metadata || {};
        authMap.set(u.id, {
          email: u.email,
          name: meta.display_name || meta.full_name || meta.name || undefined,
        });
      }
    }

    return (profiles || []).map((p: any) => {
      const parsed = parseBioJson(p.bio);
      const authUser = authMap.get(p.id);

      // Resolve display name with priority chain
      let resolvedName = p.display_name;
      if (!resolvedName || resolvedName.trim() === '') {
        resolvedName = authUser?.name || parsed.username || (authUser?.email?.split('@')[0]) || 'Unnamed User';
      }

      return {
        id: p.id,
        display_name: resolvedName,
        avatar_url: p.avatar_url,
        role: p.role,
        bio: p.bio,
        created_at: p.created_at,
        username: parsed.username,
        headline: parsed.headline,
        email: authUser?.email,
      };
    });
  }

  async getUserById(userId: string): Promise<AdminUserView & { bioText?: string; interests?: string[]; links?: Array<{ title: string; url: string }> }> {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw new AppError(404, 'User not found');
    }

    // Get auth user for email
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = authData?.user?.email;
    const meta = authData?.user?.user_metadata || {};
    const metaName = meta.display_name || meta.full_name || meta.name;

    const parsed = parseBioJson(profile.bio);

    let resolvedName = profile.display_name;
    if (!resolvedName || resolvedName.trim() === '') {
      resolvedName = metaName || parsed.username || (email?.split('@')[0]) || 'Unnamed User';
    }

    return {
      id: profile.id,
      display_name: resolvedName,
      avatar_url: profile.avatar_url,
      role: profile.role,
      bio: profile.bio,
      created_at: profile.created_at,
      username: parsed.username,
      headline: parsed.headline,
      bioText: parsed.bioText,
      interests: parsed.interests,
      links: parsed.links,
      email,
    };
  }

  // Whitelist of editable profile fields for admin
  private static readonly EDITABLE_FIELDS = ['display_name', 'bio', 'avatar_url', 'role'] as const;

  async updateUserProfile(userId: string, updates: Record<string, unknown>): Promise<Profile> {
    // Strict field whitelisting — never spread raw request body
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof updates.display_name === 'string') {
      const name = updates.display_name.trim().slice(0, 50);
      if (name.length === 0) throw new AppError(400, 'Display name cannot be empty');
      dbUpdates.display_name = name;
    }

    if (typeof updates.bio === 'string') {
      if (updates.bio.length > 3000) throw new AppError(400, 'Bio is too long (max 3000 characters)');
      dbUpdates.bio = updates.bio;
    }

    if (typeof updates.role === 'string') {
      if (updates.role !== 'user' && updates.role !== 'admin') {
        throw new AppError(400, 'Role must be "user" or "admin"');
      }
      dbUpdates.role = updates.role;
    }

    if (typeof updates.avatar_url === 'string' || updates.avatar_url === null) {
      dbUpdates.avatar_url = updates.avatar_url;
    }

    // Must have at least one real update besides updated_at
    if (Object.keys(dbUpdates).length <= 1) {
      throw new AppError(400, 'No valid fields to update');
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(dbUpdates as any)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError(400, error.message);
    }

    return data as Profile;
  }

  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<Profile> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError(400, error.message);
    }

    return data as Profile;
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      throw new AppError(400, error.message);
    }
  }

  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, category:categories(*), maker:profiles(id, display_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(500, error.message);
    }

    return data as Product[];
  }

  async getPendingSubmissions(): Promise<Product[]> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, category:categories(*), maker:profiles(id, display_name, avatar_url)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(500, error.message);
    }

    return data as Product[];
  }
}