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
    role: 'user' | 'admin';
    created_at: string;
    updated_at: string;
    followers_count?: number;
    following_count?: number;
    is_following?: boolean;
}

export interface ProfileLink {
    title: string;
    label?: string;
    url: string;
}

export interface ExtendedProfileData {
    bioText: string;
    username: string;
    headline: string;
    links: ProfileLink[];
    interests: string[];
    contact?: {
        email?: string;
        whatsapp?: string;
        phone?: string;
    };
}

export function parseBio(bioString: string | null): ExtendedProfileData {
    const defaultData: ExtendedProfileData = {
        bioText: '',
        username: '',
        headline: '',
        links: [],
        interests: [],
        contact: {
            email: '',
            whatsapp: '',
            phone: ''
        }
    };

    if (!bioString) return defaultData;

    try {
        const parsed = typeof bioString === 'object' ? bioString : JSON.parse(bioString);
        if (typeof parsed === 'object' && parsed !== null) {
            const rawLinks = Array.isArray(parsed.links) 
                ? parsed.links 
                : (Array.isArray(parsed.social_links) ? parsed.social_links : []);

            const normalizedLinks: ProfileLink[] = rawLinks.map((l: any) => {
                if (typeof l === 'string') {
                    const trimmed = l.trim();
                    return { title: trimmed, label: trimmed, url: trimmed };
                }
                if (typeof l === 'object' && l !== null) {
                    const title = (l.title || l.label || l.name || l.text || l.platform || '').trim();
                    const url = (l.url || l.href || l.link || '').trim();
                    if (!url) return null;
                    return {
                        title: title || url,
                        label: title || url,
                        url: url
                    };
                }
                return null;
            }).filter((l: any): l is ProfileLink => Boolean(l && l.url));

            const rawInterests = Array.isArray(parsed.interests) ? parsed.interests : [];
            const normalizedInterests: string[] = rawInterests
                .filter((i: any) => typeof i === 'string' && i.trim().length > 0)
                .map((i: string) => i.trim());

            return {
                bioText: typeof parsed.bioText === 'string' ? parsed.bioText : (typeof parsed.bio === 'string' ? parsed.bio : ''),
                username: typeof parsed.username === 'string' ? parsed.username : '',
                headline: typeof parsed.headline === 'string' ? parsed.headline : '',
                links: normalizedLinks,
                interests: normalizedInterests,
                contact: {
                    email: typeof parsed.contact?.email === 'string' ? parsed.contact.email.trim() : '',
                    whatsapp: typeof parsed.contact?.whatsapp === 'string' ? parsed.contact.whatsapp.trim() : '',
                    phone: typeof parsed.contact?.phone === 'string' ? parsed.contact.phone.trim() : ''
                }
            };
        }
    } catch (e) {
        // Not a JSON string, so it's a legacy plain text bio
        return {
            ...defaultData,
            bioText: bioString
        };
    }

    return { ...defaultData, bioText: bioString };
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
    status?: ProductStatus;
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
