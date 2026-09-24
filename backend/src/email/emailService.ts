import { Resend } from 'resend';
import { supabaseAdmin } from '../lib/supabase.js';
import { emailRenderer } from './emailRenderer.js';
import { emailGuard, EmailEventType } from './emailGuard.js';
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

export class EmailService {
  private resend: Resend | null = null;
  private emailFrom: string;
  private appUrl: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
    const configuredFrom = process.env.EMAIL_FROM?.trim();
    // findbuilders.app is not verified in Resend; never send from it.
    this.emailFrom = configuredFrom && !configuredFrom.includes('findbuilders.app')
      ? configuredFrom
      : 'FindBuilders <onboarding@resend.dev>';
    this.appUrl = (process.env.APP_URL || 'https://findbuilders.pages.dev').replace(/\/+$/, '');
  }

  /**
   * Unified, guarded transactional email dispatcher.
   *
   * 1. Validates event inputs.
   * 2. Atomically reserves the event in the persistent PostgreSQL database (UNIQUE constraint).
   * 3. Blocks immediately if already SENT, IN_FLIGHT, or invalid.
   * 4. Dispatches via Resend.
   * 5. Transitions event to SENT upon provider confirmation (storing messageId and sent_at).
   * 6. Marks event FAILED upon provider error (allowing future retries).
   * 7. NEVER throws; traps all errors so caller business logic always succeeds.
   */
  async sendTransactionalEmail(params: SendTransactionalEmailParams): Promise<SendResult> {
    const { eventKey, eventType, recipient, subject, html, text, metadata = {} } = params;

    try {
      if (!eventKey || !eventType) {
        console.warn('[EmailService] Missing required eventKey or eventType:', { eventKey, eventType });
        return { success: false, error: 'Missing eventKey or eventType' };
      }

      if (!recipient || !recipient.includes('@')) {
        console.warn(`[EmailService] Invalid recipient email address for ${eventKey}: "${recipient}"`);
        return { success: false, error: 'Invalid recipient address' };
      }

      // Step 2 & 3: Persistent atomic reservation via database guard
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

      console.log(`[EmailService] Delivering ${eventType} (${eventKey}) to <${recipient}>...`);

      // Dispatch to Resend
      const { data, error } = await this.resend.emails.send({
        from: this.emailFrom,
        to: recipient,
        subject,
        html,
        text,
      });

      // Step 6: Handle provider response
      if (error) {
        console.error(`[EmailService] Resend rejected delivery for ${eventKey}:`, error);
        await emailGuard.markFailed(eventKey, error.message || 'Resend delivery rejected');
        return { success: false, error: error.message };
      }

      // Provider accepted email!
      console.log(`[EmailService] Successfully sent ${eventType} (${eventKey}) to <${recipient}>, id: ${data?.id}`);
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
  // Idempotency Identity: PRODUCT_SUBMITTED:<product_id>:<transition_timestamp>
  // ══════════════════════════════════════════════════════════════
  async sendProductSubmittedEmail(
    product: Pick<Product, 'id' | 'name' | 'maker_id' | 'updated_at'>,
    makerId?: string
  ): Promise<SendResult> {
    const timestamp = product.updated_at || new Date().toISOString();
    const eventKey = `PRODUCT_SUBMITTED:${product.id}:${timestamp}`;

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
  // Idempotency Identity: PRODUCT_APPROVED:<product_id>:<transition_timestamp>
  // ══════════════════════════════════════════════════════════════
  async sendProductApprovedEmail(
    product: Pick<Product, 'id' | 'name' | 'maker_id' | 'updated_at'>
  ): Promise<SendResult> {
    const timestamp = product.updated_at || new Date().toISOString();
    const eventKey = `PRODUCT_APPROVED:${product.id}:${timestamp}`;

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
  // Idempotency Identity: PRODUCT_REJECTED:<product_id>:<transition_timestamp>
  // ══════════════════════════════════════════════════════════════
  async sendProductRejectedEmail(
    product: Pick<Product, 'id' | 'name' | 'maker_id' | 'updated_at'>,
    rejectionReason: string
  ): Promise<SendResult> {
    const timestamp = product.updated_at || new Date().toISOString();
    const eventKey = `PRODUCT_REJECTED:${product.id}:${timestamp}`;

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
