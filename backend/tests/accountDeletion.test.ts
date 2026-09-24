import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';
import { errorHandler } from '../src/middleware/errorHandler.js';
import accountRoutes from '../src/routes/account.js';
import { generateTokens } from '../src/middleware/auth.js';
import { supabaseAdmin } from '../src/lib/supabase.js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const RUN = Date.now();

const emailA = `findbuilders-deltest-a-${RUN}@example.com`;
const emailB = `findbuilders-deltest-b-${RUN}@example.com`;
const PASSWORD = 'AccountDeletion-Test-123!';

let userA = '';
let userB = '';
let tokenA = '';
let tokenB = '';
let avatarPathA = '';
let avatarPathB = '';
let imagePathA1 = '';
let imagePathB = '';
const productIdsA: string[] = [];
const productIdsB: string[] = [];
let categoriesBefore: Array<{ id: string; name: string; slug: string }> = [];

let server: Server;
let baseUrl = '';

// ─── helpers ────────────────────────────────────────────────────────

const publicUrl = (bucket: string, path: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;

const uploadFile = async (bucket: string, path: string): Promise<void> => {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, Buffer.from('findbuilders-account-deletion-test-image'), {
      contentType: 'image/png',
      upsert: true,
    });
  assert.ifError(error);
};

const rowCount = async (
  table: 'profiles' | 'products' | 'product_images' | 'votes' | 'comments' | 'follows' | 'email_events' | 'admin_notifications',
  apply: (q: any) => any
): Promise<number> => {
  const query = supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
  const { count, error } = await apply(query);
  assert.ifError(error);
  return count ?? 0;
};

const api = async (
  path: string,
  init: { method?: string; body?: string } = {},
  token?: string
): Promise<{ status: number; body: any }> => {
  const res = await fetch(`${baseUrl}${path}`, {
    method: init.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(init.body !== undefined ? { body: init.body } : {}),
  });
  const text = await res.text();
  let body: any = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  return { status: res.status, body };
};

// ─── seed / teardown ────────────────────────────────────────────────

before(async () => {
  const createdA = await supabaseAdmin.auth.admin.createUser({
    email: emailA,
    password: PASSWORD,
    email_confirm: true,
  });
  assert.ifError(createdA.error);
  userA = createdA.data.user!.id;

  const createdB = await supabaseAdmin.auth.admin.createUser({
    email: emailB,
    password: PASSWORD,
    email_confirm: true,
  });
  assert.ifError(createdB.error);
  userB = createdB.data.user!.id;

  const { data: profileA, error: profileAErr } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userA)
    .maybeSingle();
  assert.ifError(profileAErr);
  assert.ok(profileA, 'profiles row for user A should be created automatically by trigger');

  const { data: profileB, error: profileBErr } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userB)
    .maybeSingle();
  assert.ifError(profileBErr);
  assert.ok(profileB, 'profiles row for user B should be created automatically by trigger');

  // Avatars
  avatarPathA = `${userA}/${RUN}-avatar-a.png`;
  avatarPathB = `${userB}/${RUN}-avatar-b.png`;
  await uploadFile('avatars', avatarPathA);
  await uploadFile('avatars', avatarPathB);
  const { error: avatarAErr } = await supabaseAdmin
    .from('profiles')
    .update({ avatar_url: publicUrl('avatars', avatarPathA) })
    .eq('id', userA);
  assert.ifError(avatarAErr);
  const { error: avatarBErr } = await supabaseAdmin
    .from('profiles')
    .update({ avatar_url: publicUrl('avatars', avatarPathB) })
    .eq('id', userB);
  assert.ifError(avatarBErr);

  // Products: A owns two pending products, B owns one approved product
  const pA1 = randomUUID();
  const pA2 = randomUUID();
  const pB = randomUUID();
  productIdsA.push(pA1, pA2);
  productIdsB.push(pB);

  imagePathA1 = `${pA1}/${userA}/${RUN}-shot-1.png`;
  imagePathB = `${pB}/${userB}/${RUN}-shot-1.png`;
  await uploadFile('product-images', imagePathA1);
  await uploadFile('product-images', imagePathB);

  const insertProduct = async (
    id: string,
    makerId: string,
    name: string,
    status: 'pending' | 'approved',
    imageUrl: string | null
  ): Promise<void> => {
    const { error } = await supabaseAdmin.from('products').insert({
      id,
      name,
      tagline: `${name} tagline`,
      description: `${name} description used by the account deletion integration test.`,
      website_url: `https://${id}.example.com`,
      category_id: null,
      maker_id: makerId,
      image_url: imageUrl,
      status,
    });
    assert.ifError(error);
  };

  await insertProduct(pA1, userA, 'A One', 'pending', publicUrl('product-images', imagePathA1));
  await insertProduct(pA2, userA, 'A Two', 'pending', null);
  await insertProduct(pB, userB, 'B One', 'approved', publicUrl('product-images', imagePathB));

  const { error: productImagesErr } = await supabaseAdmin.from('product_images').insert([
    { product_id: pA1, image_url: publicUrl('product-images', imagePathA1), display_order: 0 },
    { product_id: pB, image_url: publicUrl('product-images', imagePathB), display_order: 0 },
  ]);
  assert.ifError(productImagesErr);

  const { error: votesErr } = await supabaseAdmin.from('votes').insert([
    { user_id: userA, product_id: pB },
    { user_id: userB, product_id: pA1 },
    { user_id: userB, product_id: pB },
  ]);
  assert.ifError(votesErr);

  const { error: commentsErr } = await supabaseAdmin.from('comments').insert([
    { user_id: userA, product_id: pB, content: 'A commenting on B product' },
    { user_id: userB, product_id: pA1, content: 'B commenting on A product' },
    { user_id: userB, product_id: pB, content: 'B commenting on own product' },
  ]);
  assert.ifError(commentsErr);

  const { error: followsErr } = await supabaseAdmin.from('follows').insert([
    { follower_id: userA, following_id: userB },
    { follower_id: userB, following_id: userA },
  ]);
  assert.ifError(followsErr);

  const { error: emailEventsErr } = await supabaseAdmin.from('email_events').insert([
    { event_key: `WELCOME:${userA}`, event_type: 'WELCOME', recipient: emailA, status: 'SENT' },
    {
      event_key: `PRODUCT_SUBMITTED:${pA1}:${RUN}`,
      event_type: 'PRODUCT_SUBMITTED',
      recipient: emailA,
      status: 'SENT',
      metadata: { productId: pA1, makerId: userA, productName: 'A One' },
    },
    { event_key: `WELCOME:${userB}`, event_type: 'WELCOME', recipient: emailB, status: 'SENT' },
    {
      event_key: `PRODUCT_APPROVED:${pB}:${RUN}`,
      event_type: 'PRODUCT_APPROVED',
      recipient: emailB,
      status: 'SENT',
      metadata: { productId: pB, makerId: userB, productName: 'B One' },
    },
  ]);
  assert.ifError(emailEventsErr);

  const { error: notificationsErr } = await supabaseAdmin.from('admin_notifications').insert([
    { type: 'product_submitted', product_id: pA1, maker_id: userA },
    { type: 'product_submitted', product_id: pA2, maker_id: userA },
    { type: 'product_submitted', product_id: pB, maker_id: userB },
  ]);
  assert.ifError(notificationsErr);

  const { data: categories, error: categoriesErr } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug')
    .order('id');
  assert.ifError(categoriesErr);
  categoriesBefore = categories ?? [];

  tokenA = generateTokens({ sub: userA, email: emailA, role: 'user' }).access_token;
  tokenB = generateTokens({ sub: userB, email: emailB, role: 'user' }).access_token;

  const app = express();
  app.use(express.json());
  app.use('/api/account', accountRoutes);
  app.use(errorHandler);

  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  // Storage cleanup
  try {
    const avatarPaths = [avatarPathA, avatarPathB].filter(Boolean);
    if (avatarPaths.length > 0) {
      await supabaseAdmin.storage.from('avatars').remove(avatarPaths);
    }
    const allProductIds = [...productIdsA, ...productIdsB];
    for (const productId of allProductIds) {
      const { data: items } = await supabaseAdmin.storage.from('product-images').list(productId);
      const paths = (items ?? [])
        .filter(item => item.id || item.metadata)
        .map(item => `${productId}/${item.name}`);
      if (paths.length > 0) {
        await supabaseAdmin.storage.from('product-images').remove(paths);
      }
    }
    const knownImages = [imagePathA1, imagePathB].filter(Boolean);
    if (knownImages.length > 0) {
      await supabaseAdmin.storage.from('product-images').remove(knownImages);
    }
  } catch (err) {
    console.warn('[accountDeletion.test] storage cleanup warning:', err);
  }

  // Rows without auth-level cascade
  try {
    for (const recipient of [emailA, emailB]) {
      await supabaseAdmin.from('email_events').delete().eq('recipient', recipient);
    }
    for (const eventKey of [`WELCOME:${userA}`, `WELCOME:${userB}`]) {
      await supabaseAdmin.from('email_events').delete().eq('event_key', eventKey);
    }
    const allProductIds = [...productIdsA, ...productIdsB];
    for (const productId of allProductIds) {
      await supabaseAdmin
        .from('email_events')
        .delete()
        .like('event_key', `PRODUCT_%:${productId}:%`);
    }
    await supabaseAdmin.from('admin_notifications').delete().in('maker_id', [userA, userB].filter(Boolean));
    await supabaseAdmin.from('admin_notifications').delete().in('product_id', allProductIds);
  } catch (err) {
    console.warn('[accountDeletion.test] row cleanup warning:', err);
  }

  // Auth users (cascades profiles/products/votes/comments/follows/product_images)
  try {
    if (userB) await supabaseAdmin.auth.admin.deleteUser(userB);
    if (userA) await supabaseAdmin.auth.admin.deleteUser(userA);
  } catch (err) {
    console.warn('[accountDeletion.test] auth cleanup warning:', err);
  }

  if (server) {
    (server as any).closeAllConnections?.();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

// ─── tests (sequential — deletion mutates shared state) ─────────────

test('rejects a deletion request without a token', async () => {
  const res = await api('/api/account', {
    method: 'DELETE',
    body: JSON.stringify({ confirmation: 'DELETE' }),
  });
  assert.equal(res.status, 401);
});

test('rejects a deletion request with a missing confirmation', async () => {
  const res = await api('/api/account', { method: 'DELETE', body: JSON.stringify({}) }, tokenA);
  assert.equal(res.status, 400);
  assert.equal(res.body?.error, 'Validation failed');
});

test('rejects a deletion request with a wrong confirmation value', async () => {
  const res = await api(
    '/api/account',
    { method: 'DELETE', body: JSON.stringify({ confirmation: 'delete' }) },
    tokenA
  );
  assert.equal(res.status, 400);
  assert.equal(res.body?.error, 'Validation failed');
});

test('deletes only the authenticated user even when userId/email are injected', async () => {
  const res = await api(
    '/api/account',
    {
      method: 'DELETE',
      body: JSON.stringify({
        confirmation: 'DELETE',
        userId: userB,
        profileId: userB,
        email: emailB,
      }),
    },
    tokenA
  );
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.deepEqual(res.body?.data, { deleted: true });
  assert.equal(res.body?.message, 'Account deleted successfully');
});

test('removes every row and file owned by A while leaving B untouched', async () => {
  // ── A is fully gone ──
  const authA = await supabaseAdmin.auth.admin.getUserById(userA);
  assert.ok(authA.error || !authA.data.user, 'auth user A should be permanently deleted');

  assert.equal(await rowCount('profiles', q => q.eq('id', userA)), 0, 'profile A should be gone');
  assert.equal(
    await rowCount('products', q => q.eq('maker_id', userA)),
    0,
    "A's products should be gone"
  );
  assert.equal(
    await rowCount('product_images', q => q.in('product_id', productIdsA)),
    0,
    "A's product images rows should be gone"
  );
  assert.equal(
    await rowCount('votes', q => q.eq('user_id', userA)),
    0,
    "A's votes should be gone"
  );
  assert.equal(
    await rowCount('votes', q => q.in('product_id', productIdsA)),
    0,
    'votes on A products should be gone'
  );
  assert.equal(
    await rowCount('comments', q => q.eq('user_id', userA)),
    0,
    "A's comments should be gone"
  );
  assert.equal(
    await rowCount('comments', q => q.in('product_id', productIdsA)),
    0,
    'comments on A products should be gone'
  );
  assert.equal(
    await rowCount('follows', q =>
      q.or(`follower_id.eq.${userA},following_id.eq.${userA}`)
    ),
    0,
    'all follows referencing A should be gone'
  );
  assert.equal(
    await rowCount('email_events', q => q.eq('recipient', emailA)),
    0,
    "A's email events (recipient) should be gone"
  );
  assert.equal(
    await rowCount('email_events', q => q.eq('event_key', `WELCOME:${userA}`)),
    0,
    "A's welcome email event should be gone"
  );
  for (const productId of productIdsA) {
    assert.equal(
      await rowCount('email_events', q => q.like('event_key', `PRODUCT_%:${productId}:%`)),
      0,
      `email events for product ${productId} should be gone`
    );
  }
  assert.equal(
    await rowCount('admin_notifications', q => q.eq('maker_id', userA)),
    0,
    "A's admin notifications should be gone"
  );
  assert.equal(
    await rowCount('admin_notifications', q => q.in('product_id', productIdsA)),
    0,
    'admin notifications for A products should be gone'
  );

  const avatarListA = await supabaseAdmin.storage.from('avatars').list(userA);
  assert.ifError(avatarListA.error);
  assert.equal(
    (avatarListA.data ?? []).length,
    0,
    "A's avatar storage folder should be empty"
  );
  for (const productId of productIdsA) {
    const listing = await supabaseAdmin.storage.from('product-images').list(productId);
    assert.ifError(listing.error);
    assert.equal(
      (listing.data ?? []).length,
      0,
      `product-images folder for ${productId} should be empty`
    );
  }

  // ── B is fully intact ──
  const authB = await supabaseAdmin.auth.admin.getUserById(userB);
  assert.ok(!authB.error && authB.data.user, 'auth user B should still exist');

  assert.equal(await rowCount('profiles', q => q.eq('id', userB)), 1, 'profile B should remain');
  assert.equal(
    await rowCount('products', q => q.eq('id', productIdsB[0])),
    1,
    "B's product should remain"
  );
  assert.equal(
    await rowCount('product_images', q => q.in('product_id', productIdsB)),
    1,
    "B's product images row should remain"
  );
  assert.equal(await rowCount('votes', q => q.eq('user_id', userB)), 1, "B's vote on own product should remain");
  assert.equal(await rowCount('comments', q => q.eq('user_id', userB)), 1, "B's comment on own product should remain");
  assert.equal(
    await rowCount('email_events', q => q.eq('event_key', `WELCOME:${userB}`)),
    1,
    "B's welcome email event should remain"
  );
  assert.ok(
    (await rowCount('admin_notifications', q => q.eq('maker_id', userB))) >= 1,
    "B's admin notifications should remain"
  );

  const avatarListB = await supabaseAdmin.storage.from('avatars').list(userB);
  assert.ifError(avatarListB.error);
  assert.ok(
    (avatarListB.data ?? []).length >= 1,
    "B's avatar storage folder should still contain files"
  );
  const productListB = await supabaseAdmin.storage.from('product-images').list(productIdsB[0]);
  assert.ifError(productListB.error);
  assert.ok(
    (productListB.data ?? []).length >= 1,
    "B's product-images folder should still contain files"
  );

  // ── categories are untouched (reference data) ──
  const { data: categoriesAfter, error: categoriesErr } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug')
    .order('id');
  assert.ifError(categoriesErr);
  assert.deepEqual(categoriesAfter ?? [], categoriesBefore, 'categories must not change');
});

test('rejects a repeat deletion attempt with the old token', async () => {
  const res = await api(
    '/api/account',
    { method: 'DELETE', body: JSON.stringify({ confirmation: 'DELETE' }) },
    tokenA
  );
  assert.equal(res.status, 401);
});

test('user B still exists after every deletion attempt', async () => {
  const res = await api(
    '/api/account',
    { method: 'DELETE', body: JSON.stringify({ confirmation: 'DELETE' }) },
    'not-a-real-token'
  );
  assert.equal(res.status, 401);
  assert.equal(await rowCount('profiles', q => q.eq('id', userB)), 1, 'B must still exist');
  assert.ok(tokenB.length > 0, 'B token was issued');
});
