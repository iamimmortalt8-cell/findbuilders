import { renderUniversalEmailHtml, renderUniversalEmailText } from '../components/UniversalEmailTemplate.js';

export interface ProductRejectedEmailData {
  userName?: string;
  userEmail: string;
  productId: string;
  productName: string;
  rejectionReason: string;
}

export function buildProductRejectedEmail(data: ProductRejectedEmailData, appUrl: string) {
  const cleanAppUrl = appUrl.replace(/\/+$/, '');
  const productName = data.productName || 'Your Product';
  const rejectionReason = data.rejectionReason?.trim() || 'No specific reason provided.';

  const props = {
    previewTitle: `Product Review: ${productName}`,
    eyebrow: 'PRODUCT REVIEW',
    title: `Your product "${productName}" needs some changes`,
    body: 'Your product was not approved for publication at this time.',
    rejectionReason,
    ctaText: 'Edit Your Product \u2192',
    ctaUrl: `${cleanAppUrl}/builder/product/${data.productId}/edit`,
    secondaryText: 'You can update your product and submit it for review again.',
    appUrl: cleanAppUrl,
  };

  return {
    subject: `Your product "${productName}" needs some changes`,
    html: renderUniversalEmailHtml(props),
    text: renderUniversalEmailText(props),
  };
}
