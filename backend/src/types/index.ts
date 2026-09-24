// ══════════════════════════════════════════════════════════════
// FindBuilders Backend – TypeScript Types
// ══════════════════════════════════════════════════════════════

export type UserRole = 'user' | 'admin';
export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  product_count: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  website_url: string;
  category_id: string | null;
  maker_id: string;
  image_url: string | null;
  status: ProductStatus;
  rejection_reason: string | null;
  upvotes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  maker?: Profile;
  user_vote?: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

export interface Vote {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  product_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface ProductSubmission {
  name: string;
  tagline: string;
  description: string;
  website_url: string;
  category_id: string;
  image_url: string;
  screenshots?: string[];
  status?: ProductStatus;
}

export interface AdminStats {
  total_products: number;
  pending_products: number;
  approved_products: number;
  rejected_products: number;
  total_users: number;
  total_votes: number;
  total_comments: number;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  status?: ProductStatus;
  sort?: 'newest' | 'popular' | 'oldest';
  page?: number;
  limit?: number;
}

export interface ProductUpdate {
  name?: string;
  tagline?: string;
  description?: string;
  website_url?: string;
  category_id?: string | null;
  image_url?: string | null;
  status?: ProductStatus;
  rejection_reason?: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}