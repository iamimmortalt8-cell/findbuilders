import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { EmailGuard } from '../src/email/emailGuard.js';
import { supabaseAdmin } from '../src/lib/supabase.js';

// This suite verifies the ENABLED implementation (EMAIL_ENABLED=true ->
// existing behavior unchanged). The production default is disabled.
process.env.EMAIL_ENABLED = 'true';

const guard = new EmailGuard(`.email_events_test_${process.pid}.json`);
const testKeys: string[] = [];

after(async () => {
  if (testKeys.length > 0) {
    await supabaseAdmin.from('email_events').delete().in('event_key', testKeys);
  }
});

describe('EmailGuard persistence and retry', () => {
  it('keeps WELCOME event key as WELCOME:<user_id>', async () => {
    const userId = `test-user-${Date.now()}`;
    const eventKey = `WELCOME:${userId}`;
    testKeys.push(eventKey);

    const reservation = await guard.reserve(eventKey, 'WELCOME', 'original@example.com');
    assert.equal(reservation.allowed, true);
    assert.equal(reservation.event?.event_key, eventKey);
    assert.equal(reservation.event?.recipient, 'original@example.com');
  });

  it('FAILED event can retry via reservation', async () => {
    const eventKey = `WELCOME:retry-${Date.now()}`;
    testKeys.push(eventKey);

    const first = await guard.reserve(eventKey, 'WELCOME', 'original@example.com');
    assert.equal(first.allowed, true);
    await guard.markFailed(eventKey, 'simulated provider failure');

    const retry = await guard.reserve(eventKey, 'WELCOME', 'original@example.com');
    assert.equal(retry.allowed, true);
    assert.equal(retry.reason, 'RETRY_ALLOWED');
    assert.equal(retry.event?.status, 'SENDING');
  });

  it('successful response marks event SENT', async () => {
    const eventKey = `WELCOME:sent-${Date.now()}`;
    testKeys.push(eventKey);

    await guard.reserve(eventKey, 'WELCOME', 'original@example.com');
    await guard.markSent(eventKey, 'msg_test_123');

    const { data } = await supabaseAdmin
      .from('email_events')
      .select('status, provider_message_id, sent_at')
      .eq('event_key', eventKey)
      .single();

    assert.equal(data?.status, 'SENT');
    assert.equal(data?.provider_message_id, 'msg_test_123');
    assert.ok(data?.sent_at);
  });

  it('already SENT event does not resend', async () => {
    const eventKey = `WELCOME:no-resend-${Date.now()}`;
    testKeys.push(eventKey);

    await guard.reserve(eventKey, 'WELCOME', 'original@example.com');
    await guard.markSent(eventKey, 'msg_already_sent');

    const again = await guard.reserve(eventKey, 'WELCOME', 'original@example.com');
    assert.equal(again.allowed, false);
    assert.equal(again.reason, 'ALREADY_SENT');
  });

  it('supports all four allowed email event types', async () => {
    const types = [
      'WELCOME',
      'PRODUCT_SUBMITTED',
      'PRODUCT_APPROVED',
      'PRODUCT_REJECTED',
    ] as const;

    for (const eventType of types) {
      const eventKey = `${eventType}:types-${Date.now()}-${eventType}`;
      testKeys.push(eventKey);
      const reservation = await guard.reserve(eventKey, eventType, 'original@example.com');
      assert.equal(reservation.allowed, true, eventType);
      assert.equal(reservation.event?.event_type, eventType);
    }
  });
});
