import { renderUniversalEmailHtml, renderUniversalEmailText } from '../components/UniversalEmailTemplate.js';

export interface ProductApprovedEmailData {
  userName?: string;
  userEmail: string;
  productId: string;
  productName: string;
}

export function buildProductApprovedEmail(data: ProductApprovedEmailData, appUrl: string) {
  const cleanAppUrl = appUrl.replace(/\/+$/, '');
  const productName = data.productName || 'Your Product';

  const props = {
    previewTitle: `Product Approved: ${productName}`,
    eyebrow: 'PRODUCT APPROVED',
    title: `Your product "${productName}" is now live`,
    body: 'Great news! Your product has been approved and is now discoverable on FindBuilders.',
    ctaText: 'View Your Product \u2192',
    ctaUrl: `${cleanAppUrl}/product/${data.productId}`,
    secondaryText: 'You can manage your product from your FindBuilders dashboard.',
    appUrl: cleanAppUrl,
  };

  return {
    subject: `Your product "${productName}" is now live!`,
    html: renderUniversalEmailHtml(props),
    text: renderUniversalEmailText(props),
  };
}
