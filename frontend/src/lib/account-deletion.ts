export const DELETE_CONFIRMATION = 'DELETE';

export const DELETE_STEP_ONE_TITLE = 'Delete Account?';
export const DELETE_STEP_ONE_MESSAGE =
  'Deleting your account is permanent.\n\n' +
  'Your profile, products, comments, votes, follows, uploaded images, and other account-owned data will be permanently removed.\n\n' +
  'This action cannot be undone.';
export const DELETE_STEP_ONE_CONTINUE = 'Continue';
export const DELETE_STEP_ONE_CANCEL = 'Cancel';

export const DELETE_STEP_TWO_TITLE = 'Permanently Delete Account?';
export const DELETE_STEP_TWO_HINT = 'Type DELETE to confirm.';
export const DELETE_STEP_TWO_BUTTON = 'Delete my account permanently';

export const DELETE_LOADING_LABEL = 'Deleting account...';
export const DELETE_SUCCESS_MESSAGE = 'Your account has been permanently deleted.';
export const DELETE_FAILURE_MESSAGE = 'Account deletion could not be completed. Please try again.';

export const isDeleteConfirmed = (value: string): boolean => value === DELETE_CONFIRMATION;

interface StorageLike {
  removeItem(key: string): void;
}

const resolveStorage = (storage?: StorageLike | null): StorageLike | undefined => {
  if (storage !== undefined) return storage ?? undefined;
  if (typeof localStorage === 'undefined') return undefined;
  return localStorage;
};

export const clearStoredAuthTokens = (storage?: StorageLike | null): void => {
  const store = resolveStorage(storage);
  if (!store || typeof store.removeItem !== 'function') return;
  store.removeItem('access_token');
  store.removeItem('refresh_token');
};
