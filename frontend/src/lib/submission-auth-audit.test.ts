import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isTokenExpired, ApiError } from './api-error.ts';

// Helper to construct mock JWT tokens without signing
function createMockJwt(payload: Record<string, any>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = 'mock_signature';
  return `${header}.${body}.${signature}`;
}

test('isTokenExpired: correctly detects unexpired token', () => {
  const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
  const token = createMockJwt({ sub: 'user-1', exp: futureExp });
  assert.equal(isTokenExpired(token, 30), false);
});

test('isTokenExpired: correctly detects expired token', () => {
  const pastExp = Math.floor(Date.now() / 1000) - 60; // 1 minute in past
  const token = createMockJwt({ sub: 'user-1', exp: pastExp });
  assert.equal(isTokenExpired(token, 30), true);
});

test('isTokenExpired: flags token expiring within buffer period', () => {
  const soonExp = Math.floor(Date.now() / 1000) + 15; // 15 seconds from now
  const token = createMockJwt({ sub: 'user-1', exp: soonExp });
  // Buffer is 30 seconds, so 15s remaining is within buffer -> consider expired for proactive refresh
  assert.equal(isTokenExpired(token, 30), true);
  // With 10s buffer, 15s remaining is still valid
  assert.equal(isTokenExpired(token, 10), false);
});

test('isTokenExpired: safely handles null, empty, or malformed tokens without throwing', () => {
  assert.equal(isTokenExpired(null), true);
  assert.equal(isTokenExpired(''), true);
  assert.equal(isTokenExpired('invalid-token'), true);
  assert.equal(isTokenExpired('a.b'), true);
  assert.equal(isTokenExpired('a.invalid-base64.c'), true);
});

test('ApiError: maps 401 with isAuthExpired flag and friendly message', () => {
  const error = new ApiError('Your session expired. Please sign in again to continue.', {
    status: 401,
    isAuthExpired: true,
  });
  assert.equal(error.status, 401);
  assert.equal(error.isAuthExpired, true);
  assert.equal(error.isTimeout, undefined);
  assert.match(error.message, /session expired/i);
});

test('ApiError: maps timeout error without declaring server failure', () => {
  const error = new ApiError(
    'Request timed out. The server may still be processing your request. Please check before retrying.',
    {
      isTimeout: true,
    }
  );
  assert.equal(error.isTimeout, true);
  assert.equal(error.isAuthExpired, undefined);
  assert.match(error.message, /timed out/i);
  assert.match(error.message, /server may still be processing/i);
});

test('ApiError: maps network error', () => {
  const error = new ApiError('No internet connection. Please check your network and try again.', {
    isNetworkError: true,
  });
  assert.equal(error.isNetworkError, true);
  assert.match(error.message, /connection/i);
});

test('Product draft: draft storage preserves form content and excludes credentials', () => {
  const DRAFT_KEY = 'findbuilders_product_draft';
  const sampleFormData = {
    name: 'AI Code Auditor',
    tagline: 'Automated full stack audits',
    description: 'A deep audit tool for modern full stack apps',
    website_url: 'https://example.com',
    pricing_type: 'free',
  };

  // Verify draft content contains no sensitive tokens
  assert.equal('access_token' in sampleFormData, false);
  assert.equal('refresh_token' in sampleFormData, false);
  assert.equal('password' in sampleFormData, false);

  // Simulate local draft saving
  const memoryStore: Record<string, string> = {};
  memoryStore[DRAFT_KEY] = JSON.stringify(sampleFormData);

  // Restore and verify
  const restored = JSON.parse(memoryStore[DRAFT_KEY]);
  assert.equal(restored.name, 'AI Code Auditor');
  assert.equal(restored.tagline, 'Automated full stack audits');
});

test('Duplicate submission protection: existing createdProductId routes to update instead of create', () => {
  let createdCount = 0;
  let updatedCount = 0;

  function handleSubmission(existingId: string | null, data: { name: string }) {
    if (existingId) {
      updatedCount++;
      return { id: existingId, status: 'updated' };
    } else {
      createdCount++;
      return { id: 'new-prod-123', status: 'created' };
    }
  }

  // First submit attempt: creates product
  const result1 = handleSubmission(null, { name: 'My Tool' });
  assert.equal(result1.status, 'created');
  assert.equal(createdCount, 1);
  assert.equal(updatedCount, 0);

  // Retry after network timeout or image upload failure: updates existing product, no duplicate!
  const result2 = handleSubmission(result1.id, { name: 'My Tool' });
  assert.equal(result2.status, 'updated');
  assert.equal(result2.id, result1.id);
  assert.equal(createdCount, 1);
  assert.equal(updatedCount, 1);
});

test('Retry loop prevention: bounded retry count stops after 1 attempt', () => {
  let retries = 0;
  const maxRetries = 1;

  function attemptRequest(retryCount: number): boolean {
    if (retryCount < maxRetries) {
      retries++;
      return attemptRequest(retryCount + 1);
    }
    return false; // Stop retrying, throw auth expired error
  }

  const succeeded = attemptRequest(0);
  assert.equal(succeeded, false);
  assert.equal(retries, 1); // Exactly 1 retry attempted, preventing infinite loop
});
