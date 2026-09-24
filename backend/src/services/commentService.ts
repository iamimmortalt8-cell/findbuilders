import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Comment } from '../types/index.js';

export class CommentService {
  async getComments(productId: string): Promise<Comment[]> {
    const { data, error } = await supabaseAdmin
      .from('comments')
      .select('*, user:profiles(id, display_name, avatar_url)')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError(500, error.message);
    }

    return data as Comment[];
  }

  async addComment(productId: string, userId: string, content: string): Promise<Comment> {
    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert({ product_id: productId, user_id: userId, content })
      .select('*, user:profiles(id, display_name, avatar_url)')
      .single();

    if (error) {
      throw new AppError(400, error.message);
    }

    return data as Comment;
  }

  async updateComment(commentId: string, userId: string, content: string): Promise<Comment> {
    const { data: existing } = await supabaseAdmin
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!existing) {
      throw new AppError(404, 'Comment not found');
    }

    if (existing.user_id !== userId) {
      throw new AppError(403, 'Not authorized to update this comment');
    }

    const { data, error } = await supabaseAdmin
      .from('comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select('*, user:profiles(id, display_name, avatar_url)')
      .single();

    if (error) {
      throw new AppError(400, error.message);
    }

    return data as Comment;
  }

  async deleteComment(commentId: string, userId: string, isAdmin: boolean): Promise<void> {
    const { data: existing } = await supabaseAdmin
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!existing) {
      throw new AppError(404, 'Comment not found');
    }

    if (!isAdmin && existing.user_id !== userId) {
      throw new AppError(403, 'Not authorized to delete this comment');
    }

    const { error } = await supabaseAdmin.from('comments').delete().eq('id', commentId);
    if (error) {
      throw new AppError(400, error.message);
    }
  }

  async getCommentCount(productId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId);

    if (error) {
      throw new AppError(500, error.message);
    }

    return count || 0;
  }
}