import { Resend } from 'resend';
import { supabaseAdmin } from '../lib/supabase.js';
import { emailRenderer } from './emailRenderer.js';
import { emailGuard, EmailEventType } from './emailGuard.js';
import { isEmailEnabled } from './emailConfig.js';
import type { Product } from '../types/index.js';

export interface SendTransactionalEmailParams {
  eventKey: string;
  eventType: EmailEventType;
  recipient: string;
  subject: string;
  html: string;
  text: string;
  metadata?: Record<string, any>;
}

export interface SendResult {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  messageId?: string;
  error?: string;
}

export interface TestModeConfig {
  enabled: boolean;
  testRecipient: string;
}

export type ResolvedRecipient =
  | {
      ok: true;
      recipient: string;
      originalRecipient: string;
      testMode: boolean;
      testRecipient: string | null;
    }
  | { ok: false; error: string };

export function getTestModeConfig(env: NodeJS.ProcessEnv = process.env): TestModeConfig {
  const enabled = String(env.EMAIL_TEST_MODE ?? '').trim().toLowerCase() === 'true';
  const testRecipient = String(env.EMAIL_TEST_RECIPIENT ?? '').trim();
  return { enabled, testRecipient };
}

export function resolveActualRecipient(
  originalRecipient: string,
  env: NodeJS.ProcessEnv = process.env
): ResolvedRecipient {
  const { enabled, testRecipient } = getTestModeConfig(env);

  if (!enabled) {
    return {
      ok: true,
      recipient: originalRecipient,
      originalRecipient,
      testMode: false,
      testRecipient: null,
    };
  }

  if (!testRecipient || !testRecipient.includes('@')) {
    return {
      ok: false,
      error:
        'EMAIL_TEST_MODE is enabled but EMAIL_TEST_RECIPIENT is missing or invalid. Refusing to send.',
    };
  }

  return {
    ok: true,
    recipient: testRecipient,
    originalRecipient,
    testMode: true,
    testRecipient,
  };
}

/**
 * Deterministic Resend idempotency key for a logical email event.
 *
 * Derived ONLY from the permanent logical event key (never random, never a
 * timestamp), so retries of the same logical email reuse the same key and
 * Resend collapses them into a single delivery:
 *
 *   WELCOME:<user_id>            -> welcome/<user_id>
 *   PRODUCT_SUBMITTED:<id>       -> product-submitted/<id>
 *   PRODUCT_APPROVED:<id>        -> product-approved/<id>
 *   PRODUCT_REJECTED:<id>        -> product-rejected/<id>
 *
 * Resend constraint: 1-256 characters, retained for 24 hours.
 */
export function idempotencyKeyForEvent(eventKey: string): string {
  const separatorIndex = eventKey.indexOf(':');
  if (separatorIndex === -1) {
    return eventKey.toLowerCase().replace(/_/g, '-').substring(0, 256);
  }
  const type = eventKey.substring(0, separatorIndex).toLowerCase().replace(/_/g, '-');
  const id = eventKey.substring(separatorIndex + 1);
  return `${type}/${id}`.substring(0, 256);
}

export class EmailService {
  private resend: Resend | null = null;
  private emailFrom: string;
  private replyTo?: string;
  private appUrl: string;

  constructor() {
    // EMAIL_ENABLED is a strict switch (default: disabled). While disabled no
    // Resend client is ever constructed and a single clean startup log is emitted.
    if (isEmailEnabled()) {
      const apiKey = process.env.RESEND_API_KEY?.trim();
      if (apiKey) {
        this.resend = new Resend(apiKey);
      }
    } else {
      console.log('[EmailService] Email system disabled');
    }
    const configuredFrom = process.env.EMAIL_FROM?.trim();
    // findbuilders.app is not verified in Resend; never send from it.
    this.emailFrom = configuredFrom && !configuredFrom.includes('findbuilders.app')
      ? configuredFrom
      : 'FindBuilders <onboarding@resend.dev>';
    // Optional Reply-To (env-controlled; only set when configured).
    const configuredReplyTo = process.env.EMAIL_REPLY_TO?.trim();
    if (configuredReplyTo && configuredReplyTo.includes('@')) {
      this.replyTo = configuredReplyTo;
    }
    this.appUrl = (process.env.APP_URL || 'https://findbuilders.pages.dev').replace(/\/+$/, '');
  }

  /**
   * Unified, guarded transactional email dispatcher.
   *
   * 1. Validates event inputs and resolves the Resend delivery recipient
   *    (optional EMAIL_TEST_MODE redirect; event key/recipient in DB stay original).
   * 2. Atomically reserves the event in the persistent PostgreSQL database (UNIQUE constraint).
   * 3. Blocks immediately if already SENT, IN_FLIGHT, or invalid.
   * 4. Dispatches via Resend.
   * 5. Transitions event to SENT upon provider confirmation (storing messageId and sent_at).
   * 6. Marks event FAILED upon provider error (allowing future retries).
   * 7. NEVER throws; traps all errors so caller business logic always succeeds.
   */
  async sendTransactionalEmail(params: SendTransactionalEmailParams): Promise<SendResult> {
    const { eventKey, eventType, recipient, subject, html, text, metadata = {} } = params;

    // EMAIL_ENABLED=false -> hard no-op: no DB row, no Resend call, no logs.
    // Callers' business logic continues as if email were not configured.
    if (!isEmailEnabled()) {
      return { success: true, skipped: true, reason: 'EMAIL_DISABLED' };
    }

    try {
      if (!eventKey || !eventType) {
        console.warn('[EmailService] Missing required eventKey or eventType:', { eventKey, eventType });
        return { success: false, error: 'Missing eventKey or eventType' };
      }

      if (!recipient || !recipient.includes('@')) {
        console.warn(`[EmailService] Invalid recipient email address for ${eventKey}: "${recipient}"`);
        return { success: false, error: 'Invalid recipient address' };
      }

      const resolved = resolveActualRecipient(recipient);
      if (!resolved.ok) {
        console.error('[EmailService] Email test mode: ENABLED');
        console.error(`[EmailService] Original recipient: ${recipient}`);
        console.error(`[EmailService] Cannot deliver ${eventKey}: ${resolved.error}`);
        return { success: false, error: resolved.error };
      }

      // Step 2 & 3: Persistent atomic reservation via database guard (original recipient)
      const reservation = await emailGuard.reserve(eventKey, eventType, recipient, metadata);
      if (!reservation.allowed) {
        console.log(`[EmailService] Dispatch blocked by persistent guard for ${eventKey} (reason: ${reservation.reason})`);
        return { success: false, skipped: true, reason: reservation.reason };
      }

      // Step 4 & 5: Check Resend provider configuration
      if (!this.resend) {
        console.warn(`[EmailService] Skipping delivery for ${eventKey}: RESEND_API_KEY is not configured.`);
        await emailGuard.markFailed(eventKey, 'RESEND_API_KEY is not configured');
        return { success: false, error: 'RESEND_API_KEY is not configured' };
      }

      if (resolved.testMode) {
        console.log('[EmailService] Email test mode: ENABLED');
        console.log(`[EmailService] Original recipient: ${resolved.originalRecipient}`);
        console.log(`[EmailService] Test recipient: ${resolved.testRecipient}`);
      } else {
        console.log('[EmailService] Email test mode: DISABLED');
      }

      console.log(`[EmailService] Delivering ${eventType} (${eventKey})...`);

      // Deterministic idempotency key derived from the logical event key:
      // Resend collapses duplicate attempts of the SAME logical email within 24h,
      // even if our guard state was lost or a retry races a successful send.
      const idempotencyKey = idempotencyKeyForEvent(eventKey);

      // Dispatch to Resend (delivery recipient only; event metadata keeps original)
      const { data, error } = await this.resend.emails.send(
        {
          from: this.emailFrom,
          to: resolved.recipient,
          subject,
          html,
          text,
          ...(this.replyTo ? { replyTo: this.replyTo } : {}),
        },
        { idempotencyKey }
      );

      // Step 6: Handle provider response
      if (error) {
        console.error(`[EmailService] Resend rejected delivery for ${eventKey}:`, error);
        await emailGuard.markFailed(eventKey, error.message || 'Resend delivery rejected');
        return { success: false, error: error.message };
      }

      // Provider accepted email!
      if (resolved.testMode) {
        console.log(
          `[EmailService] Resend accepted delivery for ${eventType} (${eventKey}) to test recipient <${resolved.recipient}>, id: ${data?.id}`
        );
        console.log(`[EmailService] Original recipient remains: ${resolved.originalRecipient}`);
      } else {
        console.log(
          `[EmailService] Resend accepted delivery for ${eventType} (${eventKey}) to <${resolved.recipient}>, id: ${data?.id}`
        );
      }
      await emailGuard.markSent(eventKey, data?.id);
      return { success: true, messageId: data?.id };
    } catch (err: any) {
      // Under NO circumstances should an email error break caller execution
      console.error(`[EmailService] Unexpected failure in sendTransactionalEmail for ${eventKey}:`, err);
      await emailGuard.markFailed(eventKey, err?.message || String(err));
      return { success: false, error: err?.message || String(err) };
    }
  }

  /**
   * Resolves recipient email and display name securely from the database/auth.
   * Never trusts client-supplied recipient email addresses.
   */
  async resolveUser(userId: string): Promise<{ email: string; displayName: string } | null> {
    try {
      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authErr || !authUser?.user?.email) {
        console.warn(`[EmailService] Could not resolve auth email for userId: ${userId}`, authErr);
        return null;
      }

      // Fetch profile for display name
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();

      const displayName =
        profile?.display_name ||
        authUser.user.user_metadata?.display_name ||
        authUser.user.user_metadata?.full_name ||
        authUser.user.user_metadata?.name ||
        '';

      return {
        email: authUser.user.email,
        displayName,
      };
    } catch (err) {
      console.error(`[EmailService] Failed to resolve user ${userId}:`, err);
      return null;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // EMAIL 1 — WELCOME EMAIL
  // Idempotency Identity: WELCOME:<user_id>
  // ══════════════════════════════════════════════════════════════
  async sendWelcomeEmail(userId: string, email?: string, displayName?: string): Promise<SendResult> {
    if (!isEmailEnabled()) {
      return { success: true, skipped: true, reason: 'EMAIL_DISABLED' };
    }
    const eventKey = `WELCOME:${userId}`;

    try {
      // Resolve recipient securely
      let targetEmail = email;
      let targetName = displayName;

      if (!targetEmail || !targetName) {
        const resolved = await this.resolveUser(userId);
        if (!resolved) {
          console.warn(`[EmailService] Cannot send welcome email: user ${userId} could not be resolved`);
          return { success: false, error: 'User not found' };
        }
        targetEmail = resolved.email;
        if (!targetName) targetName = resolved.displayName;
      }

      const rendered = emailRenderer.renderWelcome({
        userEmail: targetEmail,
        userName: targetName,
      });

      return await this.sendTransactionalEmail({
        eventKey,
        eventType: 'WELCOME',
        recipient: targetEmail,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        metadata: { userId, userName: targetName },
      });
    } catch (err: any) {
      console.error(`[EmailService] Unhandled error in sendWelcomeEmail for ${userId}:`, err);
      return { success: false, error: err?.message || String(err) };
    }
  }

  // ══════════════════════════════════════════════════════════════
  // EMAIL 2 — PRODUCT SUBMITTED
  // Idempotency Identity: PRODUCT_SUBMITTED:<product_id>  (permanent — no timestamps)
  // ══════════════════════════════════════════════════════════════
  async sendProductSubmittedEmail(
    product: Pick<Product, 'id' | 'name' | 'maker_id' | 'updated_at'>,
    makerId?: string
  ): Promise<SendResult> {
    if (!isEmailEnabled()) {
      return { success: true, skipped: true, reason: 'EMAIL_DISABLED' };
    }
    const eventKey = `PRODUCT_SUBMITTED:${product.id}`;

    try {
      const ownerId = makerId || product.maker_id;
      if (!ownerId) {
        console.warn('[EmailService] Cannot send product submitted email: maker_id is missing', product);
        return { success: false, error: 'maker_id missing' };
      }

      const maker = await this.resolveUser(ownerId);
      if (!maker) {
        console.warn(`[EmailService] Could not resolve maker ${ownerId} for product submission email.`);
        return { success: false, error: 'Maker not found' };
      }

      const rendered = emailRenderer.renderProductSubmitted({
        userEmail: maker.email,
        userName: maker.displayName,
        productId: product.id,
        productName: product.name,
      });

      return await this.sendTransactionalEmail({
        eventKey,
        eventType: 'PRODUCT_SUBMITTED',
        recipient: maker.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        metadata: { productId: product.id, makerId: ownerId, productName: product.name },
      });
    } catch (err: any) {
      console.error(`[EmailService] Unhandled error in sendProductSubmittedEmail for ${product.id}:`, err);
      return { success: false, error: err?.message || String(err) };
    }
  }

  // ══════════════════════════════════════════════════════════════
  // EMAIL 3 — PRODUCT APPROVED
  // Idempotency Identity: PRODUCT_APPROVED:<product_id>  (permanent — no timestamps)
  // ══════════════════════════════════════════════════════════════
  async sendProductApprovedEmail(
    product: Pick<Product, 'id' | 'name' | 'maker_id' | 'updated_at'>
  ): Promise<SendResult> {
    if (!isEmailEnabled()) {
      return { success: true, skipped: true, reason: 'EMAIL_DISABLED' };
    }
    const eventKey = `PRODUCT_APPROVED:${product.id}`;

    try {
      const maker = await this.resolveUser(product.maker_id);
      if (!maker) {
        console.warn(`[EmailService] Could not resolve maker ${product.maker_id} for product approved email.`);
        return { success: false, error: 'Maker not found' };
      }

      const rendered = emailRenderer.renderProductApproved({
        userEmail: maker.email,
        userName: maker.displayName,
        productId: product.id,
        productName: product.name,
      });

      return await this.sendTransactionalEmail({
        eventKey,
        eventType: 'PRODUCT_APPROVED',
        recipient: maker.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        metadata: { productId: product.id, makerId: product.maker_id, productName: product.name },
      });
    } catch (err: any) {
      console.error(`[EmailService] Unhandled error in sendProductApprovedEmail for ${product.id}:`, err);
      return { success: false, error: err?.message || String(err) };
    }
  }

  // ══════════════════════════════════════════════════════════════
  // EMAIL 4 — PRODUCT REJECTED
  // Idempotency Identity: PRODUCT_REJECTED:<product_id>  (permanent — no timestamps)
  // ══════════════════════════════════════════════════════════════
  async sendProductRejectedEmail(
    product: Pick<Product, 'id' | 'name' | 'maker_id' | 'updated_at'>,
    rejectionReason: string
  ): Promise<SendResult> {
    if (!isEmailEnabled()) {
      return { success: true, skipped: true, reason: 'EMAIL_DISABLED' };
    }
    const eventKey = `PRODUCT_REJECTED:${product.id}`;

    try {
      const maker = await this.resolveUser(product.maker_id);
      if (!maker) {
        console.warn(`[EmailService] Could not resolve maker ${product.maker_id} for product rejected email.`);
        return { success: false, error: 'Maker not found' };
      }

      const rendered = emailRenderer.renderProductRejected({
        userEmail: maker.email,
        userName: maker.displayName,
        productId: product.id,
        productName: product.name,
        rejectionReason: rejectionReason || 'No specific reason provided.',
      });

      return await this.sendTransactionalEmail({
        eventKey,
        eventType: 'PRODUCT_REJECTED',
        recipient: maker.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        metadata: {
          productId: product.id,
          makerId: product.maker_id,
          productName: product.name,
          rejectionReason,
        },
      });
    } catch (err: any) {
      console.error(`[EmailService] Unhandled error in sendProductRejectedEmail for ${product.id}:`, err);
      return { success: false, error: err?.message || String(err) };
    }
  }
}

export const emailService = new EmailService();
