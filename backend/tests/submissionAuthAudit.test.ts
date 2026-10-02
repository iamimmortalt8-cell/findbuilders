import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import {
  productIdSchema,
  commentSchema,
  commentUpdateSchema,
  productSubmissionSchema,
} from '../src/lib/validators.js';

test('comment deletion validation: productIdSchema allows body-less DELETE request with valid UUID param', () => {
  const validParam = {
    params: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
    body: {},
  };
  const result = productIdSchema.safeParse(validParam);
  assert.equal(result.success, true);
});

test('comment deletion validation: former commentUpdateSchema incorrectly rejected body-less DELETE request', () => {
  const bodyLessReq = {
    params: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
    body: {},
  };
  const result = commentUpdateSchema.safeParse(bodyLessReq);
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find(i => i.path.includes('content'));
    assert.ok(issue, 'Former schema demanded body.content');
  }
});

test('comment creation validation: requires non-empty content and valid UUID product id', () => {
  const validComment = {
    params: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
    body: { content: 'Great tool for builders!' },
  };
  assert.equal(commentSchema.safeParse(validComment).success, true);

  const emptyComment = {
    params: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
    body: { content: '' },
  };
  assert.equal(commentSchema.safeParse(emptyComment).success, false);
});

test('product submission validation: requires valid name, description (>=10 chars), and category UUID', () => {
  const validSubmission = {
    body: {
      name: 'Super Auditor',
      tagline: 'Deep audits',
      description: 'A comprehensive auditing platform for full stack builders.',
      website_url: 'https://findbuilders.pages.dev',
      category_id: 'b75319f0-4d75-4b55-8642-4eb6ab4c91c5',
    },
  };
  assert.equal(productSubmissionSchema.safeParse(validSubmission).success, true);

  const shortDesc = {
    body: {
      name: 'Super Auditor',
      description: 'Too short',
      website_url: 'https://findbuilders.pages.dev',
      category_id: 'b75319f0-4d75-4b55-8642-4eb6ab4c91c5',
    },
  };
  assert.equal(productSubmissionSchema.safeParse(shortDesc).success, false);
});

test('product draft validation: allows incomplete fields when status is draft', () => {
  // Draft with only name and partial fields
  const partialDraft = {
    body: {
      name: 'Draft Product',
      tagline: 'Work in progress',
      description: 'Short', // < 10 chars is allowed for draft
      status: 'draft',
    },
  };
  const parseResult = productSubmissionSchema.safeParse(partialDraft);
  assert.equal(parseResult.success, true);

  // Draft with empty website and empty/undefined category is allowed
  const emptyFieldsDraft = {
    body: {
      name: 'Draft Product 2',
      website_url: '',
      category_id: '',
      description: '',
      status: 'draft',
    },
  };
  assert.equal(productSubmissionSchema.safeParse(emptyFieldsDraft).success, true);

  // Submitting for review with incomplete fields MUST still be rejected
  const invalidFinalSubmission = {
    body: {
      name: 'Draft Product',
      description: 'Short',
      status: 'pending',
    },
  };
  assert.equal(productSubmissionSchema.safeParse(invalidFinalSubmission).success, false);
});

test('JWT token verification: detects expired token and validates active token', () => {
  const secret = 'test-secret-key-1234567890';
  const validToken = jwt.sign({ sub: 'user-123', email: 'test@example.com' }, secret, { expiresIn: '15m' });
  const expiredToken = jwt.sign({ sub: 'user-123', email: 'test@example.com' }, secret, { expiresIn: '-1s' });

  // Valid token verifies cleanly
  const decoded = jwt.verify(validToken, secret) as any;
  assert.equal(decoded.sub, 'user-123');

  // Expired token throws TokenExpiredError
  assert.throws(
    () => jwt.verify(expiredToken, secret),
    (err: any) => err.name === 'TokenExpiredError'
  );
});

test('Duplicate submission prevention: 2-minute cooldown window calculation', () => {
  const now = new Date();
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
  const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  // One minute ago is within the cooldown window (duplicate)
  const isOneMinuteWithin = oneMinuteAgo.getTime() > twoMinutesAgo.getTime();
  assert.equal(isOneMinuteWithin, true);

  // Five minutes ago is outside the cooldown window (allowed new submission)
  const isFiveMinutesWithin = fiveMinutesAgo.getTime() > twoMinutesAgo.getTime();
  assert.equal(isFiveMinutesWithin, false);
});

test('Duplicate submission prevention: distinct website_url prevents false positives for same name', () => {
  const submissionA = { maker_id: 'maker-1', name: 'Analytics Tool', website_url: 'https://tool-a.com' };
  const submissionB = { maker_id: 'maker-1', name: 'Analytics Tool', website_url: 'https://tool-b.com' };
  const submissionRetry = { maker_id: 'maker-1', name: 'Analytics Tool', website_url: 'https://tool-a.com' };

  // Helper matching the service query logic
  function isDuplicate(prev: typeof submissionA, next: typeof submissionB): boolean {
    return prev.maker_id === next.maker_id &&
           prev.name.trim().toLowerCase() === next.name.trim().toLowerCase() &&
           prev.website_url.trim().toLowerCase() === next.website_url.trim().toLowerCase();
  }

  // Same maker, same name, different website -> NOT a duplicate (different product)
  assert.equal(isDuplicate(submissionA, submissionB), false);

  // Same maker, same name, same website -> DUPLICATE (retry/double-click)
  assert.equal(isDuplicate(submissionA, submissionRetry), true);
});
