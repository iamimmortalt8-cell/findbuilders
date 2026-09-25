/**
 * READ-ONLY / TEST-MODE EMAIL AUDIT (throwaway audit runner)
 *
 * Rules enforced here:
 *  - Recipients: ONLY Resend official test addresses (@resend.dev) or reserved
 *    non-deliverable domains. Never a real user mailbox.
 *  - EMAIL_TEST_MODE is forced false IN-PROCESS so no redirect to the owner's
 *    real mailbox can happen. .env / Render / Resend config are NOT touched.
 *  - No code, SQL, or config is modified. Side effects limited to: test sends
 *    to Resend test recipients + matching test rows in email_events +
 *    one temporary Supabase auth user (deleted at the end).
 */

// Must run before emailService resolves recipients (read per-send from process.env)
process.env.EMAIL_TEST_MODE = 'false';

import { emailService, idempotencyKeyForEvent } from './src/email/emailService.js';
import { emailGuard } from './src/email/emailGuard.js';
import { emailRenderer } from './src/email/emailRenderer.js';
import { supabaseAdmin } from './src/lib/supabase.js';

const RUN = Date.now();
const RESEND_KEY = process.env.RESEND_API_KEY!.trim();
const FROM = process.env.EMAIL_FROM?.trim() || 'FindBuilders <onboarding@resend.dev>';

const results: Record<string, any> = {};
const newMessageIds: string[] = [];

function log(step: string, data: any) {
  results[step] = data;
  console.log(`\n### ${step}\n${JSON.stringify(data, null, 1)}`);
}

async function resendApi(path: string, init?: RequestInit): Promise<{ status: number; body: any }> {
  const res = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  let body: any = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

async function listMessages(): Promise<Map<string, any>> {
  const { body } = await resendApi('/emails?limit=100');
  const map = new Map<string, any>();
  for (const m of body?.data ?? []) map.set(m.id, m);
  return map;
}

async function rowsFor(keys: string[]): Promise<any[]> {
  const { data } = await supabaseAdmin
    .from('email_events')
    .select('event_key,event_type,recipient,status,provider_message_id,sent_at,error_message')
    .in('event_key', keys);
  return data ?? [];
}

async function main() {
  const baseline = await listMessages();
  log('0_baseline', {
    emailTestMode: process.env.EMAIL_TEST_MODE,
    from: FROM,
    resendMessagesBefore: baseline.size,
    probeAcceptedEarlier: '01a0d751-7da7-7649-b5be-0df10e8c6cf0',
  });

  // ── A. TEMPLATE RENDER AUDIT (no sends) ────────────────────────────────
  const tWelcome = emailRenderer.renderWelcome({ userEmail: 'delivered+welcome-audit@resend.dev', userName: 'Audit User' });
  const tSubmitted = emailRenderer.renderProductSubmitted({
    userEmail: 'delivered+maker-audit@resend.dev', userName: 'Audit Maker',
    productId: `audit-product-sub-${RUN}`, productName: 'Audit Product Submitted',
  });
  const tApproved = emailRenderer.renderProductApproved({
    userEmail: 'delivered+maker-audit@resend.dev', userName: 'Audit Maker',
    productId: `audit-product-app-${RUN}`, productName: 'Audit Product Approved',
  });
  const tRejected = emailRenderer.renderProductRejected({
    userEmail: 'delivered+maker-audit@resend.dev', userName: 'Audit Maker',
    productId: `audit-product-rej-${RUN}`, productName: 'Audit Product Rejected',
    rejectionReason: 'Audit: placeholder reason for template verification',
  });

  const templates: Record<string, any> = {};
  for (const [name, t] of Object.entries({ welcome: tWelcome, submitted: tSubmitted, approved: tApproved, rejected: tRejected })) {
    templates[name] = {
      subject: t.subject,
      htmlBytes: t.html.length,
      textBytes: t.text.length,
      hasLogo: t.html.includes('https://findbuilders.pages.dev/findbuilderslogo.png'),
      hasLogoAlt: t.html.includes('alt="FindBuilders Logo"'),
      hasFindbuildersApp: t.html.includes('findbuilders.app') || t.text.includes('findbuilders.app'),
      hasPagesDevLinks: t.html.includes('https://findbuilders.pages.dev'),
      hasUnsubscribe: /unsubscribe/i.test(t.html),
      textPreview: t.text.slice(0, 120).replace(/\s+/g, ' '),
    };
  }
  log('A_templates_rendered', templates);

  // ── B. REAL SENDS: all four types through emailService ────────────────
  const welcomeKey = `WELCOME:audit-welcome-${RUN}`;
  const r1 = await emailService.sendWelcomeEmail(
    `audit-welcome-${RUN}`, 'delivered+welcome-audit@resend.dev', 'Audit Welcome'
  );
  log('B1_welcome_send', { result: r1, expectedKey: welcomeKey, idempotencyKey: idempotencyKeyForEvent(welcomeKey) });

  // Duplicate attempt on the SAME logical event -> must be blocked, no 2nd message
  const r1b = await emailService.sendWelcomeEmail(
    `audit-welcome-${RUN}`, 'delivered+welcome-audit@resend.dev', 'Audit Welcome'
  );
  log('B2_welcome_duplicate_blocked', { result: r1b, expectedReason: 'ALREADY_SENT' });

  // Temporary maker auth user whose email IS an official test recipient,
  // so resolveUser() resolves to a test address (never a real mailbox).
  const makerEmail = 'delivered+maker-audit@resend.dev';
  const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
    email: makerEmail,
    password: `Audit-Only-${RUN}-Pass!`,
    email_confirm: true,
    user_metadata: { display_name: 'Audit Maker' },
  });
  if (cErr) throw new Error(`maker user create failed: ${cErr.message}`);
  const makerUid = created.user!.id;
  log('B3_temp_maker_user', { makerUid, makerEmail, note: 'deleted during cleanup' });

  const subProd = { id: `audit-product-sub-${RUN}`, name: 'Audit Product Submitted', maker_id: makerUid, updated_at: new Date().toISOString() } as any;
  const r2 = await emailService.sendProductSubmittedEmail(subProd, makerUid);
  log('B4_product_submitted_send', { result: r2, expectedKey: `PRODUCT_SUBMITTED:${subProd.id}` });

  const appProd = { id: `audit-product-app-${RUN}`, name: 'Audit Product Approved', maker_id: makerUid, updated_at: new Date().toISOString() } as any;
  const r3 = await emailService.sendProductApprovedEmail(appProd);
  log('B5_product_approved_send', { result: r3, expectedKey: `PRODUCT_APPROVED:${appProd.id}` });

  const rejProd = { id: `audit-product-rej-${RUN}`, name: 'Audit Product Rejected', maker_id: makerUid, updated_at: new Date().toISOString() } as any;
  const r4 = await emailService.sendProductRejectedEmail(rejProd, 'Audit: placeholder reason for template verification');
  log('B6_product_rejected_send', { result: r4, expectedKey: `PRODUCT_REJECTED:${rejProd.id}` });

  // ── C. EmailGuard: 5 concurrent identical triggers -> 1 row / 1 message ─
  const concProd = { id: `audit-product-conc-${RUN}`, name: 'Audit Product Concurrent', maker_id: makerUid, updated_at: new Date().toISOString() } as any;
  const concResults = await Promise.all(
    Array.from({ length: 5 }, () => emailService.sendProductSubmittedEmail(concProd, makerUid))
  );
  const concAccepted = concResults.filter(r => r.success && !r.skipped).length;
  const concRow = (await rowsFor([`PRODUCT_SUBMITTED:${concProd.id}`]))[0];
  log('C1_concurrent_5x', {
    acceptedCount: concAccepted,
    messageId: concResults.map(r => r.messageId).filter(Boolean),
    dbRows: await rowsFor([`PRODUCT_SUBMITTED:${concProd.id}`]),
    expect: 'acceptedCount=1, exactly 1 row, status SENT',
    rowOk: concAccepted === 1 && concRow?.status === 'SENT',
  });

  // ── D. FAILED -> retry SAME key -> eventually SENT (one row) ──────────
  const retryKey = `PRODUCT_SUBMITTED:audit-retry-${RUN}`;
  const ghost = await emailService.sendTransactionalEmail({
    eventKey: retryKey,
    eventType: 'PRODUCT_SUBMITTED',
    recipient: 'audit-ghost@findbuilders.test', // reserved .test TLD: undeliverable; expect API 403
    subject: tSubmitted.subject,
    html: tSubmitted.html,
    text: tSubmitted.text,
    metadata: { audit: true, phase: 'expected-failure' },
  });
  const failedRow = (await rowsFor([retryKey]))[0];
  log('D1_forced_failure', { result: ghost, row: failedRow, expect: 'success=false, row status FAILED with provider error' });

  const retry = await emailService.sendTransactionalEmail({
    eventKey: retryKey,
    eventType: 'PRODUCT_SUBMITTED',
    recipient: 'delivered+retry-audit@resend.dev',
    subject: tSubmitted.subject,
    html: tSubmitted.html,
    text: tSubmitted.text,
    metadata: { audit: true, phase: 'retry' },
  });
  const retriedRows = await rowsFor([retryKey]);
  log('D2_retry_same_key', {
    result: retry, rows: retriedRows,
    expect: 'SENT, still exactly 1 row, same event_key, provider_message_id set',
    oneRow: retriedRows.length === 1,
  });

  // ── E. Resend event behavior: bounced / complained / suppressed ────────
  const evtIds: Record<string, string> = {};
  for (const [label, addr] of [
    ['bounced', 'bounced+audit@resend.dev'],
    ['complained', 'complained+audit@resend.dev'],
    ['suppressed', 'suppressed+audit@resend.dev'],
  ] as const) {
    const { status, body } = await resendApi('/emails', {
      method: 'POST',
      headers: { 'Idempotency-Key': `audit-evt-${label}-${RUN}` },
      body: JSON.stringify({
        from: FROM,
        to: [addr],
        subject: `FindBuilders audit — event simulation (${label})`,
        html: `<p>audit event simulation: ${label}</p>`,
        text: `audit event simulation: ${label}`,
      }),
    });
    if (body?.id) { evtIds[label] = body.id; newMessageIds.push(body.id); }
    log(`E1_send_${label}`, { status, id: body?.id, error: body?.message });
  }

  // ── F. Resend idempotency-key behavior (raw API, mirrors SDK header) ───
  const idemKey = `audit-idem-${RUN}`;
  const idemPayload = {
    from: FROM, to: ['delivered+idem-audit@resend.dev'],
    subject: 'FindBuilders audit — idempotency A', html: '<p>idem A</p>', text: 'idem A',
  };
  const i1 = await resendApi('/emails', { method: 'POST', headers: { 'Idempotency-Key': idemKey }, body: JSON.stringify(idemPayload) });
  const i2 = await resendApi('/emails', { method: 'POST', headers: { 'Idempotency-Key': idemKey }, body: JSON.stringify(idemPayload) });
  const i3 = await resendApi('/emails', {
    method: 'POST', headers: { 'Idempotency-Key': idemKey },
    body: JSON.stringify({ ...idemPayload, subject: 'FindBuilders audit — idempotency B (different payload)' }),
  });
  if (i1.body?.id) newMessageIds.push(i1.body.id);
  log('F1_idempotency', {
    first: { status: i1.status, id: i1.body?.id },
    repeatSamePayload: { status: i2.status, id: i2.body?.id, sameId: i1.body?.id === i2.body?.id },
    differentPayloadSameKey: { status: i3.status, id: i3.body?.id, message: i3.body?.message ?? i3.body?.name },
    expect: 'repeat => same id (no dup); different payload => 409',
  });

  // ── G. Collect final states (poll up to ~75s for async event settle) ────
  const templateIds = [r1.messageId, r2.messageId, r3.messageId, r4.messageId, retry.messageId].filter(Boolean) as string[];
  newMessageIds.push(...templateIds);
  const watch = [...templateIds, ...Object.values(evtIds), '01a0d751-7da7-7649-b5be-0df10e8c6cf0'];
  const states: Record<string, any> = {};
  const deadline = Date.now() + 75_000;
  do {
    for (const id of watch) {
      const { body } = await resendApi(`/emails/${id}`);
      if (body) states[id] = { to: body.to, from: body.from, subject: body.subject, last_event: body.last_event ?? body.state, created_at: body.created_at };
    }
    const settled = watch.every(id => !['sent', 'processed', 'queued'].includes(String(states[id]?.last_event)));
    if (settled) break;
    await new Promise(r => setTimeout(r, 5000));
  } while (Date.now() < deadline);
  log('G1_resend_message_states', states);

  // HTML content verification from provider side for one delivered template message
  if (r1.messageId) {
    const { body } = await resendApi(`/emails/${r1.messageId}`);
    const html: string = body?.html ?? '';
    log('G2_provider_stored_html_check', {
      htmlReturned: html.length > 0,
      htmlBytes: html.length,
      hasLogo: html.includes('findbuilderspages.dev') || html.includes('findbuilders.pages.dev/findbuilderslogo.png') || undefined,
      subject: body?.subject,
      to: body?.to,
      note: 'subject/to verified even if html not returned by API',
    });
  }

  // ── H. DB final state for every audit key ──────────────────────────────
  const auditKeys = [
    welcomeKey, `PRODUCT_SUBMITTED:${subProd.id}`, `PRODUCT_APPROVED:${appProd.id}`,
    `PRODUCT_REJECTED:${rejProd.id}`, `PRODUCT_SUBMITTED:${concProd.id}`, retryKey,
  ];
  const dbRows = await rowsFor(auditKeys);
  log('H1_email_events_final', {
    rows: dbRows,
    expect: '6 rows, each exactly once; 5 SENT + retry key SENT after FAILED; provider_message_id set on SENT',
  });

  // New messages vs baseline — prove nothing outside test recipients was touched
  const after = await listMessages();
  const createdMsgs: any[] = [];
  for (const [id, m] of after) if (!baseline.has(id)) createdMsgs.push({ id, to: m.to, subject: m.subject, last_event: m.last_event ?? m.state });
  log('H2_messages_created_by_audit', { count: createdMsgs.length, messages: createdMsgs });

  // ── Cleanup: temporary maker user only (rows kept as evidence) ─────────
  const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(makerUid);
  log('I1_cleanup', { makerUserDeleted: !delErr, error: delErr?.message ?? null, note: 'email_events audit rows intentionally kept for evidence' });

  console.log('\n=== AUDIT RUN COMPLETE ===');
}

main()
  .catch(async (e) => {
    console.error('AUDIT RUN FAILED:', e);
    console.log('PARTIAL RESULTS:\n' + JSON.stringify(results, null, 1));
    process.exitCode = 1;
  })
  .finally(() => setTimeout(() => process.exit(process.exitCode ?? 0), 1500));
