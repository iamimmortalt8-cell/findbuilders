import { renderUniversalEmailHtml, renderUniversalEmailText } from '../components/UniversalEmailTemplate.js';

export interface ProductSubmittedEmailData {
  userName?: string;
  userEmail: string;
  productId: string;
  productName: string;
}

export function buildProductSubmittedEmail(data: ProductSubmittedEmailData, appUrl: string) {
  const cleanAppUrl = appUrl.replace(/\/+$/, '');
  const productName = data.productName || 'Your Product';

  const props = {
    previewTitle: `Product Submitted: ${productName}`,
    eyebrow: 'PRODUCT SUBMITTED',
    title: `Your product "${productName}" is under review`,
    body: "We've received your product submission and it is now waiting for review.",
    ctaText: 'View Your Product \u2192',
    ctaUrl: `${cleanAppUrl}/builder`,
    secondaryText: "We'll let you know once your product has been reviewed.",
    appUrl: cleanAppUrl,
  };

  return {
    subject: `Your product "${productName}" is under review`,
    html: renderUniversalEmailHtml(props),
    text: renderUniversalEmailText(props),
  };
}
