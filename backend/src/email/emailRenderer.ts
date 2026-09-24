import { buildWelcomeEmail, type WelcomeEmailData } from './templates/WelcomeEmail.js';
import { buildProductSubmittedEmail, type ProductSubmittedEmailData } from './templates/ProductSubmittedEmail.js';
import { buildProductApprovedEmail, type ProductApprovedEmailData } from './templates/ProductApprovedEmail.js';
import { buildProductRejectedEmail, type ProductRejectedEmailData } from './templates/ProductRejectedEmail.js';
import { renderUniversalEmailHtml, renderUniversalEmailText, type UniversalEmailProps } from './components/UniversalEmailTemplate.js';

export interface EmailRenderResult {
  subject: string;
  html: string;
  text: string;
}

export class EmailRenderer {
  private appUrl: string;

  constructor(appUrl?: string) {
    this.appUrl = (appUrl || process.env.APP_URL || 'https://findbuilders.app').replace(/\/+$/, '');
  }

  renderWelcome(data: WelcomeEmailData): EmailRenderResult {
    return buildWelcomeEmail(data, this.appUrl);
  }

  renderProductSubmitted(data: ProductSubmittedEmailData): EmailRenderResult {
    return buildProductSubmittedEmail(data, this.appUrl);
  }

  renderProductApproved(data: ProductApprovedEmailData): EmailRenderResult {
    return buildProductApprovedEmail(data, this.appUrl);
  }

  renderProductRejected(data: ProductRejectedEmailData): EmailRenderResult {
    return buildProductRejectedEmail(data, this.appUrl);
  }

  renderCustom(props: UniversalEmailProps, subject: string): EmailRenderResult {
    return {
      subject,
      html: renderUniversalEmailHtml({ ...props, appUrl: this.appUrl }),
      text: renderUniversalEmailText({ ...props, appUrl: this.appUrl }),
    };
  }
}

export const emailRenderer = new EmailRenderer();
