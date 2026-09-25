import type { Product, Category, Profile, Comment, AdminStats, ProductImage } from "@/lib/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://findbuilders.onrender.com/api' : 'http://localhost:3001/api');

class ApiClient {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('admin_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data.data;
  }

  private async requestForm<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = localStorage.getItem('admin_access_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data.data;
  }

  // Auth
  async signIn(email: string, password: string): Promise<{ access_token: string; refresh_token: string }> {
    return this.request<{ access_token: string; refresh_token: string }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    return this.request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getMe(): Promise<{ id: string; email: string }> {
    return this.request('/auth/me');
  }

  async signOut(): Promise<void> {
    return this.request('/auth/signout', { method: 'POST' });
  }

  // Profiles
  async getProfile(userId?: string): Promise<Profile> {
    const endpoint = userId ? `/profiles/${userId}` : '/profiles/me';
    return this.request(endpoint);
  }

  async getAdminUsers(): Promise<Profile[]> {
    return this.request('/admin/users');
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.request('/categories');
  }

  // Products
  async getProducts(filters: {
    search?: string;
    category?: string;
    status?: string;
    sort?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: Product[]; count: number; page: number; limit: number; totalPages: number }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    return this.request(`/products?${params.toString()}`);
  }

  async getProduct(id: string): Promise<Product> {
    return this.request(`/products/${id}`);
  }

  async getProductImages(productId: string): Promise<ProductImage[]> {
    return this.request(`/products/${productId}/images`);
  }

  async getMyProducts(userId: string): Promise<Product[]> {
    return this.request(`/products/my-products`);
  }

  async submitProduct(submission: any, userId: string): Promise<Product> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  }

  async updateProduct(id: string, updates: any): Promise<Product> {
    return this.request(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // Votes
  async toggleVote(productId: string, userId: string): Promise<{ voted: boolean; count: number }> {
    return this.request(`/products/${productId}/vote`, { method: 'POST' });
  }

  async checkUserVote(productId: string, userId: string): Promise<{ voted: boolean; count: number }> {
    return this.request(`/products/${productId}/vote`);
  }

  // Comments
  async getComments(productId: string): Promise<Comment[]> {
    return this.request(`/products/${productId}/comments`);
  }

  async addComment(productId: string, userId: string, content: string): Promise<Comment> {
    return this.request(`/products/${productId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(id: string): Promise<void> {
    return this.request(`/products/comments/${id}`, { method: 'DELETE' });
  }

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    return this.request('/admin/stats');
  }

  async getAdminProducts(status?: string): Promise<Product[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    return this.request(`/admin/products?${params.toString()}`);
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
}

// Named exports for backward compatibility
export const fetchAdminStats = () => api.getAdminStats();
export const fetchAdminProducts = (status?: string) => api.getAdminProducts(status);
export const approveProduct = (id: string) => api.approveProduct(id);
export const rejectProduct = (id: string, reason: string) => api.rejectProduct(id, reason);
export const fetchAllProfiles = () => api.getAdminUsers();
export const fetchProduct = (id: string) => api.getProduct(id);
export const fetchProductImages = (id: string) => api.getProductImages(id);
export const deleteProduct = (id: string) => api.deleteProduct(id);

export const api = new ApiClient();