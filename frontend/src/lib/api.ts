import type { Product, Category, Profile, Comment, AdminStats, ProductFilters, ProductSubmission } from "@/lib/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ApiClient {
  private refreshPromise: Promise<{ accessToken: string }> | null = null;

  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async parseBody(response: Response): Promise<any> {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  private toError(response: Response, data: any): Error {
    const message =
      data?.error ||
      data?.message ||
      (response.ok ? 'Request failed' : `Request failed with status ${response.status}`);
    const err: any = new Error(message);
    err.status = response.status;
    return err;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
    });

    const data = await this.parseBody(response);

    if (!response.ok) {
      throw this.toError(response, data);
    }

    return data?.data;
  }

  private async requestFull<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
    });

    const data = await this.parseBody(response);

    if (!response.ok) {
      throw this.toError(response, data);
    }

    return data;
  }

  private async requestForm<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await this.parseBody(response);

    if (!response.ok) {
      throw this.toError(response, data);
    }

    return data?.data;
  }

  // Auth
  async signUp(email: string, password: string, displayName: string): Promise<{ access_token: string; refresh_token: string }> {
    return this.request<{ access_token: string; refresh_token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  }

  async signIn(email: string, password: string): Promise<{ access_token: string; refresh_token: string }> {
    return this.request<{ access_token: string; refresh_token: string }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signInWithGoogle(): Promise<{ url: string }> {
    return this.request<{ url: string }>('/auth/oauth/google', { method: 'POST' });
  }

  async exchangeSupabaseToken(supabaseAccessToken: string): Promise<{ access_token: string; refresh_token: string }> {
    return this.request<{ access_token: string; refresh_token: string }>('/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ supabaseAccessToken }),
    });
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const data = await this.request<{ accessToken?: string; access_token?: string }>('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
        const newToken = data.accessToken || data.access_token || '';
        if (newToken) {
          localStorage.setItem('access_token', newToken);
        }
        return { accessToken: newToken };
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async getMe(): Promise<{ id: string; email: string }> {
    return this.request('/auth/me');
  }

  async signOut(): Promise<void> {
    return this.request('/auth/signout', { method: 'POST' });
  }

  async deleteAccount(): Promise<{ deleted: boolean }> {
    return this.request('/account', {
      method: 'DELETE',
      body: JSON.stringify({ confirmation: 'DELETE' }),
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.request('/categories');
  }

  // Products
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.append(key, String(value));
    });
    return this.requestFull(`/products?${params.toString()}`);
  }

  async getProduct(id: string): Promise<Product> {
    return this.request(`/products/${id}`);
  }

  async getMyProducts(): Promise<Product[]> {
    return this.request('/products/my-products');
  }

  async submitProduct(submission: ProductSubmission): Promise<Product> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return this.request(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  async uploadProductImage(productId: string, file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.requestForm<{ imageUrl: string }>(`/products/${productId}/image`, formData);
  }

  async uploadProductScreenshots(productId: string, files: File[]): Promise<{ screenshots: string[] }> {
    const formData = new FormData();
    files.forEach(file => formData.append('screenshots', file));
    return this.requestForm<{ screenshots: string[] }>(`/products/${productId}/screenshots`, formData);
  }

  async getProductImages(productId: string): Promise<Array<{ id: string; product_id: string; image_url: string; display_order: number; created_at: string }>> {
    return this.request(`/products/${productId}/images`);
  }

  async deleteProductImage(imageId: string): Promise<void> {
    return this.request(`/products/images/${imageId}`, { method: 'DELETE' });
  }

  // Votes
  async toggleVote(productId: string): Promise<{ voted: boolean; count: number }> {
    return this.request(`/products/${productId}/vote`, { method: 'POST' });
  }

  async checkVote(productId: string): Promise<{ voted: boolean; count: number }> {
    return this.request(`/products/${productId}/vote`);
  }

  // Comments
  async getComments(productId: string): Promise<Comment[]> {
    return this.request(`/products/${productId}/comments`);
  }

  async addComment(productId: string, content: string): Promise<Comment> {
    return this.request(`/products/${productId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async updateComment(commentId: string, content: string): Promise<Comment> {
    return this.request(`/products/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    return this.request(`/products/comments/${commentId}`, { method: 'DELETE' });
  }

  // Profiles
  async getMyProfile(): Promise<Profile> {
    return this.request('/profiles/me');
  }

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    return this.request('/profiles/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.requestForm<{ avatarUrl: string }>('/profiles/me/avatar', formData);
  }

  async searchProfiles(query: string, limit = 8): Promise<Profile[]> {
    if (!query || !query.trim()) return [];
    try {
      const params = new URLSearchParams({ q: query.trim(), limit: limit.toString() });
      return await this.request<Profile[]>(`/profiles/search?${params.toString()}`);
    } catch (err) {
      console.error('API searchProfiles failed:', err);
      return [];
    }
  }

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    return this.request('/admin/stats');
  }

  async getAdminUsers(): Promise<Profile[]> {
    return this.request('/admin/users');
  }

  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<Profile> {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    return this.request(`/admin/users/${userId}`, { method: 'DELETE' });
  }

  async getAdminProducts(filters: { status?: string } = {}): Promise<Product[]> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    return this.request(`/admin/products?${params.toString()}`);
  }

  async getPendingSubmissions(): Promise<Product[]> {
    return this.request('/admin/submissions');
  }

  async getSubmission(id: string): Promise<Product> {
    return this.request(`/admin/submissions/${id}`);
  }

  async approveProduct(id: string): Promise<Product> {
    return this.request(`/admin/submissions/${id}/approve`, { method: 'POST' });
  }

  async rejectProduct(id: string, reason: string): Promise<Product> {
    return this.request(`/admin/submissions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async deleteProductAdmin(id: string): Promise<void> {
    return this.request(`/admin/products/${id}`, { method: 'DELETE' });
  }

  // AI & Support
  async sendAIChat(messages: any[], context?: string): Promise<any> {
    return this.requestFull('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, context }),
    });
  }

  async sendSupportMessage(data: { name: string; email: string; subject: string; message: string }): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.requestFull('/support/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

}

import { supabase } from './supabase';

export const fetchProducts = async (filters: ProductFilters = {}) => {
  let query = supabase.from('products').select('*, category:categories(*), maker:profiles(id, display_name, avatar_url)', { count: 'exact' });
  
  // By default, only fetch approved products for public explore
  if (!filters.status) {
    query = query.eq('status', 'approved');
  } else {
    query = query.eq('status', filters.status);
  }
  
  const rawSearch = filters.search?.trim();
  if (rawSearch) {
    const cleanSearch = rawSearch.replace(/[,()]/g, ' ').trim();
    if (cleanSearch) {
      // Find matching categories
      const { data: matchedCategories } = await supabase
        .from('categories')
        .select('id')
        .or(`name.ilike.%${cleanSearch}%,slug.ilike.%${cleanSearch}%`);

      const matchingCategoryIds = (matchedCategories || []).map((c: any) => c.id);

      const orConditions = [
        `name.ilike.%${cleanSearch}%`,
        `tagline.ilike.%${cleanSearch}%`,
        `description.ilike.%${cleanSearch}%`
      ];

      matchingCategoryIds.forEach((catId: string) => {
        orConditions.push(`category_id.eq.${catId}`);
      });

      query = query.or(orConditions.join(','));
    }
  }
  if (filters.category) {
    query = query.eq('category_id', filters.category);
  }
  if (filters.sort === 'popular') {
    query = query.order('upvotes_count', { ascending: false });
  } else if (filters.sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else {
    query = query.order('created_at', { ascending: false });
  }
  
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);
  
  const { data, count, error } = await query;
  if (error) throw error;
  
  return {
    data: data as Product[],
    count: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
};

export const fetchProduct = async (id: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), maker:profiles(id, display_name, avatar_url, bio)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Product;
};

export const fetchUserProducts = async (userId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('maker_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Product[];
};

export const submitProduct = (submission: ProductSubmission, userId: string) => api.submitProduct(submission);
export const updateProduct = (id: string, updates: Partial<Product>) => api.updateProduct(id, updates);
export const deleteProduct = (id: string) => api.deleteProduct(id);

export const fetchCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data as Category[];
};

export const toggleVote = async (productId: string, userId: string) => {
  // First check if vote exists
  const { data: existing } = await supabase.from('votes').select('*').eq('product_id', productId).eq('user_id', userId).single();
  
  if (existing) {
    await supabase.from('votes').delete().eq('product_id', productId).eq('user_id', userId);
    return false;
  } else {
    await supabase.from('votes').insert({ product_id: productId, user_id: userId });
    return true;
  }
};

export const checkUserVote = async (productId: string, userId: string) => {
  const { data } = await supabase.from('votes').select('id').eq('product_id', productId).eq('user_id', userId).single();
  return !!data;
};

export const fetchComments = async (productId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*, user:profiles(id, display_name, avatar_url, bio)')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Comment[];
};

export const addComment = async (productId: string, userId: string, content: string) => {
  const { data, error } = await supabase
    .from('comments')
    .insert({ product_id: productId, user_id: userId, content })
    .select('*, user:profiles(id, display_name, avatar_url, bio)')
    .single();
  if (error) throw error;
  return data as Comment;
};

export const deleteComment = async (id: string) => {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
};

export const getProductImages = async (productId: string) => {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('display_order');
  if (error) throw error;
  return data as Array<{ id: string; product_id: string; image_url: string; display_order: number; created_at: string }>;
};

export const fetchAdminProducts = (status?: string) => api.getAdminProducts({ status });
export const approveProduct = (id: string) => api.approveProduct(id);
export const rejectProduct = (id: string, reason: string) => api.rejectProduct(id, reason);
export const fetchAdminStats = () => api.getAdminStats();
export const fetchAllProfiles = () => api.getAdminUsers();
export const searchProfiles = (query: string, limit = 8) => api.searchProfiles(query, limit);

export const api = new ApiClient();