// ══════════════════════════════════════════════════════════════
// FindBuilders – Supabase Database Types (generated from schema)
// ══════════════════════════════════════════════════════════════

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'follows_follower_id_fkey';
            columns: ['follower_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'follows_following_id_fkey';
            columns: ['following_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          product_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          product_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string | null;
          product_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          tagline: string;
          description: string;
          website_url: string;
          category_id: string | null;
          maker_id: string;
          image_url: string | null;
          status: 'draft' | 'pending' | 'approved' | 'rejected';
          rejection_reason: string | null;
          upvotes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tagline?: string;
          description?: string;
          website_url: string;
          category_id?: string | null;
          maker_id: string;
          image_url?: string | null;
          status?: 'draft' | 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          upvotes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          tagline?: string;
          description?: string;
          website_url?: string;
          category_id?: string | null;
          maker_id?: string;
          image_url?: string | null;
          status?: 'draft' | 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          upvotes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_maker_id_fkey';
            columns: ['maker_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          image_url: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          image_url?: string;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      votes: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'votes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'votes_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      comments: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'comments_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      admin_notifications: {
        Row: {
          id: string;
          type: string;
          product_id: string | null;
          maker_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          product_id?: string | null;
          maker_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          product_id?: string | null;
          maker_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_notifications_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admin_notifications_maker_id_fkey';
            columns: ['maker_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      email_events: {
        Row: {
          id: string;
          event_key: string;
          event_type: 'WELCOME' | 'PRODUCT_SUBMITTED' | 'PRODUCT_APPROVED' | 'PRODUCT_REJECTED';
          recipient: string;
          status: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';
          provider_message_id: string | null;
          created_at: string;
          sent_at: string | null;
          error_message: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          event_key: string;
          event_type: 'WELCOME' | 'PRODUCT_SUBMITTED' | 'PRODUCT_APPROVED' | 'PRODUCT_REJECTED';
          recipient: string;
          status?: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';
          provider_message_id?: string | null;
          created_at?: string;
          sent_at?: string | null;
          error_message?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          event_key?: string;
          event_type?: 'WELCOME' | 'PRODUCT_SUBMITTED' | 'PRODUCT_APPROVED' | 'PRODUCT_REJECTED';
          recipient?: string;
          status?: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';
          provider_message_id?: string | null;
          created_at?: string;
          sent_at?: string | null;
          error_message?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'user' | 'admin';
      product_status: 'draft' | 'pending' | 'approved' | 'rejected';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}