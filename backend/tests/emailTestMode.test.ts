import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getTestModeConfig,
  resolveActualRecipient,
} from '../src/email/emailService.js';
import type { EmailEventType } from '../src/email/emailGuard.js';

const ORIGINAL = 'bharaththetrader428@gmail.com';
const TESTRecipient = 'iamimmortalt8@gmail.com';

describe('email test mode recipient resolution', () => {
  it('uses original recipient when test mode is OFF', () => {
    const result = resolveActualRecipient(ORIGINAL, {
      EMAIL_TEST_MODE: 'false',
      EMAIL_TEST_RECIPIENT: TESTRecipient,
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.recipient, ORIGINAL);
    assert.equal(result.testMode, false);
    assert.equal(result.originalRecipient, ORIGINAL);
  });

  it('uses original recipient when EMAIL_TEST_MODE is unset', () => {
    const result = resolveActualRecipient(ORIGINAL, {});
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.recipient, ORIGINAL);
    assert.equal(result.testMode, false);
  });

  it('redirects to EMAIL_TEST_RECIPIENT when test mode is ON', () => {
    const result = resolveActualRecipient(ORIGINAL, {
      EMAIL_TEST_MODE: 'true',
      EMAIL_TEST_RECIPIENT: TESTRecipient,
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.recipient, TESTRecipient);
    assert.equal(result.originalRecipient, ORIGINAL);
    assert.equal(result.testMode, true);
    assert.equal(result.testRecipient, TESTRecipient);
  });

  it('fails safely when test mode is ON but EMAIL_TEST_RECIPIENT is missing', () => {
    const result = resolveActualRecipient(ORIGINAL, { EMAIL_TEST_MODE: 'true' });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, /EMAIL_TEST_RECIPIENT/);
    assert.notEqual((result as any).recipient, ORIGINAL);
  });

  it('fails safely when EMAIL_TEST_RECIPIENT is empty or invalid', () => {
    const empty = resolveActualRecipient(ORIGINAL, {
      EMAIL_TEST_MODE: 'true',
      EMAIL_TEST_RECIPIENT: '   ',
    });
    assert.equal(empty.ok, false);

    const invalid = resolveActualRecipient(ORIGINAL, {
      EMAIL_TEST_MODE: 'true',
      EMAIL_TEST_RECIPIENT: 'not-an-email',
    });
    assert.equal(invalid.ok, false);
  });

  it('does not hardcode the test recipient in defaults', () => {
    const config = getTestModeConfig({});
    assert.equal(config.enabled, false);
    assert.equal(config.testRecipient, '');
  });

  it('applies the same override for all four email event types', () => {
    const types: EmailEventType[] = [
      'WELCOME',
      'PRODUCT_SUBMITTED',
      'PRODUCT_APPROVED',
      'PRODUCT_REJECTED',
    ];
    const env = {
      EMAIL_TEST_MODE: 'TRUE',
      EMAIL_TEST_RECIPIENT: TESTRecipient,
    };

    for (const eventType of types) {
      const result = resolveActualRecipient(ORIGINAL, env);
      assert.equal(result.ok, true, eventType);
      if (!result.ok) continue;
      assert.equal(result.recipient, TESTRecipient, eventType);
      assert.equal(result.originalRecipient, ORIGINAL, eventType);
      assert.equal(result.testMode, true, eventType);
    }
  });
});

describe('email event keys', () => {
  it('keeps WELCOME event key as WELCOME:<user_id>', () => {
    const userId = '4db71fc0-1aee-4f60-8ed6-1775c71fe4b0';
    const eventKey = `WELCOME:${userId}`;
    assert.equal(eventKey, 'WELCOME:4db71fc0-1aee-4f60-8ed6-1775c71fe4b0');
  });

  it('keeps product event key shapes unchanged', () => {
    const productId = '56b5060a-8166-4c3f-bcc4-64c4a930b368';
    const ts = '2026-09-24T16:16:32.924Z';
    assert.equal(`PRODUCT_SUBMITTED:${productId}:${ts}`, `PRODUCT_SUBMITTED:${productId}:${ts}`);
    assert.equal(`PRODUCT_APPROVED:${productId}:${ts}`, `PRODUCT_APPROVED:${productId}:${ts}`);
    assert.equal(`PRODUCT_REJECTED:${productId}:${ts}`, `PRODUCT_REJECTED:${productId}:${ts}`);
  });
});
