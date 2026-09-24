import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

const FAILURE_MESSAGE = 'Account deletion could not be completed';
const STORAGE_URL_PATTERN = /\/storage\/v1\/object\/(?:public|authenticated|sign)\/([^/?#]+)\/([^?#]+)/i;

interface OwnedProduct {
  id: string;
  image_url: string | null;
}

interface OwnedImage {
  product_id: string;
  image_url: string;
}

export class AccountService {
  /**
   * Permanently delete the authenticated user's own account.
   * `userId` must come from the verified JWT (req.user.sub) — never from the client body.
   *
   * Order: gather → storage files → dependent rows → profile → Supabase Auth user.
   * Any required failure throws AppError(500) with a safe generic message.
   */
  async deleteOwnAccount(userId: string, email?: string): Promise<void> {
    // ── 1. Gather owned data ────────────────────────────────────────────
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, avatar_url')
      .eq('id', userId)
      .maybeSingle();
    if (profileErr) this.fail('profile lookup', profileErr);

    const { data: productRows, error: productsErr } = await supabaseAdmin
      .from('products')
      .select('id, image_url')
      .eq('maker_id', userId);
    if (productsErr) this.fail('products lookup', productsErr);
    const ownedProducts: OwnedProduct[] = productRows ?? [];
    const productIds = ownedProducts.map(p => p.id);

    let ownedImages: OwnedImage[] = [];
    if (productIds.length > 0) {
      const { data: imageRows, error: imagesErr } = await supabaseAdmin
        .from('product_images')
        .select('product_id, image_url')
        .in('product_id', productIds);
      if (imagesErr) this.fail('product_images lookup', imagesErr);
      ownedImages = (imageRows ?? []) as OwnedImage[];
    }

    // ── 2. Remove storage files (scoped strictly to this user/products) ─
    const avatarPaths = new Set<string>();
    this.collectScopedPaths([profile?.avatar_url ?? null], 'avatars', `${userId}/`, avatarPaths);
    const avatarSweep = await this.sweepFolder('avatars', userId, false);

    const productPaths = new Set<string>();
    for (const product of ownedProducts) {
      this.collectScopedPaths([product.image_url], 'product-images', `${product.id}/`, productPaths);
    }
    for (const image of ownedImages) {
      this.collectScopedPaths([image.image_url], 'product-images', `${image.product_id}/`, productPaths);
    }

    const productSweepPaths: string[] = [];
    for (const productId of productIds) {
      productSweepPaths.push(...(await this.sweepFolder('product-images', productId, true)));
    }

    await this.removeStorageFiles('avatars', [...new Set([...avatarPaths, ...avatarSweep])]);
    await this.removeStorageFiles('product-images', [...new Set([...productPaths, ...productSweepPaths])]);

    // ── 3. Delete dependent database rows ───────────────────────────────
    // email_events (no FKs — must be deleted explicitly)
    if (email) {
      const { error } = await supabaseAdmin.from('email_events').delete().eq('recipient', email);
      if (error) this.fail('email_events (recipient)', error);
    }
    {
      const { error } = await supabaseAdmin
        .from('email_events')
        .delete()
        .eq('event_key', `WELCOME:${userId}`);
      if (error) this.fail('email_events (welcome)', error);
    }
    for (const productId of productIds) {
      const { error } = await supabaseAdmin
        .from('email_events')
        .delete()
        .like('event_key', `PRODUCT_%:${productId}:%`);
      if (error) this.fail('email_events (product)', error);
    }

    // admin_notifications
    {
      const { error } = await supabaseAdmin
        .from('admin_notifications')
        .delete()
        .eq('maker_id', userId);
      if (error) this.fail('admin_notifications (maker)', error);
    }
    if (productIds.length > 0) {
      const { error } = await supabaseAdmin
        .from('admin_notifications')
        .delete()
        .in('product_id', productIds);
      if (error) this.fail('admin_notifications (products)', error);
    }

    // follows (both directions)
    {
      const { error } = await supabaseAdmin.from('follows').delete().eq('follower_id', userId);
      if (error) this.fail('follows (follower)', error);
    }
    {
      const { error } = await supabaseAdmin.from('follows').delete().eq('following_id', userId);
      if (error) this.fail('follows (following)', error);
    }

    // votes
    {
      const { error } = await supabaseAdmin.from('votes').delete().eq('user_id', userId);
      if (error) this.fail('votes (user)', error);
    }
    if (productIds.length > 0) {
      const { error } = await supabaseAdmin.from('votes').delete().in('product_id', productIds);
      if (error) this.fail('votes (products)', error);
    }

    // comments
    {
      const { error } = await supabaseAdmin.from('comments').delete().eq('user_id', userId);
      if (error) this.fail('comments (user)', error);
    }
    if (productIds.length > 0) {
      const { error } = await supabaseAdmin.from('comments').delete().in('product_id', productIds);
      if (error) this.fail('comments (products)', error);
    }

    // product_images
    if (productIds.length > 0) {
      const { error } = await supabaseAdmin
        .from('product_images')
        .delete()
        .in('product_id', productIds);
      if (error) this.fail('product_images', error);
    }

    // products
    {
      const { error } = await supabaseAdmin.from('products').delete().eq('maker_id', userId);
      if (error) this.fail('products', error);
    }

    // profile (cascades remain as a safety net)
    {
      const { error } = await supabaseAdmin.from('profiles').delete().eq('id', userId);
      if (error) this.fail('profile', error);
    }

    // ── 4. Delete the Supabase Auth user (permanent, not soft-deactivate) ─
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) {
      const message = String((authErr as { message?: string }).message ?? '');
      const status = (authErr as { status?: number }).status;
      const alreadyGone = status === 404 || /not found/i.test(message);
      if (!alreadyGone) this.fail('auth user deletion', authErr);
    }

    // ── 5. Verify the auth user is truly gone ───────────────────────────
    const { data: verifyData, error: verifyErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (verifyData?.user) {
      this.fail('auth user verification', new Error('Auth user still present after deletion'));
    }
    if (verifyErr && !/not found/i.test(String(verifyErr.message ?? ''))) {
      console.warn('[AccountService] Could not verify auth user removal:', verifyErr.message);
    }

    console.log(`[AccountService] Account permanently deleted for user ${userId}`);
  }

  private fail(step: string, error: unknown): never {
    console.error(`[AccountService] Account deletion failed during ${step}:`, error);
    throw new AppError(500, FAILURE_MESSAGE);
  }

  /**
   * Parse storage object URLs and keep only paths inside `bucket` under `prefix`
   * (scope guard — never deletes another user's files).
   */
  private collectScopedPaths(
    urls: Array<string | null | undefined>,
    bucket: string,
    prefix: string,
    out: Set<string>
  ): void {
    for (const url of urls) {
      if (!url) continue;
      try {
        const match = url.match(STORAGE_URL_PATTERN);
        if (match && match[1] && match[2]) {
          const urlBucket = match[1];
          const filePath = decodeURIComponent(match[2]);
          if (urlBucket === bucket && filePath.startsWith(prefix)) {
            out.add(filePath);
          }
        }
      } catch (err) {
        console.warn('[AccountService] Failed to parse storage URL:', url, err);
      }
    }
  }

  /** List files under a folder (optionally one subfolder level deep). */
  private async sweepFolder(bucket: string, folder: string, deep: boolean): Promise<string[]> {
    const { data: rootItems, error } = await supabaseAdmin.storage.from(bucket).list(folder);
    if (error) this.fail(`storage list ${bucket}/${folder}`, error);

    const paths: string[] = [];
    for (const item of rootItems ?? []) {
      if (item.id || item.metadata) {
        paths.push(`${folder}/${item.name}`);
      } else if (item.name && deep) {
        const { data: subItems, error: subErr } = await supabaseAdmin.storage
          .from(bucket)
          .list(`${folder}/${item.name}`);
        if (subErr) this.fail(`storage list ${bucket}/${folder}/${item.name}`, subErr);
        for (const sub of subItems ?? []) {
          if (sub.name && (sub.id || sub.metadata)) {
            paths.push(`${folder}/${item.name}/${sub.name}`);
          }
        }
      }
    }
    return paths;
  }

  private async removeStorageFiles(bucket: string, paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    const { error } = await supabaseAdmin.storage.from(bucket).remove(paths);
    if (error) this.fail(`storage remove ${bucket}`, error);
  }
}
