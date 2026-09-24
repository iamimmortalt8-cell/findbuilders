import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { emailService } from '../email/index.js';
import type { Product, ProductFilters, ProductSubmission, ProductImage, ProductUpdate } from '../types/index.js';

export class ProductService {
  async getProducts(filters: ProductFilters = {}): Promise<{ products: Product[]; count: number }> {
    const {
      search,
      category,
      status = 'approved',
      sort = 'newest',
      page = 1,
      limit = 20,
    } = filters;

    let query = supabaseAdmin
      .from('products')
      .select('*, category:categories(*), maker:profiles(id, display_name, avatar_url)', { count: 'exact' })
      .eq('status', status);

    const rawSearch = search?.trim();
    if (rawSearch) {
      const cleanSearch = rawSearch.replace(/[,()]/g, ' ').trim();
      if (cleanSearch) {
        const { data: matchedCategories } = await supabaseAdmin
          .from('categories')
          .select('id')
          .or(`name.ilike.%${cleanSearch}%,slug.ilike.%${cleanSearch}%`);

        const matchingCategoryIds = (matchedCategories || []).map((c: any) => c.id);

        const orConditions = [
          `name.ilike.%${cleanSearch}%`,
          `tagline.ilike.%${cleanSearch}%`,
          `description.ilike.%${cleanSearch}%`
        ];

        matchingCategoryIds.forEach((catId: string) => {
          orConditions.push(`category_id.eq.${catId}`);
        });

        query = query.or(orConditions.join(','));
      }
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    switch (sort) {
      case 'popular':
        query = query.order('upvotes_count', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new AppError(500, error.message);
    }

    return { products: data as Product[], count: count || 0 };
  }

  async getProductById(id: string, userId?: string): Promise<Product | null> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, category:categories(*), maker:profiles(id, display_name, avatar_url, bio)')
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }

    const product = data as Product;

    if (userId) {
      const { data: vote } = await supabaseAdmin
        .from('votes')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', id)
        .single();

      product.user_vote = !!vote;
    }

    return product;
  }

  async getUserProducts(userId: string): Promise<Product[]> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, category:categories(*)')
      .eq('maker_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(500, error.message);
    }

    return data as Product[];
  }

  async getPublicUserProducts(userId: string): Promise<Product[]> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, category:categories(*)')
      .eq('maker_id', userId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(500, error.message);
    }

    return data as Product[];
  }

  async createProduct(submission: ProductSubmission, userId: string): Promise<Product> {
    console.log('[DEBUG createProduct] Starting product creation:', {
      supabaseAdminInitialized: !!supabaseAdmin,
      supabaseUrl: process.env.SUPABASE_URL,
      serviceRoleKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceRoleKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...' : 'none',
      maker_id: userId,
      submission
    });

    const status = submission.status || 'pending';
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name: submission.name,
        tagline: submission.tagline,
        description: submission.description,
        website_url: submission.website_url,
        category_id: submission.category_id,
        image_url: submission.image_url,
        maker_id: userId,
        status,
      })
      .select()
      .single();

    if (error) {
      console.error('[DEBUG createProduct] Supabase Insert Error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new AppError(400, error.message);
    }

    console.log('[DEBUG createProduct] Product inserted successfully:', data.id);

    if (submission.screenshots && submission.screenshots.length > 0) {
      const screenshots = submission.screenshots.map((url, index) => ({
        product_id: data.id,
        image_url: url,
        display_order: index,
      }));

      const { error: imgErr } = await supabaseAdmin.from('product_images').insert(screenshots);
      if (imgErr) {
        console.error('[DEBUG createProduct] Screenshots Insert Error:', imgErr);
      }
    }

    if (status === 'pending') {
      await supabaseAdmin.from('admin_notifications').insert({
        type: 'product_submission',
        product_id: data.id,
        maker_id: userId,
      });

      // Send Product Submitted Email (failure must never break product submission)
      emailService.sendProductSubmittedEmail(data, userId).catch(err => {
        console.error('[ProductService] Non-blocking error sending product submission email:', err);
      });
    }

    return data as Product;
  }

  async updateProduct(id: string, updates: ProductUpdate, userId: string, isAdmin: boolean): Promise<Product> {
    const { data: existing } = await supabaseAdmin
      .from('products')
      .select('maker_id, status, name, website_url, category_id')
      .eq('id', id)
      .single();

    if (!existing) {
      throw new AppError(404, 'Product not found');
    }

    if (!isAdmin && existing.maker_id !== userId) {
      throw new AppError(403, 'Not authorized to update this product');
    }

    let newStatus = existing.status;
    
    if (updates.status && existing.status === 'draft' && updates.status === 'pending') {
      newStatus = 'pending';
    } else if (updates.status && isAdmin) {
      newStatus = updates.status;
    } else if (!isAdmin && existing.status === 'approved') {
      const isMaterialChange = 
        (updates.name !== undefined && updates.name !== existing.name) ||
        (updates.website_url !== undefined && updates.website_url !== existing.website_url) ||
        (updates.category_id !== undefined && updates.category_id !== existing.category_id);
        
      if (isMaterialChange) {
        newStatus = 'pending';
      }
    } else if (!isAdmin && existing.status === 'rejected') {
      // If rejected, any edit sends it back to pending
      newStatus = 'pending';
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ ...updates, status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(400, error.message);
    }

    if (newStatus === 'pending' && existing.status !== 'pending') {
      await supabaseAdmin.from('admin_notifications').insert({
        type: 'product_submission',
        product_id: data.id,
        maker_id: userId,
      });

      // Send Product Submitted Email when transitioning to pending (failure must never break update)
      emailService.sendProductSubmittedEmail(data, userId).catch(err => {
        console.error('[ProductService] Non-blocking error sending product submission email on update:', err);
      });
    }

    return data as Product;
  }

  async deleteProduct(id: string, userId: string, isAdmin: boolean): Promise<void> {
    // 1. Fetch product to verify existence and ownership
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('products')
      .select('id, name, maker_id, image_url, category_id')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      throw new AppError(404, 'Product not found');
    }

    // 2. Strict authorization check
    if (!isAdmin && existing.maker_id !== userId) {
      throw new AppError(403, 'Not authorized to delete this product');
    }

    // 3. Collect all storage image URLs associated with the product
    const { data: images } = await supabaseAdmin
      .from('product_images')
      .select('id, image_url')
      .eq('product_id', id);

    const urlsToDelete: string[] = [];
    if (existing.image_url) {
      urlsToDelete.push(existing.image_url);
    }
    if (images && images.length > 0) {
      images.forEach(img => {
        if (img.image_url) urlsToDelete.push(img.image_url);
      });
    }

    // 4. Remove all files from Supabase Storage
    // Only delete paths scoped to product-images/{productId}/
    const filePaths = new Set<string>();
    for (const url of urlsToDelete) {
      try {
        const match = url.match(/\/storage\/v1\/object\/(?:public|authenticated|sign)\/([^/?#]+)\/([^?#]+)/i);
        if (match && match[1] && match[2]) {
          const bucket = match[1];
          const filePath = decodeURIComponent(match[2]);
          if (bucket === 'product-images' && filePath.startsWith(`${id}/`)) {
            filePaths.add(filePath);
          }
        }
      } catch (e) {
        console.warn('[deleteProduct] Failed to parse URL for storage deletion:', url, e);
      }
    }

    if (filePaths.size > 0) {
      try {
        console.log(`[deleteProduct] Deleting ${filePaths.size} storage files from bucket 'product-images'`);
        await supabaseAdmin.storage.from('product-images').remove(Array.from(filePaths));
      } catch (err) {
        console.warn('[deleteProduct] Storage removal warning:', err);
      }
    }

    // Sweep any remaining files under product-images/{productId}/ only
    try {
      const { data: rootItems } = await supabaseAdmin.storage
        .from('product-images')
        .list(id);

      if (rootItems && rootItems.length > 0) {
        const sweepPaths: string[] = [];
        for (const item of rootItems) {
          if (item.id || item.metadata) {
            // File at product root level
            sweepPaths.push(`${id}/${item.name}`);
          } else if (item.name) {
            // Subfolder — list its contents
            const { data: subItems } = await supabaseAdmin.storage
              .from('product-images')
              .list(`${id}/${item.name}`);
            if (subItems && subItems.length > 0) {
              for (const sub of subItems) {
                if (sub.name && (sub.id || sub.metadata)) {
                  sweepPaths.push(`${id}/${item.name}/${sub.name}`);
                }
              }
            }
          }
        }
        if (sweepPaths.length > 0) {
          console.log(`[deleteProduct] Sweep: deleting ${sweepPaths.length} files under product-images/${id}/`);
          await supabaseAdmin.storage.from('product-images').remove(sweepPaths);
        }
      }
    } catch (storageFolderErr) {
      console.warn('[deleteProduct] Storage folder sweep warning:', storageFolderErr);
    }

    // 5. Delete all database records belonging to this product
    // Delete votes
    const { error: votesErr } = await supabaseAdmin
      .from('votes')
      .delete()
      .eq('product_id', id);
    if (votesErr) {
      console.warn('[deleteProduct] Votes delete warning:', votesErr);
    }

    // Delete comments
    const { error: commentsErr } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('product_id', id);
    if (commentsErr) {
      console.warn('[deleteProduct] Comments delete warning:', commentsErr);
    }

    // Delete product_images
    const { error: imagesErr } = await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('product_id', id);
    if (imagesErr) {
      console.warn('[deleteProduct] Product images delete warning:', imagesErr);
    }

    // Delete product row
    const { error: deleteErr } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      throw new AppError(400, deleteErr.message);
    }

    console.log(`[deleteProduct] Successfully permanently deleted product: ${id} (${existing.name})`);
  }

  async approveProduct(id: string): Promise<Product> {
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('products')
      .select('id, status, name, maker_id, updated_at')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      throw new AppError(404, 'Product not found');
    }

    const previousStatus = existing.status;
    const transitionTimestamp = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ status: 'approved', updated_at: transitionTimestamp })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(400, error.message);
    }

    // Status transition guard: Only trigger email on PENDING -> APPROVED
    if (previousStatus === 'pending') {
      emailService.sendProductApprovedEmail(data).catch(err => {
        console.error('[ProductService] Non-blocking error sending product approved email:', err);
      });
    } else {
      console.log(`[ProductService] Skipping approval email: state transition was ${previousStatus} -> approved, not pending -> approved.`);
    }

    return data as Product;
  }

  async rejectProduct(id: string, reason: string): Promise<Product> {
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('products')
      .select('id, status, name, maker_id, updated_at')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      throw new AppError(404, 'Product not found');
    }

    const previousStatus = existing.status;
    const transitionTimestamp = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: transitionTimestamp,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(400, error.message);
    }

    // Status transition guard: Only trigger email on PENDING -> REJECTED
    if (previousStatus === 'pending') {
      emailService.sendProductRejectedEmail(data, reason).catch(err => {
        console.error('[ProductService] Non-blocking error sending product rejected email:', err);
      });
    } else {
      console.log(`[ProductService] Skipping rejection email: state transition was ${previousStatus} -> rejected, not pending -> rejected.`);
    }

    return data as Product;
  }

  async getAdminProducts(status?: string): Promise<Product[]> {
    let query = supabaseAdmin
      .from('products')
      .select('*, category:categories(*), maker:profiles(id, display_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status as 'pending' | 'approved' | 'rejected');
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(500, error.message);
    }

    return data as Product[];
  }

  async uploadProductImage(productId: string, userId: string, file: Buffer, fileName: string, contentType: string): Promise<string> {
    const path = `${productId}/${userId}/${Date.now()}-${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('product-images')
      .upload(path, file, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      throw new AppError(400, uploadError.message);
    }

    const { data: urlData } = supabaseAdmin.storage.from('product-images').getPublicUrl(path);

    const { data: product } = await supabaseAdmin
      .from('products')
      .select('maker_id, image_url')
      .eq('id', productId)
      .single();

    if (product && product.maker_id !== userId) {
      throw new AppError(403, 'Not authorized');
    }

    // Delete old logo if exists
    if (product && product.image_url) {
      try {
        const oldMatch = product.image_url.match(/\/storage\/v1\/object\/(?:public|authenticated|sign)\/([^/?#]+)\/([^?#]+)/i);
        if (oldMatch && oldMatch[1] && oldMatch[2]) {
          const oldBucket = oldMatch[1];
          const oldPath = decodeURIComponent(oldMatch[2]);
          await supabaseAdmin.storage.from(oldBucket).remove([oldPath]);
        }
      } catch (e) {
        console.warn('[uploadProductImage] Failed to delete old logo:', product.image_url, e);
      }
    }

    await supabaseAdmin
      .from('products')
      .update({ image_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', productId);

    return urlData.publicUrl;
  }

  async uploadProductScreenshots(productId: string, userId: string, files: Array<{ buffer: Buffer; fileName: string; contentType: string }>): Promise<string[]> {
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('maker_id')
      .eq('id', productId)
      .single();

    if (product && product.maker_id !== userId) {
      throw new AppError(403, 'Not authorized');
    }

    const { data: existingImages } = await supabaseAdmin
      .from('product_images')
      .select('display_order')
      .eq('product_id', productId)
      .order('display_order', { ascending: false })
      .limit(1);

    const startOrder = existingImages && existingImages.length > 0
      ? existingImages[0].display_order + 1
      : 0;

    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const { buffer, fileName, contentType } = files[i];
      const path = `${productId}/${userId}/${Date.now()}-${i}-${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('product-images')
        .upload(path, buffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        throw new AppError(400, uploadError.message);
      }

      const { data: urlData } = supabaseAdmin.storage.from('product-images').getPublicUrl(path);

      await supabaseAdmin.from('product_images').insert({
        product_id: productId,
        image_url: urlData.publicUrl,
        display_order: startOrder + i,
      });

      urls.push(urlData.publicUrl);
    }

    return urls;
  }

  async getProductImages(productId: string): Promise<ProductImage[]> {
    const { data, error } = await supabaseAdmin
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order');

    if (error) {
      throw new AppError(500, error.message);
    }

    return data as ProductImage[];
  }

  async deleteProductImage(imageId: string, userId: string, isAdmin: boolean): Promise<void> {
    const { data: img, error: fetchErr } = await supabaseAdmin
      .from('product_images')
      .select('*, product:products(maker_id)')
      .eq('id', imageId)
      .single();

    if (fetchErr || !img) {
      throw new AppError(404, 'Image not found');
    }

    const makerId = (img as any).product?.maker_id;
    if (!isAdmin && makerId !== userId) {
      throw new AppError(403, 'Not authorized');
    }

    const { error: deleteErr } = await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (deleteErr) {
      throw new AppError(400, deleteErr.message);
    }

    if (img.image_url) {
      try {
        const match = img.image_url.match(/\/storage\/v1\/object\/(?:public|authenticated|sign)\/([^/?#]+)\/([^?#]+)/i);
        if (match && match[1] && match[2]) {
          const bucket = match[1];
          const filePath = decodeURIComponent(match[2]);
          await supabaseAdmin.storage.from(bucket).remove([filePath]);
        }
      } catch (e) {
        console.warn('[deleteProductImage] Failed to delete storage file:', img.image_url, e);
      }
    }
  }
}