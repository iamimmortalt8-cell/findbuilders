import { z } from 'zod';

export const signUpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    displayName: z.string().min(1, 'Display name is required').max(50, 'Display name too long'),
  }),
});

export const signInSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const exchangeTokenSchema = z.object({
  body: z.object({
    supabaseAccessToken: z.string().min(1, 'Supabase access token is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    display_name: z.string().max(50).optional(),
    bio: z.string().max(3000).optional(),
  }),
});

export const productSubmissionSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
    tagline: z.string().max(150).optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
    website_url: z.string().url('Invalid URL'),
    category_id: z.string().uuid('Invalid category ID'),
    image_url: z.string().url().optional().or(z.literal('')),
    screenshots: z.array(z.string().url()).optional(),
    status: z.enum(['draft', 'pending', 'approved', 'rejected']).optional(),
  }),
});

export const productUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    tagline: z.string().max(150).optional(),
    description: z.string().min(10).max(5000).optional(),
    website_url: z.string().url().optional(),
    category_id: z.string().uuid().optional(),
    image_url: z.string().url().optional().or(z.literal('')),
    status: z.enum(['draft', 'pending', 'approved', 'rejected']).optional(),
    rejection_reason: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const voteSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const commentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const commentUpdateSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const adminApproveSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const adminRejectSchema = z.object({
  body: z.object({
    reason: z.string().min(1, 'Rejection reason is required').max(1000, 'Reason too long'),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const productFiltersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().uuid().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    sort: z.enum(['newest', 'popular', 'oldest']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const adminUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['user', 'admin']),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const categorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    icon: z.string().optional(),
  }),
});

export const categoryUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
    icon: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});