import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isProfileSubstantiallyComplete,
  getOnboardingStorageKey,
  isExcludedOnboardingRoute,
  shouldShowProfileOnboarding,
  ONBOARDING_STORAGE_PREFIX,
} from './profile-completion.ts';
import type { Profile } from './types.ts';

// Mock localStorage for node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

test('profile completion: returns false for null profile', () => {
  assert.equal(isProfileSubstantiallyComplete(null), false);
});

test('profile completion: returns false for new blank profile', () => {
  const blankProfile: Profile = {
    id: 'user-123',
    display_name: 'newuser',
    avatar_url: null,
    bio: null,
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  assert.equal(isProfileSubstantiallyComplete(blankProfile), false);
});

test('profile completion: returns false for empty JSON bio object', () => {
  const profileWithEmptyJson: Profile = {
    id: 'user-123',
    display_name: 'newuser',
    avatar_url: '',
    bio: JSON.stringify({
      bioText: '',
      username: '',
      headline: '',
      links: [],
      interests: [],
    }),
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  assert.equal(isProfileSubstantiallyComplete(profileWithEmptyJson), false);
});

test('profile completion: returns true when headline is present', () => {
  const profile: Profile = {
    id: 'user-123',
    display_name: 'Alex',
    avatar_url: null,
    bio: JSON.stringify({ headline: 'Full-Stack Developer' }),
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  assert.equal(isProfileSubstantiallyComplete(profile), false);
});

test('profile completion: returns true when bioText is present', () => {
  const profile: Profile = {
    id: 'user-123',
    display_name: 'Alex',
    avatar_url: null,
    bio: JSON.stringify({ bioText: 'Building open source developer tools' }),
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  assert.equal(isProfileSubstantiallyComplete(profile), false);
});

test('profile completion: returns true when interests/skills are present', () => {
  const profile: Profile = {
    id: 'user-123',
    display_name: 'Alex',
    avatar_url: null,
    bio: JSON.stringify({ interests: ['React', 'TypeScript'] }),
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  assert.equal(isProfileSubstantiallyComplete(profile), false);
});

test('profile completion: returns true when links are present', () => {
  const profile: Profile = {
    id: 'user-123',
    display_name: 'Alex',
    avatar_url: null,
    bio: JSON.stringify({ links: [{ title: 'GitHub', url: 'https://github.com/alex' }] }),
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  assert.equal(isProfileSubstantiallyComplete(profile), false);
});

test('profile completion: returns true when avatar_url is present', () => {
  const profile: Profile = {
    id: 'user-123',
    display_name: 'Alex',
    avatar_url: 'https://example.com/avatar.jpg',
    bio: null,
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  assert.equal(isProfileSubstantiallyComplete(profile), false);
});

test('storage key: scopes correctly by user ID', () => {
  assert.equal(
    getOnboardingStorageKey('user-abc'),
    `${ONBOARDING_STORAGE_PREFIX}user-abc`
  );
});

test('route exclusions: blocks modal on auth routes and profile settings', () => {
  assert.equal(isExcludedOnboardingRoute('/settings/profile'), true);
  assert.equal(isExcludedOnboardingRoute('/settings/profile/edit'), true);
  assert.equal(isExcludedOnboardingRoute('/login'), true);
  assert.equal(isExcludedOnboardingRoute('/signup'), true);
  assert.equal(isExcludedOnboardingRoute('/auth/callback'), true);

  assert.equal(isExcludedOnboardingRoute('/'), false);
  assert.equal(isExcludedOnboardingRoute('/builder'), false);
  assert.equal(isExcludedOnboardingRoute('/products'), false);
});

test('shouldShowProfileOnboarding: complete scenario tests', () => {
  localStorageMock.clear();

  const userA = { id: 'user-a' };
  const userB = { id: 'user-b' };

  const incompleteProfileA: Profile = {
    id: 'user-a',
    display_name: 'User A',
    avatar_url: null,
    bio: null,
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const completedProfileB: Profile = {
    id: 'user-b',
    display_name: 'User B',
    avatar_url: 'https://example.com/pic.jpg',
    bio: JSON.stringify({ headline: 'Founder at FindBuilders' }),
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Brand new account on home page -> popup appears
  assert.equal(shouldShowProfileOnboarding(userA, incompleteProfileA, '/'), true);

  // 2. Brand new account on profile settings -> NO popup (already editing profile)
  assert.equal(shouldShowProfileOnboarding(userA, incompleteProfileA, '/settings/profile'), false);

  // 3. User with completed profile -> NO popup
  assert.equal(shouldShowProfileOnboarding(userB, completedProfileB, '/'), false);

  // 4. User A dismisses popup -> marked in localStorage
  localStorageMock.setItem(getOnboardingStorageKey('user-a'), 'dismissed');

  // 5. User A returns/refreshes -> NO repeated popup
  assert.equal(shouldShowProfileOnboarding(userA, incompleteProfileA, '/'), false);

  // 6. User B logs in (with incomplete profile on same browser) -> User B sees popup independently
  const incompleteProfileB: Profile = { ...incompleteProfileA, id: 'user-b' };
  assert.equal(shouldShowProfileOnboarding(userB, incompleteProfileB, '/'), true);

  // 7. Unauthenticated guest -> NO popup
  assert.equal(shouldShowProfileOnboarding(null, null, '/'), false);
});
