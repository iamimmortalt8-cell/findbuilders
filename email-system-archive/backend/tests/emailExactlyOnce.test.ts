import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';

import {
  emailService,
  EmailService,
  idempotencyKeyForEvent,
  resolveActualRecipient,
} from '../src/email/emailService.js';
import { EmailGuard } from '../src/email/emailGuard.js';
import {
  emailRenderer,
  EmailRenderer,
} from '../src/email/emailRenderer.js';
import {
  FINDBUILDERS_LOGO_URL,
  resolveAppUrl,
} from '../src/email/components/UniversalEmailTemplate.js';
import { supabaseAdmin } from '../src/lib/supabase.js';
import { generateTokens } from '../src/middleware/auth.js';
import { apiLimiter } from '../src/middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';
import authRoutes from '../src/routes/auth.js';
import profileRoutes from '../src/routes/profiles.js';
import categoryRoutes from '../src/routes/categories.js';
import productRoutes from '../src/routes/products.js';
import adminRoutes from '../src/routes/admin.js';

const RUN = Date.now();
const PASSWORD = 'EmailAudit-Test-123!';
const ORIGINAL_EMAIL_FROM_EVENTS: string[] = [];

// This suite verifies the ENABLED implementation (EMAIL_ENABLED=true ->
// existing behavior unchanged). The production default is disabled.
process.env.EMAIL_ENABLED = 'true';

// ───────────────────────────────────────────────────────────────────
// Mock Resend client (never sends real email during tests)
// ───────────────────────────────────────────────────────────────────
interface SendCall {
  payload: any;
  options: any;
}
const sendCalls: SendCall[] = [];
let failNextSends = 0;
const mockResend = {
  emails: {
    send: async (payload: any, options?: any) => {
      sendCalls.push({ payload, options });
      if (failNextSends > 0) {
        failNextSends -= 1;
        return { data: null, error: { message: 'Mock transient Resend failure' } };
      }
      return { data: { id: `mock-message-${sendCalls.length}` }, error: null };
    },
  },
};

const originalResendClient = (emailService as any).resend;

// ───────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────
const getEvent = async (eventKey: string) => {
  const { data, error } = await supabaseAdmin
    .from('email_events')
    .select('*')
    .eq('event_key', eventKey)
    .maybeSingle();
  assert.ifError(error);
  return data as any;
};

const eventRowCount = async (eventKey: string): Promise<number> => {
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

const createTestUser = async (email: string): Promise<string> => {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: `EmailAudit ${RUN}` },
  });
  assert.ifError(error);
  const uid = data.user!.id;
  ORIGINAL_EMAIL_FROM_EVENTS.push(email);
  return uid;
};

const waitFor = async (condition: () => Promise<boolean>, timeoutMs = 20000): Promise<boolean> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await condition()) return true;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  return false;
};

const productFixture = (id: string, makerId: string) => ({
  id,
  name: 'Audit Product',
  maker_id: makerId,
  updated_at: new Date().toISOString(),
});

// ═══════════════════════════════════════════════════════════════════
// 1. TEMPLATE / LOGO / GMAIL-SAFETY VERIFICATION (pure)
// ═══════════════════════════════════════════════════════════════════
describe('email HTML: logo, absolute URLs, Gmail-safe structure', () => {
  const productId = randomUUID();

  const renderAll = () => ({
    welcome: emailRenderer.renderWelcome({ userEmail: 'user@example.com', userName: 'Test User' }),
    submitted: emailRenderer.renderProductSubmitted({
      userEmail: 'user@example.com',
      userName: 'Test User',
      productId,
      productName: 'My Product',
    }),
    approved: emailRenderer.renderProductApproved({
      userEmail: 'user@example.com',
      userName: 'Test User',
      productId,
      productName: 'My Product',
    }),
    rejected: emailRenderer.renderProductRejected({
      userEmail: 'user@example.com',
      userName: 'Test User',
      productId,
      productName: 'My Product',
      rejectionReason: 'Please add screenshots and a longer description.',
    }),
  });

  const assertEmailSafe = (label: string, html: string) => {
    // 1. Logo <img> exists with absolute HTTPS production asset
    const imgMatch = html.match(/<img[^>]*>/);
    assert.ok(imgMatch, `${label}: logo <img> must exist`);
    const imgTag = imgMatch![0];
    assert.ok(imgTag.includes(`src="${FINDBUILDERS_LOGO_URL}"`), `${label}: logo src must be exactly ${FINDBUILDERS_LOGO_URL}`);
    assert.ok(imgTag.includes('https://findbuilders.pages.dev'), `${label}: logo src must contain findbuilders.pages.dev`);

    // 2-5. src safety
    assert.ok(!html.includes('localhost'), `${label}: must not contain localhost`);
    assert.ok(!html.includes('127.0.0.1'), `${label}: must not contain 127.0.0.1`);
    assert.ok(!html.includes('findbuilders.app'), `${label}: must not contain findbuilders.app`);
    assert.ok(!/src="(?!https:\/\/)/.test(html), `${label}: no relative/broken image src allowed`);

    // 6-7. width + alt
    assert.ok(/width="\d+"/.test(imgTag), `${label}: logo must define explicit width`);
    assert.ok(imgTag.includes('alt='), `${label}: logo must define alt text`);
    assert.ok(imgTag.includes('display: block'), `${label}: logo must be display:block`);

    // 8. No JavaScript / external CSS / background-image content dependencies
    assert.ok(!html.includes('<script'), `${label}: must not contain JavaScript`);
    assert.ok(!html.includes('<link'), `${label}: must not depend on external stylesheets`);
    assert.ok(!html.includes('url('), `${label}: must not depend on background images`);

    // All links must be absolute HTTPS to a live origin
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
    assert.ok(hrefs.length > 0, `${label}: must contain links`);
    for (const href of hrefs) {
      assert.ok(href.startsWith('https://'), `${label}: non-https href: ${href}`);
      assert.ok(!href.includes('findbuilders.app'), `${label}: dead-domain href: ${href}`);
      assert.ok(!href.includes('localhost'), `${label}: localhost href: ${href}`);
    }

    // Branding / design preserved
    assert.ok(html.includes('FindBuilders'), `${label}: must contain FindBuilders branding`);
    assert.ok(html.includes('#D8C7A5'), `${label}: must keep beige CTA color`);
    assert.ok(html.includes('#151D19'), `${label}: must keep dark green card`);
    assert.ok(html.includes('All Rights Reserved'), `${label}: must keep footer`);
  };

  it('all four templates render with a valid production logo and email-safe HTML', () => {
    const rendered = renderAll();
    assertEmailSafe('WELCOME', rendered.welcome.html);
    assertEmailSafe('PRODUCT_SUBMITTED', rendered.submitted.html);
    assertEmailSafe('PRODUCT_APPROVED', rendered.approved.html);
    assertEmailSafe('PRODUCT_REJECTED', rendered.rejected.html);
  });

  it('all four templates keep correct subjects, CTA and purpose copy', () => {
    const r = renderAll();
    assert.equal(r.welcome.subject, 'Welcome to FindBuilders!');
    assert.ok(r.welcome.html.includes('/settings/profile'), 'welcome CTA');
    assert.ok(r.submitted.html.includes('/builder'), 'submitted CTA');
    assert.ok(r.approved.html.includes(productId), 'approved CTA links to product');
    assert.ok(r.rejected.html.includes('Please add screenshots'), 'rejection reason box');
    assert.ok(r.rejected.html.includes('Rejection Reason'), 'rejection label');
    assert.ok(r.submitted.html.includes('review'), 'submitted purpose copy');
  });

  it('text alternatives are safe (no dead domains / localhost)', () => {
    const r = renderAll();
    for (const [label, text] of Object.entries(r)) {
      assert.ok(!text.text.includes('localhost'), `${label} text: localhost`);
      assert.ok(!text.text.includes('findbuilders.app'), `${label} text: findbuilders.app`);
      assert.ok(text.text.includes('FindBuilders'), `${label} text: branding`);
    }
  });

  it('never uses findbuilders.app for links even when configured via APP_URL', () => {
    const renderer = new EmailRenderer('https://findbuilders.app');
    const html = renderer.renderWelcome({ userEmail: 'a@b.com', userName: 'A' }).html;
    assert.ok(!html.includes('findbuilders.app'), 'configured dead domain must be ignored');
    assert.ok(html.includes('https://findbuilders.pages.dev'), 'must fall back to live origin');

    assert.equal(resolveAppUrl('https://findbuilders.app'), 'https://findbuilders.pages.dev');
    assert.equal(resolveAppUrl('https://findbuilders.app/'), 'https://findbuilders.pages.dev');
    assert.equal(resolveAppUrl(undefined), 'https://findbuilders.pages.dev');
    assert.equal(resolveAppUrl('https://custom-domain.com'), 'https://custom-domain.com');
  });

  it('reference template backend/email-template/index.html matches production logo URL', () => {
    const refPath = path.resolve(process.cwd(), 'email-template', 'index.html');
    const ref = fs.readFileSync(refPath, 'utf8');
    assert.ok(ref.includes(FINDBUILDERS_LOGO_URL), 'reference template must use the production logo URL');
    assert.ok(!ref.includes('findbuilders.app'), 'reference template must not use dead domain');
    assert.ok(!ref.includes('localhost'), 'reference template must not use localhost');
  });

  it('production logo asset actually returns HTTP 200', async () => {
    const response = await fetch(FINDBUILDERS_LOGO_URL, {
      signal: AbortSignal.timeout(20000),
    });
    assert.equal(response.status, 200, `logo asset status was ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    assert.ok(contentType.startsWith('image/'), `logo content-type was ${contentType}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    assert.ok(bytes.length > 1000, 'logo payload must not be empty');
    // PNG magic bytes
    assert.equal(bytes[0], 0x89);
    assert.equal(bytes[1], 0x50);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. CANONICAL EVENT KEYS + IDEMPOTENCY KEY (pure)
// ═══════════════════════════════════════════════════════════════════
describe('canonical event keys and Resend idempotency keys', () => {
  it('derives deterministic idempotency keys from the logical event key', () => {
    assert.equal(idempotencyKeyForEvent('WELCOME:user-1'), 'welcome/user-1');
    assert.equal(idempotencyKeyForEvent('PRODUCT_SUBMITTED:prod-1'), 'product-submitted/prod-1');
    assert.equal(idempotencyKeyForEvent('PRODUCT_APPROVED:prod-1'), 'product-approved/prod-1');
    assert.equal(idempotencyKeyForEvent('PRODUCT_REJECTED:prod-1'), 'product-rejected/prod-1');
  });

  it('idempotency keys are deterministic (no random/timestamp component)', () => {
    const key = 'PRODUCT_SUBMITTED:' + randomUUID();
    assert.equal(idempotencyKeyForEvent(key), idempotencyKeyForEvent(key));
    assert.ok(!idempotencyKeyForEvent(key).includes(String(Date.now())));
  });

  it('idempotency keys satisfy Resend constraints (1-256 chars)', () => {
    const samples = [
      `WELCOME:${randomUUID()}`,
      `PRODUCT_SUBMITTED:${randomUUID()}`,
      `PRODUCT_APPROVED:${randomUUID()}`,
      `PRODUCT_REJECTED:${randomUUID()}`,
    ];
    for (const sample of samples) {
      const derived = idempotencyKeyForEvent(sample);
      assert.ok(derived.length >= 1 && derived.length <= 256, `${sample} -> ${derived.length}`);
    }
  });

  it('product event keys are permanent (no transition timestamps)', async () => {
    // Verify the source of emailService contains no timestamped key construction
    const srcPath = path.resolve(process.cwd(), 'src', 'email', 'emailService.ts');
    const src = fs.readFileSync(srcPath, 'utf8');
    assert.ok(!/eventKey = `PRODUCT_SUBMITTED:\$\{[^}]+\}:\$\{/.test(src), 'submitted key must not embed timestamp');
    assert.ok(!/eventKey = `PRODUCT_APPROVED:\$\{[^}]+\}:\$\{/.test(src), 'approved key must not embed timestamp');
    assert.ok(!/eventKey = `PRODUCT_REJECTED:\$\{[^}]+\}:\$\{/.test(src), 'rejected key must not embed timestamp');
    assert.ok(src.includes('eventKey = `PRODUCT_SUBMITTED:${product.id}`'), 'permanent submitted key');
    assert.ok(src.includes('eventKey = `PRODUCT_APPROVED:${product.id}`'), 'permanent approved key');
    assert.ok(src.includes('eventKey = `PRODUCT_REJECTED:${product.id}`'), 'permanent rejected key');
    assert.ok(src.includes('eventKey = `WELCOME:${userId}`'), 'permanent welcome key');
    assert.ok(src.includes('{ idempotencyKey }'), 'Resend send must pass idempotencyKey');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. EXACTLY-ONCE DELIVERY (real Supabase + mocked Resend)
// ═══════════════════════════════════════════════════════════════════
describe('exactly-once logical emails (EmailGuard + Resend idempotency)', () => {
  const trackedKeys: string[] = [];
  let userA = '';
  let userB = '';
  let emailA = '';
  let emailB = '';

  before(async () => {
    (emailService as any).resend = mockResend;
    emailA = `findbuilders-eta-${RUN}-a@example.com`;
    emailB = `findbuilders-eta-${RUN}-b@example.com`;
    userA = await createTestUser(emailA);
    userB = await createTestUser(emailB);
  });

  after(async () => {
    (emailService as any).resend = originalResendClient;
    await deleteEventKeys(trackedKeys);
    for (const uid of [userA, userB]) {
      if (uid) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(uid);
        } catch (err) {
          console.warn('[emailExactlyOnce] cleanup warning:', err);
        }
      }
    }
  });

  it('A+B: signup welcome — sent once, second call blocked, exactly one row', async () => {
    const key = `WELCOME:${userA}`;
    trackedKeys.push(key);
    const before = sendCalls.length;

    const first = await emailService.sendWelcomeEmail(userA, emailA, 'Email Audit A');
    assert.equal(first.success, true, JSON.stringify(first));

    const second = await emailService.sendWelcomeEmail(userA, emailA, 'Email Audit A');
    assert.equal(second.success, false);
    assert.equal(second.skipped, true);

    assert.equal(sendCalls.length - before, 1, 'Resend must be called exactly once');
    assert.equal(await eventRowCount(key), 1, 'exactly one DB event row');

    const event = await getEvent(key);
    assert.equal(event.status, 'SENT');
    assert.equal(event.event_type, 'WELCOME');
    assert.equal(event.recipient, emailA, 'stored recipient must stay original (test mode does not change it)');

    // Resend request behavior
    const call = sendCalls[before];
    assert.equal(call.options?.idempotencyKey, `welcome/${userA}`);
    const resolved = resolveActualRecipient(emailA);
    assert.equal(call.payload.to, resolved.ok ? resolved.recipient : null, 'delivery recipient follows test mode');
    assert.ok(call.payload.html.includes('FindBuilders'), 'payload includes rendered HTML');
    assert.ok(call.payload.subject.length > 0, 'payload includes subject');
  });

  it('C: five concurrent WELCOME triggers -> 1 event row, 1 Resend request', async () => {
    const key = `WELCOME:${userB}`;
    trackedKeys.push(key);
    const before = sendCalls.length;

    const results = await Promise.all(
      Array.from({ length: 5 }, () => emailService.sendWelcomeEmail(userB, emailB, 'Email Audit B'))
    );

    const succeeded = results.filter(r => r.success).length;
    const skipped = results.filter(r => r.skipped).length;
    assert.equal(succeeded, 1, 'exactly one send succeeds');
    assert.equal(skipped, 4, 'the other four are blocked by the guard');
    assert.equal(sendCalls.length - before, 1, 'Resend must be called exactly once');
    assert.equal(await eventRowCount(key), 1, 'exactly one DB event row');
    assert.equal((await getEvent(key)).status, 'SENT');
  });

  it('D+E: PRODUCT_SUBMITTED — once and double-triggered => one email ever', async () => {
    const pid = randomUUID();
    const key = `PRODUCT_SUBMITTED:${pid}`;
    trackedKeys.push(key);
    const before = sendCalls.length;

    const first = await emailService.sendProductSubmittedEmail(productFixture(pid, userA), userA);
    const second = await emailService.sendProductSubmittedEmail(productFixture(pid, userA), userA);

    assert.equal(first.success, true, JSON.stringify(first));
    assert.equal(second.success, false);
    assert.equal(second.skipped, true);
    assert.equal(sendCalls.length - before, 1);
    assert.equal(await eventRowCount(key), 1);
    assert.equal((await getEvent(key)).event_type, 'PRODUCT_SUBMITTED');
    assert.equal(sendCalls[before].options?.idempotencyKey, `product-submitted/${pid}`);
  });

  it('concurrent PRODUCT_SUBMITTED triggers -> one email', async () => {
    const pid = randomUUID();
    const key = `PRODUCT_SUBMITTED:${pid}`;
    trackedKeys.push(key);
    const before = sendCalls.length;

    const results = await Promise.all(
      Array.from({ length: 5 }, () => emailService.sendProductSubmittedEmail(productFixture(pid, userA), userA))
    );

    assert.equal(results.filter(r => r.success).length, 1);
    assert.equal(sendCalls.length - before, 1);
    assert.equal(await eventRowCount(key), 1);
  });

  it('F+G: PRODUCT_APPROVED — once and double-triggered => one email ever', async () => {
    const pid = randomUUID();
    const key = `PRODUCT_APPROVED:${pid}`;
    trackedKeys.push(key);
    const before = sendCalls.length;

    const first = await emailService.sendProductApprovedEmail(productFixture(pid, userA));
    const second = await emailService.sendProductApprovedEmail(productFixture(pid, userA));
    assert.equal(first.success, true, JSON.stringify(first));
    assert.equal(second.skipped, true);
    assert.equal(sendCalls.length - before, 1);
    assert.equal(await eventRowCount(key), 1);
    assert.equal(sendCalls[before].options?.idempotencyKey, `product-approved/${pid}`);
  });

  it('concurrent PRODUCT_APPROVED triggers -> one email', async () => {
    const pid = randomUUID();
    const key = `PRODUCT_APPROVED:${pid}`;
    trackedKeys.push(key);
    const before = sendCalls.length;

    const results = await Promise.all(
      Array.from({ length: 5 }, () => emailService.sendProductApprovedEmail(productFixture(pid, userA)))
    );
    assert.equal(results.filter(r => r.success).length, 1);
    assert.equal(sendCalls.length - before, 1);
    assert.equal(await eventRowCount(key), 1);
  });

  it('H+I: PRODUCT_REJECTED — once and double-triggered => one email ever', async () => {
    const pid = randomUUID();
    const key = `PRODUCT_REJECTED:${pid}`;
    trackedKeys.push(key);
    const before = sendCalls.length;

    const first = await emailService.sendProductRejectedEmail(productFixture(pid, userA), 'Needs work');
    const second = await emailService.sendProductRejectedEmail(productFixture(pid, userA), 'Needs work again');
    assert.equal(first.success, true, JSON.stringify(first));
    assert.equal(second.skipped, true);
    assert.equal(sendCalls.length - before, 1);
    assert.equal(await eventRowCount(key), 1);
    assert.equal(sendCalls[before].options?.idempotencyKey, `product-rejected/${pid}`);
  });

  it('concurrent PRODUCT_REJECTED triggers -> one email', async () => {
    const pid = randomUUID();
    const key = `PRODUCT_REJECTED:${pid}`;
    trackedKeys.push(key);
    const before = sendCalls.length;

    const results = await Promise.all(
      Array.from({ length: 5 }, () => emailService.sendProductRejectedEmail(productFixture(pid, userA), 'Nope'))
    );
    assert.equal(results.filter(r => r.success).length, 1);
    assert.equal(sendCalls.length - before, 1);
    assert.equal(await eventRowCount(key), 1);
  });

  it('J: FAILED email retries the SAME event key and ends with one email/one row', async () => {
    const pid = randomUUID();
    const key = `PRODUCT_SUBMITTED:${pid}`;
    trackedKeys.push(key);
    const before = sendCalls.length;

    // First attempt: provider rejects (transient failure)
    failNextSends = 1;
    const failed = await emailService.sendProductSubmittedEmail(productFixture(pid, userA), userA);
    assert.equal(failed.success, false);
    let event = await getEvent(key);
    assert.equal(event.status, 'FAILED');
    assert.equal(event.event_key, key, 'failure keeps the same event key');

    // Retry: succeeds — same key, no new event created
    const retried = await emailService.sendProductSubmittedEmail(productFixture(pid, userA), userA);
    assert.equal(retried.success, true, JSON.stringify(retried));
    event = await getEvent(key);
    assert.equal(event.status, 'SENT');

    assert.equal(await eventRowCount(key), 1, 'retry must not create a second event row');
    assert.equal(sendCalls.length - before, 2, 'two provider attempts total');

    // Both attempts used the IDENTICAL Resend idempotency key (no random UUIDs)
    assert.equal(sendCalls[before].options?.idempotencyKey, `product-submitted/${pid}`);
    assert.equal(sendCalls[before + 1].options?.idempotencyKey, `product-submitted/${pid}`);

    // A further trigger after SENT is blocked with no provider call
    const third = await emailService.sendProductSubmittedEmail(productFixture(pid, userA), userA);
    assert.equal(third.skipped, true);
    assert.equal(sendCalls.length - before, 2, 'SENT event is never re-sent');
  });

  it('K+L: process restart (fresh EmailService/Guard instances) does not re-send', async () => {
    const key = `WELCOME:${userA}`;
    const before = sendCalls.length;

    // Simulate Render/backend restart: brand-new service object, state must come from the DB
    const freshService = new EmailService();
    (freshService as any).resend = mockResend;
    const result = await freshService.sendWelcomeEmail(userA, emailA, 'Email Audit A');
    assert.equal(result.success, false);
    assert.equal(result.skipped, true);
    assert.equal(sendCalls.length - before, 0, 'restart must not trigger a provider call');

    // Fresh guard instance reads the same persistent event state
    const freshGuard = new EmailGuard();
    const event = await freshGuard.getEvent(key);
    assert.ok(event, 'event state is persistent');
    assert.equal(event!.status, 'SENT');
    assert.equal(await eventRowCount(key), 1);
  });

  it('every Resend request carries a deterministic logical idempotency key', () => {
    assert.ok(sendCalls.length >= 9, 'expected multiple provider calls were recorded');
    for (const call of sendCalls) {
      const key = call.options?.idempotencyKey;
      assert.ok(typeof key === 'string' && key.length > 0, 'idempotencyKey is required');
      assert.ok(key.length <= 256, 'idempotencyKey max 256 chars');
      assert.match(key, /^(welcome|product-submitted|product-approved|product-rejected)\//);
      assert.ok(!/\d{13}/.test(key), 'idempotencyKey must not embed timestamps');
    }
  });

  it('database holds exactly one row per logical email for every key used', async () => {
    const uniqueKeys = [...new Set(trackedKeys)];
    assert.ok(uniqueKeys.length >= 8, 'expected coverage of all four email types');
    for (const key of uniqueKeys) {
      assert.equal(await eventRowCount(key), 1, `expected exactly one row for ${key}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. NO PAGE-LOAD / GET TRIGGERS (HTTP, real routes, mocked Resend)
// ═══════════════════════════════════════════════════════════════════
describe('no email triggers on GET requests, refreshes or sign-in', () => {
  const trackedKeys: string[] = [];
  const trackedEmails: string[] = [];
  let server: Server;
  let baseUrl = '';
  let regularUid = '';
  let adminUid = '';
  let regularEmail = '';
  let regularToken = '';
  let adminToken = '';

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

  const noEmailForRow = async (uid: string, email: string): Promise<void> => {
    const key = `WELCOME:${uid}`;
    assert.equal(await eventRowCount(key), 0, `unexpected welcome event for ${uid}`);
    const rows = await rowsByRecipient(email);
    assert.equal(rows.length, 0, `unexpected email events for ${email}`);
  };

  before(async () => {
    (emailService as any).resend = mockResend;

    regularEmail = `findbuilders-trigger-${RUN}@example.com`;
    trackedEmails.push(regularEmail);
    regularUid = await createTestUser(regularEmail);

    const adminEmail = `findbuilders-trigger-admin-${RUN}@example.com`;
    trackedEmails.push(adminEmail);
    adminUid = await createTestUser(adminEmail);
    const { error: roleErr } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', adminUid);
    assert.ifError(roleErr);

    regularToken = generateTokens({ sub: regularUid, email: regularEmail, role: 'user' }).access_token;
    adminToken = generateTokens({ sub: adminUid, email: adminEmail, role: 'admin' }).access_token;

    const app = express();
    app.use(helmetlessJson());
    app.use(apiLimiter);
    app.use('/api/auth', authRoutes);
    app.use('/api/profiles', profileRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/admin', adminRoutes);
    app.use(notFoundHandler);
    app.use(errorHandler);

    server = app.listen(0);
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    (emailService as any).resend = originalResendClient;
    await deleteEventKeys(trackedKeys);
    for (const uid of [regularUid, adminUid]) {
      if (uid) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(uid);
        } catch (err) {
          console.warn('[emailTriggerAudit] cleanup warning:', err);
        }
      }
    }
    if (server) {
      (server as any).closeAllConnections?.();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it('GET page loads (home feed, categories, admin, my-products, /me) send no email', async () => {
    const callsBefore = sendCalls.length;

    const responses = await Promise.all([
      api('/api/products'),
      api('/api/categories'),
      api('/api/auth/me', {}, regularToken),
      api('/api/products/my-products', {}, regularToken),
      api('/api/admin/submissions', {}, adminToken),
      api('/api/admin/stats', {}, adminToken),
    ]);
    for (const res of responses) {
      assert.equal(res.status, 200, `expected 200, got ${res.status} for response ${JSON.stringify(res.body)}`);
    }

    assert.equal(sendCalls.length, callsBefore, 'GET requests must not call Resend');
    await noEmailForRow(regularUid, regularEmail);
    await noEmailForRow(adminUid, trackedEmails[1]);
  });

  it('repeat GET refreshes still send no email', async () => {
    const callsBefore = sendCalls.length;
    for (let i = 0; i < 3; i++) {
      const res = await api('/api/products/my-products', {}, regularToken);
      assert.equal(res.status, 200);
      const admin = await api('/api/admin/submissions', {}, adminToken);
      assert.equal(admin.status, 200);
    }
    assert.equal(sendCalls.length, callsBefore);
    await noEmailForRow(regularUid, regularEmail);
  });

  it('sign-in does not send email', async () => {
    const callsBefore = sendCalls.length;
    const res = await api('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: regularEmail, password: PASSWORD }),
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(sendCalls.length, callsBefore, 'sign-in must not send email');
    await noEmailForRow(regularUid, regularEmail);
  });

  it('A: HTTP signup produces exactly ONE welcome event and one Resend request', async () => {
    const signupEmail = `findbuilders-trigger-signup-${RUN}@example.com`;
    trackedEmails.push(signupEmail);
    const callsBefore = sendCalls.length;

    const res = await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: signupEmail, password: PASSWORD, displayName: 'Trigger Audit' }),
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));

    // Wait for the row to exist AND be finalized (reserve inserts SENDING first;
    // markSent follows one round trip later).
    const appeared = await waitFor(async () => {
      const rows = await rowsByRecipient(signupEmail);
      return rows.length === 1 && rows[0].status === 'SENT';
    });
    assert.ok(appeared, 'welcome event row should be created and marked SENT');
    const event = (await rowsByRecipient(signupEmail))[0];
    if (event?.event_key) trackedKeys.push(event.event_key);
    assert.equal(event.event_key, `WELCOME:${event.metadata?.userId ?? event.event_key.split(':')[1]}`);
    assert.equal(event.event_type, 'WELCOME');
    assert.equal(event.status, 'SENT');
    assert.equal(sendCalls.length, callsBefore + 1, 'exactly one Resend request for signup');

    // Repeated signup attempt (duplicate API request) must not create a second email
    const dup = await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: signupEmail, password: PASSWORD, displayName: 'Trigger Audit' }),
    });
    assert.equal(dup.status, 400, 'duplicate signup is rejected');
    assert.equal(sendCalls.length, callsBefore + 1, 'no second email for duplicate signup');
    assert.equal((await rowsByRecipient(signupEmail)).length, 1, 'exactly one welcome row');
  });
});

// JSON body parsing only (avoid importing helmet/cors to keep the audit app minimal)
function helmetlessJson() {
  return express.json({ limit: '1mb' });
}
