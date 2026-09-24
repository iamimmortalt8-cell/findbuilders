import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Category } from '../types/index.js';

export class CategoryService {
  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      throw new AppError(500, error.message);
    }

    return data as Category[];
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }

    return data as Category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      return null;
    }

    return data as Category;
  }

  async createCategory(category: Omit<Category, 'id' | 'created_at' | 'product_count'>): Promise<Category> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({ ...category, product_count: 0 })
      .select()
      .single();

    if (error) {
      throw new AppError(400, error.message);
    }

    return data as Category;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(400, error.message);
    }

    return data as Category;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
    if (error) {
      throw new AppError(400, error.message);
    }
  }
}