import { renderUniversalEmailHtml, renderUniversalEmailText } from '../components/UniversalEmailTemplate.js';

export interface WelcomeEmailData {
  userName?: string;
  userEmail: string;
}

export function buildWelcomeEmail(data: WelcomeEmailData, appUrl: string) {
  const cleanAppUrl = appUrl.replace(/\/+$/, '');
  const displayName = data.userName && data.userName.trim().length > 0 ? data.userName.trim() : '';
  const title = displayName ? `Welcome to FindBuilders, ${displayName}` : 'Welcome to FindBuilders';

  const props = {
    previewTitle: 'Welcome to FindBuilders',
    eyebrow: 'WELCOME TO FINDBUILDERS',
    title,
    body: 'Your account is ready. Start building your profile, showcase your products, and get discovered by the community.',
    ctaText: 'Complete Your Profile \u2192',
    ctaUrl: `${cleanAppUrl}/settings/profile`,
    secondaryText: 'You can update your profile and start submitting products from your dashboard.',
    appUrl: cleanAppUrl,
  };

  return {
    subject: 'Welcome to FindBuilders!',
    html: renderUniversalEmailHtml(props),
    text: renderUniversalEmailText(props),
  };
}
