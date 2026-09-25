import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import express from 'express';
import jwt from 'jsonwebtoken';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

import { isEmailEnabled } from '../src/email/emailConfig.js';
import { emailService } from '../src/email/emailService.js';
import { emailGuard } from '../src/email/emailGuard.js';
import { supabaseAdmin } from '../src/lib/supabase.js';
import { generateTokens } from '../src/middleware/auth.js';
import { apiLimiter } from '../src/middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';
import authRoutes from '../src/routes/auth.js';
import productRoutes from '../src/routes/products.js';
import adminRoutes from '../src/routes/admin.js';

const RUN = Date.now();
const PASSWORD = 'EmailDisabled-Test-123!';
const SAVED_EMAIL_ENABLED = process.env.EMAIL_ENABLED;

const setEnabled = (value: string | undefined): void => {
  if (value === undefined) delete process.env.EMAIL_ENABLED;
  else process.env.EMAIL_ENABLED = value;
};

// Explicit disabled baseline (mirrors the production default).
setEnabled('false');

// ───────────────────────────────────────────────────────────────────
// Mock Resend client — records calls; a single call while disabled fails the test
// ───────────────────────────────────────────────────────────────────
const sendCalls: { payload: any; options: any }[] = [];
const mockResend = {
  emails: {
    send: async (payload: any, options?: any) => {
      sendCalls.push({ payload, options });
      return { data: { id: `mock-disabled-${sendCalls.length}` }, error: null };
    },
  },
};
const originalResendClient = (emailService as any).resend;

// ───────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const rowCount = async (eventKey: string): Promise<number> => {
  const { count, error } = await supabaseAdmin
    .from('email_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_key', eventKey);
  assert.ifError(error);
  return count ?? 0;
};

const rowsByRecipient = async (recipient: string): Promise<any[]> => {
  const { data, error } = await supabaseAdmin
    .from('email_events')
    .select('*')
    .eq('recipient', recipient);
  assert.ifError(error);
  return data ?? [];
};

const deleteEventKeys = async (keys: string[]): Promise<void> => {
  for (const key of keys) {
    await supabaseAdmin.from('email_events').delete().eq('event_key', key);
  }
};

const createTestUser = async (email: string, role: 'user' | 'admin' = 'user'): Promise<string> => {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: `EmailDisabled ${RUN}` },
  });
  assert.ifError(error);
  const uid = data.user!.id;
  if (role === 'admin') {
    const { error: roleErr } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', uid);
    assert.ifError(roleErr);
  }
  return uid;
};

const deleteAuthUser = async (uid: string): Promise<void> => {
  if (!uid) return;
  try {
    await supabaseAdmin.auth.admin.deleteUser(uid);
  } catch (err) {
    console.warn('[emailEnabledSwitch] cleanup warning:', err);
  }
};

// Captures every console channel while running fn, returning all log lines.
const captureLogs = async (fn: () => Promise<void>): Promise<string[]> => {
  const lines: string[] = [];
  const originals = { log: console.log, error: console.error, warn: console.warn };
  const record =
    (original: (...args: any[]) => void) =>
    (...args: any[]) => {
      lines.push(args.map(String).join(' '));
      original.apply(console, args);
    };
  console.log = record(originals.log);
  console.error = record(originals.error);
  console.warn = record(originals.warn);
  try {
    await fn();
  } finally {
    console.log = originals.log;
    console.error = originals.error;
    console.warn = originals.warn;
  }
  return lines;
};

const trackedKeys: string[] = [];

// ═══════════════════════════════════════════════════════════════════
// 1. STRICT BOOLEAN PARSER (pure)
// ═══════════════════════════════════════════════════════════════════
describe('EMAIL_ENABLED strict boolean parser', () => {
  it('missing EMAIL_ENABLED -> disabled (default is false)', () => {
    assert.equal(isEmailEnabled({}), false);
    assert.equal(isEmailEnabled(), false, 'live env without the var must be disabled');
  });

  it('EMAIL_ENABLED="true" -> enabled (requirement 10)', () => {
    assert.equal(isEmailEnabled({ EMAIL_ENABLED: 'true' }), true);
  });

  it('EMAIL_ENABLED="false" -> disabled (requirement 9)', () => {
    assert.equal(isEmailEnabled({ EMAIL_ENABLED: 'false' }), false);
  });

  it('every non-exact value stays disabled', () => {
    for (const value of ['FALSE', 'False', 'TRUE', 'True', '0', '1', '', '   ', 'yes', 'on', 'enabled']) {
      assert.equal(isEmailEnabled({ EMAIL_ENABLED: value }), false, `"${value}" must be disabled`);
    }
  });

  it('only surrounding whitespace is tolerated around "true"', () => {
    assert.equal(isEmailEnabled({ EMAIL_ENABLED: '  true  ' }), true);
    assert.equal(isEmailEnabled({ EMAIL_ENABLED: ' true' }), true);
  });

  it('reflects live process.env changes', () => {
    setEnabled(undefined);
    assert.equal(isEmailEnabled(), false, 'missing -> disabled');
    setEnabled('true');
    assert.equal(isEmailEnabled(), true, '"true" -> enabled');
    setEnabled('false');
    assert.equal(isEmailEnabled(), false, '"false" -> disabled');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. DISABLED -> NO RESEND, NO DB ROWS, NO EMAIL LOGS
// ═══════════════════════════════════════════════════════════════════
describe('EMAIL_ENABLED=false: EmailService and EmailGuard no-op', () => {
  before(() => {
    setEnabled('false');
    (emailService as any).resend = mockResend;
  });

  it('all four triggers return immediately: no Resend call, no email_events row, no logs (requirements 1+2)', async () => {
    const userId = `disabled-user-${RUN}`;
    const pid = randomUUID();
    const product = {
      id: pid,
      name: 'Disabled Audit Product',
      maker_id: userId,
      updated_at: new Date().toISOString(),
    } as any;

    const keys = [
      `WELCOME:${userId}`,
      `PRODUCT_SUBMITTED:${pid}`,
      `PRODUCT_APPROVED:${pid}`,
      `PRODUCT_REJECTED:${pid}`,
    ];
    trackedKeys.push(...keys);

    const callsBefore = sendCalls.length;
    const logs = await captureLogs(async () => {
      const results = [
        await emailService.sendWelcomeEmail(userId, 'disabled-audit@example.com', 'Disabled Audit'),
        await emailService.sendProductSubmittedEmail(product, userId),
        await emailService.sendProductApprovedEmail(product),
        await emailService.sendProductRejectedEmail(product, 'Placeholder reason'),
      ];
      for (const result of results) {
        assert.equal(result.success, true, JSON.stringify(result));
        assert.equal(result.skipped, true, 'must be a silent no-op skip');
        assert.equal(result.reason, 'EMAIL_DISABLED');
      }
    });

    assert.equal(sendCalls.length, callsBefore, 'Resend must never be called while disabled');
    for (const key of keys) {
      assert.equal(await rowCount(key), 0, `no email_events row for ${key}`);
    }

    const emailLogs = logs.filter(line => /\[EmailService\]|\[EmailGuard\]|\[Resend|Resend API/i.test(line));
    assert.deepEqual(emailLogs, [], 'disabled path must produce no email logs');
  });

  it('EmailGuard.reserve/markSent/markFailed never touch email_events while disabled', async () => {
    const key = `WELCOME:guard-disabled-${RUN}`;
    trackedKeys.push(key);
    setEnabled('false');

    const reservation = await emailGuard.reserve(key, 'WELCOME', 'guard-disabled@example.com');
    assert.equal(reservation.allowed, false);
    assert.equal(reservation.reason, 'EMAIL_DISABLED');

    await emailGuard.markSent(key, 'msg_should_not_persist');
    await emailGuard.markFailed(key, 'error_should_not_persist');

    assert.equal(await rowCount(key), 0, 'guard must not insert or mutate rows');
  });

  it('missing EMAIL_ENABLED behaves as disabled (requirement 8)', async () => {
    setEnabled(undefined);
    const callsBefore = sendCalls.length;
    const userId = `missing-env-${RUN}`;
    const key = `WELCOME:${userId}`;
    trackedKeys.push(key);

    const result = await emailService.sendWelcomeEmail(userId, 'missing-env@example.com', 'Missing Env');
    assert.equal(result.success, true);
    assert.equal(result.skipped, true);
    assert.equal(result.reason, 'EMAIL_DISABLED');
    assert.equal(sendCalls.length, callsBefore, 'no Resend call when the var is missing');
    assert.equal(await rowCount(key), 0, 'no email_events row when the var is missing');

    setEnabled('false');
  });

  it('explicit EMAIL_ENABLED="false" behaves as disabled (requirement 9)', async () => {
    setEnabled('false');
    const callsBefore = sendCalls.length;
    const userId = `explicit-false-${RUN}`;
    const key = `WELCOME:${userId}`;
    trackedKeys.push(key);

    const result = await emailService.sendWelcomeEmail(userId, 'explicit-false@example.com', 'Explicit False');
    assert.equal(result.skipped, true);
    assert.equal(result.reason, 'EMAIL_DISABLED');
    assert.equal(sendCalls.length, callsBefore);
    assert.equal(await rowCount(key), 0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. BUSINESS OPERATIONS STILL SUCCEED WHILE EMAIL IS DISABLED
// ═══════════════════════════════════════════════════════════════════
describe('EMAIL_ENABLED=false: signup, submission, approval, rejection all succeed', () => {
  let server: Server;
  let baseUrl = '';
  let regularUid = '';
  let regularEmail = '';
  let regularToken = '';
  let adminUid = '';
  let adminToken = '';
  let categoryId = '';
  let createdCategoryId: string | null = null;
  const createdProductIds: string[] = [];

  const api = async (
    route: string,
    init: { method?: string; body?: string } = {},
    token?: string
  ): Promise<{ status: number; body: any }> => {
    const res = await fetch(`${baseUrl}${route}`, {
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

  const submitProduct = async (name: string, token: string): Promise<string> => {
    const res = await api(
      '/api/products',
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: 'Audit description that is long enough to validate.',
          website_url: 'https://example.com/product',
          category_id: categoryId,
        }),
      },
      token
    );
    assert.equal(res.status, 201, JSON.stringify(res.body));
    const pid = res.body.data.id as string;
    createdProductIds.push(pid);
    return pid;
  };

  before(async () => {
    setEnabled('false');
    (emailService as any).resend = mockResend;

    regularEmail = `findbuilders-disabled-maker-${RUN}@example.com`;
    regularUid = await createTestUser(regularEmail);
    regularToken = generateTokens({ sub: regularUid, email: regularEmail, role: 'user' }).access_token;

    const adminEmail = `findbuilders-disabled-admin-${RUN}@example.com`;
    adminUid = await createTestUser(adminEmail, 'admin');
    adminToken = generateTokens({ sub: adminUid, email: adminEmail, role: 'admin' }).access_token;

    const { data: cats, error: catErr } = await supabaseAdmin
      .from('categories')
      .select('id')
      .limit(1);
    assert.ifError(catErr);
    if (cats && cats.length > 0) {
      categoryId = cats[0].id;
    } else {
      const { data: createdCat, error: createErr } = await supabaseAdmin
        .from('categories')
        .insert({ name: `Email Disabled Audit ${RUN}`, slug: `email-disabled-audit-${RUN}`, product_count: 0 })
        .select('id')
        .single();
      assert.ifError(createErr);
      categoryId = createdCat.id;
      createdCategoryId = createdCat.id;
    }

    const app = express();
    app.use(express.json({ limit: '1mb' }));
    app.use(apiLimiter);
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/admin', adminRoutes);
    app.use(notFoundHandler);
    app.use(errorHandler);

    server = app.listen(0);
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    setEnabled('false');
    for (const pid of createdProductIds) {
      await supabaseAdmin.from('admin_notifications').delete().eq('product_id', pid);
      await supabaseAdmin.from('product_images').delete().eq('product_id', pid);
      await supabaseAdmin.from('products').delete().eq('id', pid);
    }
    if (createdCategoryId) {
      await supabaseAdmin.from('categories').delete().eq('id', createdCategoryId);
    }
    for (const uid of [regularUid, adminUid]) {
      await deleteAuthUser(uid);
    }
    if (server) {
      (server as any).closeAllConnections?.();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it('signup succeeds with no welcome email (requirement 3)', async () => {
    const signupEmail = `findbuilders-disabled-signup-${RUN}@example.com`;
    const callsBefore = sendCalls.length;

    const res = await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: signupEmail, password: PASSWORD, displayName: 'Disabled Signup' }),
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));

    // The welcome trigger is fire-and-forget; give it time to prove it does nothing.
    await sleep(500);

    assert.equal(sendCalls.length, callsBefore, 'signup must not call Resend');
    const rows = await rowsByRecipient(signupEmail);
    assert.equal(rows.length, 0, 'signup must not create email_events rows');

    // Cleanup the freshly created auth user (uid from the issued token).
    const accessToken = res.body?.data?.access_token as string | undefined;
    if (accessToken) {
      const payload = jwt.verify(accessToken, process.env.JWT_SECRET!) as { sub: string };
      await deleteAuthUser(payload.sub);
    }
  });

  it('product submission succeeds with no PRODUCT_SUBMITTED email (requirement 4)', async () => {
    const callsBefore = sendCalls.length;
    const pid = await submitProduct(`Disabled Submit Product ${RUN}`, regularToken);

    await sleep(500);

    assert.equal(sendCalls.length, callsBefore, 'submission must not call Resend');
    assert.equal(await rowCount(`PRODUCT_SUBMITTED:${pid}`), 0, 'no submitted event row');
  });

  it('product approval succeeds with no PRODUCT_APPROVED email (requirement 5)', async () => {
    const callsBefore = sendCalls.length;
    const pid = createdProductIds[0];

    const res = await api(`/api/admin/submissions/${pid}/approve`, { method: 'POST' }, adminToken);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body?.data?.status, 'approved');

    await sleep(500);

    assert.equal(sendCalls.length, callsBefore, 'approval must not call Resend');
    assert.equal(await rowCount(`PRODUCT_APPROVED:${pid}`), 0, 'no approved event row');
  });

  it('product rejection succeeds with no PRODUCT_REJECTED email (requirement 6)', async () => {
    const callsBefore = sendCalls.length;

    // Rejection email only fires on pending -> rejected, so use a fresh pending product.
    const pid = await submitProduct(`Disabled Reject Product ${RUN}`, regularToken);

    const res = await api(
      `/api/admin/submissions/${pid}/reject`,
      { method: 'POST', body: JSON.stringify({ reason: 'Audit rejection while email is disabled' }) },
      adminToken
    );
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body?.data?.status, 'rejected');

    await sleep(500);

    assert.equal(sendCalls.length, callsBefore, 'rejection must not call Resend');
    assert.equal(await rowCount(`PRODUCT_REJECTED:${pid}`), 0, 'no rejected event row');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. ENABLED -> EXISTING IMPLEMENTATION USED UNCHANGED
// ═══════════════════════════════════════════════════════════════════
describe('EMAIL_ENABLED=true: existing email implementation is used unchanged', () => {
  before(() => {
    setEnabled('true');
    (emailService as any).resend = mockResend;
  });

  after(() => {
    setEnabled('false');
  });

  it('welcome email reaches Resend with the deterministic idempotency key and one SENT row (requirement 7)', async () => {
    const userId = `enabled-user-${RUN}`;
    const key = `WELCOME:${userId}`;
    trackedKeys.push(key);
    const callsBefore = sendCalls.length;

    const first = await emailService.sendWelcomeEmail(userId, 'enabled-audit@example.com', 'Enabled Audit');
    assert.equal(first.success, true, JSON.stringify(first));
    assert.ok(!first.skipped, 'enabled send must not be skipped');
    assert.equal(sendCalls.length, callsBefore + 1, 'Resend called exactly once');

    const call = sendCalls[callsBefore];
    assert.equal(call.options?.idempotencyKey, `welcome/${userId}`, 'existing idempotency key derivation unchanged');
    assert.ok(call.payload.html.includes('FindBuilders'), 'existing renderer used');

    assert.equal(await rowCount(key), 1);
    const { data: row } = await supabaseAdmin
      .from('email_events')
      .select('status, provider_message_id')
      .eq('event_key', key)
      .single();
    assert.equal(row?.status, 'SENT');
    assert.equal(row?.provider_message_id, `mock-disabled-${sendCalls.length}`);

    // Exactly-once guard still active when enabled.
    const second = await emailService.sendWelcomeEmail(userId, 'enabled-audit@example.com', 'Enabled Audit');
    assert.equal(second.skipped, true);
    assert.equal(sendCalls.length, callsBefore + 1, 'duplicate still blocked');
    assert.equal(await rowCount(key), 1);
  });

  it('EmailGuard reserves and marks events when enabled (requirement 7)', async () => {
    const key = `WELCOME:enabled-guard-${RUN}`;
    trackedKeys.push(key);
    setEnabled('true');

    const reservation = await emailGuard.reserve(key, 'WELCOME', 'enabled-guard@example.com');
    assert.equal(reservation.allowed, true, JSON.stringify(reservation));
    await emailGuard.markSent(key, 'msg_enabled_123');
    assert.equal(await rowCount(key), 1);

    const { data: row } = await supabaseAdmin
      .from('email_events')
      .select('status, provider_message_id')
      .eq('event_key', key)
      .single();
    assert.equal(row?.status, 'SENT');
    assert.equal(row?.provider_message_id, 'msg_enabled_123');
  });
});

// ───────────────────────────────────────────────────────────────────
// Global cleanup: restore env and remove every row this file created
// ───────────────────────────────────────────────────────────────────
after(async () => {
  setEnabled(SAVED_EMAIL_ENABLED);
  (emailService as any).resend = originalResendClient;
  await deleteEventKeys([...new Set(trackedKeys)]);
});
