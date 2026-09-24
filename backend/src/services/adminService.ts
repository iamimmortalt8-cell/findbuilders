import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AdminStats, Profile, Product } from '../types/index.js';

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

  async getAllUsers(): Promise<Profile[]> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, avatar_url, role, bio, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(500, error.message);
    }

    return data as Profile[];
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