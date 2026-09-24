export { emailService, EmailService, idempotencyKeyForEvent, type SendTransactionalEmailParams, type SendResult } from './emailService.js';
export { emailGuard, EmailGuard, type EmailEventType, type EmailEventStatus, type EmailEvent, type ReservationResult } from './emailGuard.js';
export { emailRenderer, EmailRenderer, type EmailRenderResult } from './emailRenderer.js';
export { renderUniversalEmailHtml, renderUniversalEmailText, FINDBUILDERS_LOGO_URL, FINDBUILDERS_APP_URL, resolveAppUrl, type UniversalEmailProps } from './components/UniversalEmailTemplate.js';
export { buildWelcomeEmail, type WelcomeEmailData } from './templates/WelcomeEmail.js';
export { buildProductSubmittedEmail, type ProductSubmittedEmailData } from './templates/ProductSubmittedEmail.js';
export { buildProductApprovedEmail, type ProductApprovedEmailData } from './templates/ProductApprovedEmail.js';
export { buildProductRejectedEmail, type ProductRejectedEmailData } from './templates/ProductRejectedEmail.js';
