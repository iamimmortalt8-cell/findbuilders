import type { Product, Category, Profile, Comment, AdminStats, ProductFilters, ProductSubmission } from "@/lib/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

import { ApiError, isTokenExpired } from './api-error.ts';
export { ApiError, isTokenExpired };

interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuthRefresh?: boolean;
  _retryCount?: number;
}

class ApiClient {
  private refreshPromise: Promise<{ accessToken: string }> | null = null;

  private async ensureValidToken(): Promise<string | null> {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (token && !isTokenExpired(token, 30)) {
      return token;
    }

    if (refreshToken) {
      try {
        const { accessToken } = await this.refreshToken(refreshToken);
        return accessToken;
      } catch {
        return null;
      }
    }

    return null;
  }

  private async getAuthHeader(skipRefresh = false): Promise<Record<string, string>> {
    const token = skipRefresh ? localStorage.getItem('access_token') : await this.ensureValidToken();
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

  private toError(response: Response, data: any): ApiError {
    const rawMessage = data?.error || data?.message;
    let message = rawMessage;

    if (!message) {
      switch (response.status) {
        case 400:
          message = 'Invalid request. Please check your submission.';
          break;
        case 401:
          message = 'Your session expired. Please sign in again to continue.';
          break;
        case 403:
          message = 'You do not have permission to perform this action.';
          break;
        case 404:
          message = 'The requested resource was not found.';
          break;
        case 409:
          message = 'A duplicate record already exists.';
          break;
        case 422:
          message = 'Validation failed. Please check your input.';
          break;
        case 429:
          message = 'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
          message = 'An unexpected server error occurred. Please try again.';
          break;
        case 502:
        case 503:
        case 504:
          message = 'Service temporarily unavailable. Please try again shortly.';
          break;
        default:
          message = response.ok ? 'Request failed' : `Request failed with status ${response.status}`;
      }
    } else if (response.status === 401) {
      message = 'Your session expired. Please sign in again to continue.';
    }

    return new ApiError(message, {
      status: response.status,
      details: data?.details,
      isAuthExpired: response.status === 401,
    });
  }

  private async fetchWithTimeout(url: string, options: RequestOptions = {}): Promise<Response> {
    const timeoutMs = options.timeoutMs || (options.body instanceof FormData ? 60000 : 30000);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        throw new ApiError('No internet connection. Please check your network and try again.', {
          isNetworkError: true,
        });
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        throw new ApiError('Request timed out. The server may still be processing your request. Please check before retrying.', {
          isTimeout: true,
        });
      }
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err.message || 'Unable to connect to the server. Please check your connection.', {
        isNetworkError: true,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const skipRefresh = options.skipAuthRefresh || false;
    const authHeaders = await this.getAuthHeader(skipRefresh);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await this.fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await this.parseBody(response);

    if (response.status === 401 && !skipRefresh && (options._retryCount || 0) < 1) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          await this.refreshToken(refreshToken);
          return await this.request<T>(endpoint, {
            ...options,
            _retryCount: (options._retryCount || 0) + 1,
          });
        } catch {
          // Refresh failed; throw toError
        }
      }
    }

    if (!response.ok) {
      throw this.toError(response, data);
    }

    return data?.data;
  }

  private async requestFull<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const skipRefresh = options.skipAuthRefresh || false;
    const authHeaders = await this.getAuthHeader(skipRefresh);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await this.fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await this.parseBody(response);

    if (response.status === 401 && !skipRefresh && (options._retryCount || 0) < 1) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          await this.refreshToken(refreshToken);
          return await this.requestFull<T>(endpoint, {
            ...options,
            _retryCount: (options._retryCount || 0) + 1,
          });
        } catch {
          // Fall through
        }
      }
    }

    if (!response.ok) {
      throw this.toError(response, data);
    }

    return data;
  }

  private async requestForm<T>(endpoint: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
    const token = await this.ensureValidToken();
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const headers: Record<string, string> = {
      ...authHeaders,
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await this.fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'POST',
      headers,
      body: formData,
      timeoutMs: options.timeoutMs || 60000,
    });

    const data = await this.parseBody(response);

    if (response.status === 401 && (options._retryCount || 0) < 1) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          await this.refreshToken(refreshToken);
          return await this.requestForm<T>(endpoint, formData, {
            ...options,
            _retryCount: (options._retryCount || 0) + 1,
          });
        } catch {
          // Fall through
        }
      }
    }

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
      skipAuthRefresh: true,
    });
  }

  async signIn(email: string, password: string): Promise<{ access_token: string; refresh_token: string }> {
    return this.request<{ access_token: string; refresh_token: string }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuthRefresh: true,
    });
  }

  async signInWithGoogle(): Promise<{ url: string }> {
    return this.request<{ url: string }>('/auth/oauth/google', { method: 'POST', skipAuthRefresh: true });
  }

  async exchangeSupabaseToken(supabaseAccessToken: string): Promise<{ access_token: string; refresh_token: string }> {
    return this.request<{ access_token: string; refresh_token: string }>('/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ supabaseAccessToken }),
      skipAuthRefresh: true,
    });
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await this.fetchWithTimeout(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
          skipAuthRefresh: true,
          timeoutMs: 15000,
        });

        const data = await this.parseBody(response);

        if (!response.ok) {
          if (response.status >= 400 && response.status < 500) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('findbuilders:auth_expired'));
            }
          }
          throw this.toError(response, data);
        }

        const newToken = data?.data?.accessToken || data?.data?.access_token || data?.accessToken || data?.access_token || '';
        if (newToken) {
          localStorage.setItem('access_token', newToken);
        }
        return { accessToken: newToken };
      } catch (err: any) {
        if (err?.status >= 400 && err?.status < 500) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('findbuilders:auth_expired'));
          }
        }
        throw err;
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

  async getAdminUsers(): Promise<any[]> {
    return this.request('/admin/users');
  }

  async getAdminUser(userId: string): Promise<any> {
    return this.request(`/admin/users/${userId}`);
  }

  async updateAdminUserProfile(userId: string, updates: Record<string, unknown>): Promise<any> {
    return this.request(`/admin/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
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
  try {
    return await api.getProduct(id);
  } catch (err: any) {
    // If backend returns an error or is unreachable, fallback to public Supabase query
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*), maker:profiles(id, display_name, avatar_url, bio)')
      .eq('id', id)
      .single();
    if (error) throw err || error;
    return data as Product;
  }
};

export const fetchUserProducts = async (userId: string) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    try {
      return await api.getMyProducts();
    } catch (e) {
      console.warn('[api] Failed to fetch via /my-products, falling back to public query:', e);
    }
  }

  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('maker_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Product[];
};

export const submitProduct = (submission: ProductSubmission, _userId?: string) => api.submitProduct(submission);
export const updateProduct = (id: string, updates: Partial<Product>) => api.updateProduct(id, updates);
export const deleteProduct = (id: string) => api.deleteProduct(id);

export const fetchCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data as Category[];
};

export const toggleVote = async (productId: string, _userId?: string) => {
  const res = await api.toggleVote(productId);
  return res.voted;
};

export const checkUserVote = async (productId: string, _userId?: string) => {
  try {
    const res = await api.checkVote(productId);
    return res.voted;
  } catch {
    return false;
  }
};

export const fetchComments = async (productId: string) => {
  try {
    return await api.getComments(productId);
  } catch {
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:profiles(id, display_name, avatar_url, bio)')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as Comment[];
  }
};

export const addComment = async (productId: string, arg2: string, arg3?: string) => {
  const content = arg3 !== undefined ? arg3 : arg2;
  return await api.addComment(productId, content);
};

export const deleteComment = async (id: string) => {
  return await api.deleteComment(id);
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