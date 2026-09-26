import type { Profile } from './types.ts';
import { parseBio } from './types.ts';

export const ONBOARDING_STORAGE_PREFIX = 'findbuilders_profile_onboarding_';

export const EXCLUDED_ONBOARDING_ROUTES = [
  '/settings/profile',
  '/login',
  '/signup',
  '/auth/callback',
];

/**
 * Returns the user-scoped localStorage key for profile onboarding status.
 */
export function getOnboardingStorageKey(userId: string): string {
  return `${ONBOARDING_STORAGE_PREFIX}${userId}`;
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage;
  }
  return null;
}

/**
 * Returns true if the user has already seen or acted on the profile onboarding popup.
 */
export function hasSeenProfileOnboarding(userId: string): boolean {
  if (!userId) return false;
  try {
    const storage = getStorage();
    if (!storage) return false;
    const val = storage.getItem(getOnboardingStorageKey(userId));
    return val !== null;
  } catch {
    return false;
  }
}

/**
 * Marks profile onboarding as dismissed for this specific user.
 */
export function markProfileOnboardingDismissed(userId: string): void {
  if (!userId) return;
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(getOnboardingStorageKey(userId), 'dismissed');
  } catch (e) {
    console.error('Failed to set profile onboarding flag:', e);
  }
}

/**
 * Marks profile onboarding as completed (or in-progress via CTA) for this specific user.
 */
export function markProfileOnboardingComplete(userId: string): void {
  if (!userId) return;
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(getOnboardingStorageKey(userId), 'completed');
  } catch (e) {
    console.error('Failed to set profile onboarding flag:', e);
  }
}

/**
 * Checks whether the current path is excluded from showing the onboarding popup
 * (e.g. auth pages or the profile settings editor itself).
 */
export function isExcludedOnboardingRoute(pathname: string): boolean {
  if (!pathname) return false;
  return EXCLUDED_ONBOARDING_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
}

/**
 * Determines whether a profile is substantially complete.
 * A profile is considered complete if the user has provided substantive builder info:
 * headline, bioText, interests/skills, social/portfolio links, custom username, or avatar.
 */
export function isProfileSubstantiallyComplete(profile: Profile | null): boolean {
  if (!profile) return false;

  const extendedBio = parseBio(profile.bio);

  const hasHeadline = Boolean(extendedBio.headline && extendedBio.headline.trim().length > 0);
  const hasBioText = Boolean(extendedBio.bioText && extendedBio.bioText.trim().length > 0);
  const hasInterests = Array.isArray(extendedBio.interests) && extendedBio.interests.length > 0;
  const hasLinks = Array.isArray(extendedBio.links) && extendedBio.links.length > 0;
  const hasUsername = Boolean(extendedBio.username && extendedBio.username.trim().length > 0);
  const hasAvatar = Boolean(profile.avatar_url && profile.avatar_url.trim().length > 0);

  // Identity content: headline or bioText must be present
  const hasIdentity = hasHeadline || hasBioText;
  // Additional substantive builder detail
  const hasAdditional = hasInterests || hasLinks || hasUsername || hasAvatar;

  return hasIdentity && hasAdditional;
}

/**
 * Core decision logic determining if the profile completion popup should be shown.
 */
export function shouldShowProfileOnboarding(
  user: { id: string } | null,
  profile: Profile | null,
  currentPath: string
): boolean {
  if (!user || !user.id) return false;
  if (isExcludedOnboardingRoute(currentPath)) return false;
  if (hasSeenProfileOnboarding(user.id)) return false;
  if (isProfileSubstantiallyComplete(profile)) return false;
  return true;
}
