// ══════════════════════════════════════════════════════════════
// Product Discovery Platform – TypeScript Types
// ══════════════════════════════════════════════════════════════

export type UserRole = 'user' | 'admin';
export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected';

// ─── Profile ───
export interface Profile {
    id: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    role: UserRole;
    created_at: string;
    updated_at: string;
}

// ─── Category ───
export interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    product_count: number;
    created_at: string;
}

// ─── Product ───
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
    // Joined fields
    category?: Category;
    maker?: Profile;
    user_vote?: boolean;
}

// ─── Product Image ───
export interface ProductImage {
    id: string;
    product_id: string;
    image_url: string;
    display_order: number;
    created_at: string;
}

// ─── Vote ───
export interface Vote {
    id: string;
    user_id: string;
    product_id: string;
    created_at: string;
}

// ─── Comment ───
export interface Comment {
    id: string;
    product_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    // Joined
    user?: Profile;
}

// ─── Product Submission Form ───
export interface ProductSubmission {
    name: string;
    tagline: string;
    description: string;
    website_url: string;
    category_id: string;
    image_url: string;
}

// ─── Admin Stats ───
export interface AdminStats {
    total_products: number;
    pending_products: number;
    approved_products: number;
    rejected_products: number;
    total_users: number;
    total_votes: number;
    total_comments: number;
}

// ─── Search/Filters ───
export interface ProductFilters {
    search?: string;
    category?: string;
    status?: ProductStatus;
    sort?: 'newest' | 'popular' | 'oldest';
    page?: number;
    limit?: number;
}

// ─── Admin Notification ───
export interface AdminNotification {
    id: string;
    type: string;
    product_id: string;
    maker_id: string;
    is_read: boolean;
    created_at: string;
    // Joined fields
    product?: Product;
    maker?: Profile;
}
