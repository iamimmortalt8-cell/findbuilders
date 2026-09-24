import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DELETE_CONFIRMATION,
  DELETE_STEP_ONE_TITLE,
  DELETE_STEP_ONE_MESSAGE,
  DELETE_STEP_ONE_CONTINUE,
  DELETE_STEP_ONE_CANCEL,
  DELETE_STEP_TWO_TITLE,
  DELETE_STEP_TWO_HINT,
  DELETE_STEP_TWO_BUTTON,
  DELETE_LOADING_LABEL,
  DELETE_SUCCESS_MESSAGE,
  DELETE_FAILURE_MESSAGE,
  isDeleteConfirmed,
  clearStoredAuthTokens,
} from './account-deletion.ts';

test('required step-1 copy is exact', () => {
  assert.equal(DELETE_STEP_ONE_TITLE, 'Delete Account?');
  assert.equal(
    DELETE_STEP_ONE_MESSAGE,
    'Deleting your account is permanent.\n\nYour profile, products, comments, votes, follows, uploaded images, and other account-owned data will be permanently removed.\n\nThis action cannot be undone.'
  );
  assert.equal(DELETE_STEP_ONE_CONTINUE, 'Continue');
  assert.equal(DELETE_STEP_ONE_CANCEL, 'Cancel');
});

test('required step-2 copy is exact', () => {
  assert.equal(DELETE_STEP_TWO_TITLE, 'Permanently Delete Account?');
  assert.equal(DELETE_STEP_TWO_HINT, 'Type DELETE to confirm.');
  assert.equal(DELETE_STEP_TWO_BUTTON, 'Delete my account permanently');
  assert.equal(DELETE_LOADING_LABEL, 'Deleting account...');
  assert.equal(DELETE_SUCCESS_MESSAGE, 'Your account has been permanently deleted.');
  assert.equal(DELETE_FAILURE_MESSAGE, 'Account deletion could not be completed. Please try again.');
  assert.equal(DELETE_CONFIRMATION, 'DELETE');
});

test('confirmation button only enables on exact DELETE', () => {
  assert.equal(isDeleteConfirmed('DELETE'), true);
  assert.equal(isDeleteConfirmed('delete'), false);
  assert.equal(isDeleteConfirmed(' DELETE'), false);
  assert.equal(isDeleteConfirmed('DELETE '), false);
  assert.equal(isDeleteConfirmed('DELETEED'), false);
  assert.equal(isDeleteConfirmed(''), false);
});

test('clearStoredAuthTokens removes access and refresh tokens only', () => {
  const removed: string[] = [];
  const store = {
    removeItem(key: string) {
      removed.push(key);
    },
  };
  clearStoredAuthTokens(store);
  assert.deepEqual(removed, ['access_token', 'refresh_token']);
});

test('clearStoredAuthTokens does nothing without a storage object', () => {
  assert.doesNotThrow(() => clearStoredAuthTokens(null));
});
