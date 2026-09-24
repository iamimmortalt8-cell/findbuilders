/**
 * Universal FindBuilders Email Template
 *
 * Source of truth: backend/email-template/index.html
 * MASTER APPROVED DESIGN. DO NOT ALTER VISUAL STYLES.
 */

export interface UniversalEmailProps {
  previewTitle?: string;
  eyebrow: string;
  title: string;
  body: string;
  rejectionReason?: string;
  ctaText: string;
  ctaUrl: string;
  secondaryText: string;
  appUrl?: string;
}

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderUniversalEmailHtml(props: UniversalEmailProps): string {
  const appUrl = (props.appUrl || process.env.APP_URL || 'https://findbuilders.app').replace(/\/+$/, '');
  const previewTitle = escapeHtml(props.previewTitle || props.title || 'FindBuilders');
  const eyebrow = escapeHtml(props.eyebrow);
  const title = escapeHtml(props.title);
  const body = escapeHtml(props.body);
  const ctaText = escapeHtml(props.ctaText);
  const ctaUrl = props.ctaUrl;
  const secondaryText = escapeHtml(props.secondaryText);

  const rejectionReasonHtml = props.rejectionReason
    ? `
      <!-- Rejection Reason Box -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 20px; margin-bottom: 4px;">
          <tr>
              <td style="padding: 16px 20px; background-color: #18221D; border: 1px solid #2B3830; border-radius: 8px; text-align: left;">
                  <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 600; color: #789181; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Rejection Reason</span>
                  <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; color: #F0EDE6; line-height: 22px;">
                      ${escapeHtml(props.rejectionReason)}
                  </p>
              </td>
          </tr>
      </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${previewTitle}</title>
    <!--[if mso]>
    <style type="text/css">
        table {border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;}
        table td {border-collapse: collapse;}
        a {text-decoration: none;}
    </style>
    <![endif]-->
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
        a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
        
        /* Responsive */
        @media screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                margin: auto !important;
            }
            .mobile-padding {
                padding-left: 16px !important;
                padding-right: 16px !important;
            }
            .mobile-card-padding {
                padding: 28px 20px !important;
            }
            .mobile-heading {
                font-size: 22px !important;
                line-height: 28px !important;
            }
        }
    </style>
</head>
<body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #0B100E;">
    <center style="width: 100%; background-color: #0B100E;">
        <!--[if mso | IE]>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0B100E;">
        <tr>
        <td align="center">
        <![endif]-->
        
        <!-- Max Width Container -->
        <div style="max-width: 580px; margin: 0 auto;" class="email-container">
            <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">
                
                <!-- Spacer Top -->
                <tr>
                    <td height="40" style="font-size: 40px; line-height: 40px;">&nbsp;</td>
                </tr>

                <!-- Logo / Header -->
                <tr>
                    <td class="mobile-padding" style="padding: 0 16px 16px 16px; text-align: center;">
                        <a href="${appUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; color: #F5F1E8; letter-spacing: -0.2px;">FindBuilders</span>
                        </a>
                    </td>
                </tr>

                <!-- Main Card -->
                <tr>
                    <td class="mobile-padding" style="padding: 0 16px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #151D19; border: 1px solid #29342E; border-radius: 12px;">
                            <tr>
                                <td class="mobile-card-padding" style="padding: 32px 32px; text-align: center;">
                                    
                                    <!-- Eyebrow -->
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <td style="padding-bottom: 8px; text-align: center;">
                                                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 600; color: #789181; letter-spacing: 1.2px; text-transform: uppercase;">
                                                    ${eyebrow}
                                                </span>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Heading -->
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <td style="padding-bottom: 12px; text-align: center;">
                                                <h1 class="mobile-heading" style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 700; color: #F5F1E8; line-height: 32px; letter-spacing: -0.4px;">
                                                    ${title}
                                                </h1>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Body Text -->
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <td style="padding-bottom: 24px; text-align: center;">
                                                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 400; color: #C5C8C1; line-height: 24px;">
                                                    ${body}
                                                </p>
                                                ${rejectionReasonHtml}
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- CTA Button -->
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <td style="padding-bottom: 24px; text-align: center;">
                                                <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                    <tr>
                                                        <td style="border-radius: 6px; background-color: #D8C7A5; text-align: center;">
                                                            <a href="${ctaUrl}" target="_blank" style="background-color: #D8C7A5; border: 1px solid #D8C7A5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 14px; font-weight: 600; text-decoration: none; padding: 10px 20px; color: #1A1A16; display: inline-block; border-radius: 6px;">
                                                                ${ctaText}
                                                            </a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Secondary Text -->
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <td style="text-align: center;">
                                                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 400; color: #8C958E; line-height: 20px;">
                                                    ${secondaryText}
                                                </p>
                                            </td>
                                        </tr>
                                    </table>

                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Spacer (Reduced) -->
                <tr>
                    <td height="20" style="font-size: 20px; line-height: 20px;">&nbsp;</td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td class="mobile-padding" style="padding: 0 16px 40px 16px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            
                            <!-- Footer Brand -->
                            <tr>
                                <td style="padding-bottom: 8px; text-align: center;">
                                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #F5F1E8; display: block;">FindBuilders</span>
                                </td>
                            </tr>

                            <!-- Footer Description (Smaller/Muted) -->
                            <tr>
                                <td style="padding-bottom: 16px; text-align: center;">
                                    <p style="margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 400; color: #789181; line-height: 18px; max-width: 360px;">
                                        FindBuilders is a platform where builders showcase their products and get discovered by people looking for what's new.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Links -->
                            <tr>
                                <td style="padding-bottom: 24px; text-align: center;">
                                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 500; color: #A5B5A8;">
                                        <a href="${appUrl}/privacy-policy" target="_blank" style="color: #A5B5A8; text-decoration: none;">Privacy Policy</a> &nbsp;&bull;&nbsp;
                                        <a href="${appUrl}/terms" target="_blank" style="color: #A5B5A8; text-decoration: none;">Terms &amp; Conditions</a> &nbsp;&bull;&nbsp;
                                        <a href="${appUrl}/support" target="_blank" style="color: #A5B5A8; text-decoration: none;">Support</a>
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Separator -->
                            <tr>
                                <td style="padding-bottom: 20px; text-align: center;">
                                    <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="60%">
                                        <tr>
                                            <td style="border-top: 1px solid #29342E;">&nbsp;</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Copyright -->
                            <tr>
                                <td style="text-align: center;">
                                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 400; color: #8C958E; line-height: 18px;">
                                        &copy; 2026 FindBuilders. All Rights Reserved.<br>
                                        Built/Founded by Bharath Thommandru.
                                    </p>
                                </td>
                            </tr>
                            
                        </table>
                    </td>
                </tr>

            </table>
            <!--[if mso | IE]>
            </td>
            </tr>
            </table>
            <![endif]-->
        </div>
    </center>
</body>
</html>`;
}

export function renderUniversalEmailText(props: UniversalEmailProps): string {
  const appUrl = (props.appUrl || process.env.APP_URL || 'https://findbuilders.app').replace(/\/+$/, '');
  const lines: string[] = [
    'FindBuilders',
    '----------------------------------------',
    `[${props.eyebrow}]`,
    props.title,
    '',
    props.body,
  ];

  if (props.rejectionReason) {
    lines.push('', `Rejection Reason: ${props.rejectionReason}`);
  }

  lines.push(
    '',
    `${props.ctaText}: ${props.ctaUrl}`,
    '',
    props.secondaryText,
    '',
    '----------------------------------------',
    'FindBuilders - Where builders showcase their products and get discovered.',
    `Privacy Policy: ${appUrl}/privacy-policy`,
    `Terms & Conditions: ${appUrl}/terms`,
    `Support: ${appUrl}/support`,
    '© 2026 FindBuilders. All Rights Reserved.',
    'Built/Founded by Bharath Thommandru.'
  );

  return lines.join('\n');
}
