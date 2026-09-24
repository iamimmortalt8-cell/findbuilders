import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Vote } from '../types/index.js';

export class VoteService {
  async toggleVote(productId: string, userId: string): Promise<{ voted: boolean; count: number }> {
    const { data: existing } = await supabaseAdmin
      .from('votes')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existing) {
      const { error } = await supabaseAdmin.from('votes').delete().eq('id', existing.id);
      if (error) {
        throw new AppError(400, error.message);
      }

      const { data: product } = await supabaseAdmin
        .from('products')
        .select('upvotes_count')
        .eq('id', productId)
        .single();

      return { voted: false, count: product?.upvotes_count || 0 };
    } else {
      const { error } = await supabaseAdmin
        .from('votes')
        .insert({ user_id: userId, product_id: productId });

      if (error) {
        if (error.code === '23505') {
          const { data: product } = await supabaseAdmin
            .from('products')
            .select('upvotes_count')
            .eq('id', productId)
            .single();
          return { voted: true, count: product?.upvotes_count || 0 };
        }
        throw new AppError(400, error.message);
      }

      const { data: product } = await supabaseAdmin
        .from('products')
        .select('upvotes_count')
        .eq('id', productId)
        .single();

      return { voted: true, count: product?.upvotes_count || 0 };
    }
  }

  async checkUserVote(productId: string, userId: string): Promise<boolean> {
    const { data } = await supabaseAdmin
      .from('votes')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    return !!data;
  }

  async getVoteCount(productId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId);

    if (error) {
      throw new AppError(500, error.message);
    }

    return count || 0;
  }

  async getUserVotes(userId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('votes')
      .select('product_id')
      .eq('user_id', userId);

    if (error) {
      throw new AppError(500, error.message);
    }

    return data.map((v: { product_id: string }) => v.product_id);
  }
}