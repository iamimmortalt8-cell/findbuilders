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
    tagline: z.string().max(150).optional().or(z.literal('')),
    description: z.string().max(5000, 'Description too long').optional().or(z.literal('')),
    website_url: z.string().max(2000).optional().or(z.literal('')),
    category_id: z.string().uuid('Invalid category ID').optional().or(z.literal('')).nullable(),
    image_url: z.string().url().optional().or(z.literal('')).nullable(),
    screenshots: z.array(z.string().url()).optional(),
    status: z.enum(['draft', 'pending', 'approved', 'rejected']).optional(),
  }).superRefine((data, ctx) => {
    const isDraft = data.status === 'draft';
    if (!isDraft) {
      if (!data.description || data.description.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Description must be at least 10 characters',
          path: ['description'],
        });
      }
      if (!data.website_url || !data.website_url.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid URL',
          path: ['website_url'],
        });
      } else {
        try {
          const parsed = new URL(data.website_url.trim());
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Invalid URL',
              path: ['website_url'],
            });
          }
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid URL',
            path: ['website_url'],
          });
        }
      }
      if (!data.category_id || !data.category_id.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid category ID',
          path: ['category_id'],
        });
      }
    }
  }),
});

export const productUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    tagline: z.string().max(150).optional().or(z.literal('')),
    description: z.string().max(5000).optional().or(z.literal('')),
    website_url: z.string().max(2000).optional().or(z.literal('')),
    category_id: z.string().uuid('Invalid category ID').optional().or(z.literal('')).nullable(),
    image_url: z.string().url().optional().or(z.literal('')).nullable(),
    status: z.enum(['draft', 'pending', 'approved', 'rejected']).optional(),
    rejection_reason: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.status === 'pending') {
      if (data.description !== undefined && data.description.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Description must be at least 10 characters',
          path: ['description'],
        });
      }
      if (data.website_url !== undefined && data.website_url.trim()) {
        try {
          const parsed = new URL(data.website_url.trim());
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Invalid URL',
              path: ['website_url'],
            });
          }
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid URL',
            path: ['website_url'],
          });
        }
      }
    }
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

export const deleteAccountSchema = z.object({
  body: z.object({
    confirmation: z
      .string({ required_error: 'Confirmation is required' })
      .refine(value => value === 'DELETE', { message: 'Confirmation must be exactly DELETE' }),
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