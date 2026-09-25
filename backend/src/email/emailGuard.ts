import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../lib/supabase.js';
import { isEmailEnabled } from './emailConfig.js';

export type EmailEventType = 'WELCOME' | 'PRODUCT_SUBMITTED' | 'PRODUCT_APPROVED' | 'PRODUCT_REJECTED';
export type EmailEventStatus = 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';

export interface EmailEvent {
  id: string;
  event_key: string;
  event_type: EmailEventType;
  recipient: string;
  status: EmailEventStatus;
  provider_message_id: string | null;
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
  metadata: Record<string, any>;
}

export interface ReservationResult {
  allowed: boolean;
  event?: EmailEvent;
  reason?: 'ALREADY_SENT' | 'IN_FLIGHT' | 'RETRY_ALLOWED' | 'ERROR' | 'EMAIL_DISABLED';
}

export class EmailGuard {
  // Stale lock timeout (5 minutes) for SENDING status before allowing recovery
  private lockTimeoutMs = 5 * 60 * 1000;
  private fallbackStorePath: string;
  private hasReportedMissingTable = false;

  constructor(customStorePath?: string) {
    this.fallbackStorePath = customStorePath || path.resolve(process.cwd(), '.email_events_store.json');
  }

  // ----------------------------------------------------------------
  // Fallback persistent disk store (used only if database table is missing)
  // ----------------------------------------------------------------
  private readFallbackStore(): Record<string, EmailEvent> {
    try {
      if (fs.existsSync(this.fallbackStorePath)) {
        const raw = fs.readFileSync(this.fallbackStorePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[EmailGuard] Failed to read fallback store:', e);
    }
    return {};
  }

  private writeFallbackStore(store: Record<string, EmailEvent>): void {
    try {
      fs.writeFileSync(this.fallbackStorePath, JSON.stringify(store, null, 2), 'utf8');
    } catch (e) {
      console.warn('[EmailGuard] Failed to write fallback store:', e);
    }
  }

  /**
   * Atomically reserves an email event in the persistent database.
   * Leverages the UNIQUE(event_key) constraint in PostgreSQL to guarantee
   * that even across multiple backend instances / concurrent requests,
   * only ONE process can reserve and send the email.
   */
  async reserve(
    eventKey: string,
    eventType: EmailEventType,
    recipient: string,
    metadata: Record<string, any> = {}
  ): Promise<ReservationResult> {
    // EMAIL_ENABLED=false -> never touch email_events (no insert, no fallback store write).
    if (!isEmailEnabled()) {
      return { allowed: false, reason: 'EMAIL_DISABLED' };
    }
    try {
      // 1. Attempt atomic insert in 'SENDING' state
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('email_events')
        .insert({
          event_key: eventKey,
          event_type: eventType,
          recipient,
          status: 'SENDING',
          metadata,
        })
        .select()
        .single();

      if (!insertError && inserted) {
        // Atomic insert won! This process holds the exclusive sending lock.
        return { allowed: true, event: inserted as EmailEvent };
      }

      // 2. Check for unique constraint violation (code '23505') or duplicate key
      if (insertError?.code === '23505' || insertError?.message?.includes('duplicate key')) {
        return await this.handleExistingEvent(eventKey);
      }

      // 3. Fallback if table does not exist in Supabase schema cache yet
      if (insertError?.code === 'PGRST205') {
        if (!this.hasReportedMissingTable) {
          console.warn(
            '[EmailGuard] Table "email_events" does not exist in Supabase yet. ' +
            'Using persistent disk guard until backend/supabase/email_events.sql is run in Supabase SQL Editor.'
          );
          this.hasReportedMissingTable = true;
        }
        return this.reserveFallback(eventKey, eventType, recipient, metadata);
      }

      console.error('[EmailGuard] Unexpected error during event reservation:', insertError);
      return { allowed: false, reason: 'ERROR' };
    } catch (err: any) {
      console.error('[EmailGuard] Fatal exception during reservation for key:', eventKey, err);
      return { allowed: false, reason: 'ERROR' };
    }
  }

  /**
   * Handles collision when event_key already exists in persistent database.
   */
  private async handleExistingEvent(eventKey: string): Promise<ReservationResult> {
    try {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('email_events')
        .select('*')
        .eq('event_key', eventKey)
        .single();

      if (fetchError || !existing) {
        console.error('[EmailGuard] Could not fetch existing event for key:', eventKey, fetchError);
        return { allowed: false, reason: 'ERROR' };
      }

      const event = existing as EmailEvent;

      // Case A: Event was already SENT successfully
      if (event.status === 'SENT') {
        console.log(`[EmailGuard] BLOCKED: Event ${eventKey} was already SENT at ${event.sent_at}. Skipping.`);
        return { allowed: false, event, reason: 'ALREADY_SENT' };
      }

      // Case B: Event is currently SENDING
      if (event.status === 'SENDING') {
        const ageMs = Date.now() - new Date(event.created_at).getTime();
        if (ageMs < this.lockTimeoutMs) {
          console.log(`[EmailGuard] BLOCKED: Event ${eventKey} is actively SENDING in another worker (${Math.round(ageMs / 1000)}s old). Skipping.`);
          return { allowed: false, event, reason: 'IN_FLIGHT' };
        }

        // Stale lock recovery (> 5 min old)
        console.warn(`[EmailGuard] Recovering stale SENDING lock for event ${eventKey} (${Math.round(ageMs / 1000)}s old).`);
        const { data: recovered, error: recError } = await supabaseAdmin
          .from('email_events')
          .update({ status: 'SENDING', error_message: null })
          .eq('event_key', eventKey)
          .eq('status', 'SENDING')
          .select()
          .single();

        if (recovered && !recError) {
          return { allowed: true, event: recovered as EmailEvent, reason: 'RETRY_ALLOWED' };
        }
        return { allowed: false, reason: 'IN_FLIGHT' };
      }

      // Case C: Event is FAILED — allow retry
      if (event.status === 'FAILED') {
        console.log(`[EmailGuard] Event ${eventKey} previously FAILED. Attempting retry reservation.`);
        const { data: retried, error: retryError } = await supabaseAdmin
          .from('email_events')
          .update({ status: 'SENDING', error_message: null })
          .eq('event_key', eventKey)
          .eq('status', 'FAILED')
          .select()
          .single();

        if (retried && !retryError) {
          return { allowed: true, event: retried as EmailEvent, reason: 'RETRY_ALLOWED' };
        }
        return { allowed: false, reason: 'IN_FLIGHT' };
      }

      // Case D: Event is PENDING
      if (event.status === 'PENDING') {
        const { data: claimed, error: claimError } = await supabaseAdmin
          .from('email_events')
          .update({ status: 'SENDING' })
          .eq('event_key', eventKey)
          .eq('status', 'PENDING')
          .select()
          .single();

        if (claimed && !claimError) {
          return { allowed: true, event: claimed as EmailEvent };
        }
        return { allowed: false, reason: 'IN_FLIGHT' };
      }

      return { allowed: false, reason: 'IN_FLIGHT' };
    } catch (err) {
      console.error('[EmailGuard] Error handling existing event:', err);
      return { allowed: false, reason: 'ERROR' };
    }
  }

  // ----------------------------------------------------------------
  // Fallback persistent reservation logic
  // ----------------------------------------------------------------
  private reserveFallback(
    eventKey: string,
    eventType: EmailEventType,
    recipient: string,
    metadata: Record<string, any> = {}
  ): ReservationResult {
    const store = this.readFallbackStore();
    const existing = store[eventKey];

    if (existing) {
      if (existing.status === 'SENT') {
        console.log(`[EmailGuard:Disk] BLOCKED: Event ${eventKey} was already SENT at ${existing.sent_at}. Skipping.`);
        return { allowed: false, event: existing, reason: 'ALREADY_SENT' };
      }

      if (existing.status === 'SENDING') {
        const ageMs = Date.now() - new Date(existing.created_at).getTime();
        if (ageMs < this.lockTimeoutMs) {
          console.log(`[EmailGuard:Disk] BLOCKED: Event ${eventKey} is actively SENDING. Skipping.`);
          return { allowed: false, event: existing, reason: 'IN_FLIGHT' };
        }
      }

      if (existing.status === 'FAILED') {
        console.log(`[EmailGuard:Disk] Event ${eventKey} previously FAILED. Allowing retry.`);
        existing.status = 'SENDING';
        existing.error_message = null;
        store[eventKey] = existing;
        this.writeFallbackStore(store);
        return { allowed: true, event: existing, reason: 'RETRY_ALLOWED' };
      }
    }

    const newEvent: EmailEvent = {
      id: `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      event_key: eventKey,
      event_type: eventType,
      recipient,
      status: 'SENDING',
      provider_message_id: null,
      created_at: new Date().toISOString(),
      sent_at: null,
      error_message: null,
      metadata,
    };

    store[eventKey] = newEvent;
    this.writeFallbackStore(store);
    return { allowed: true, event: newEvent };
  }

  /**
   * Marks an email event as SENT only after successful provider delivery.
   */
  async markSent(eventKey: string, providerMessageId?: string): Promise<void> {
    if (!isEmailEnabled()) return;
    try {
      const { error } = await supabaseAdmin
        .from('email_events')
        .update({
          status: 'SENT',
          provider_message_id: providerMessageId || null,
          sent_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('event_key', eventKey);

      if (error && error.code === 'PGRST205') {
        const store = this.readFallbackStore();
        if (store[eventKey]) {
          store[eventKey].status = 'SENT';
          store[eventKey].provider_message_id = providerMessageId || null;
          store[eventKey].sent_at = new Date().toISOString();
          store[eventKey].error_message = null;
          this.writeFallbackStore(store);
        }
        return;
      }

      if (error) {
        console.error(`[EmailGuard] Failed to mark event ${eventKey} as SENT:`, error);
      } else {
        console.log(`[EmailGuard] Event ${eventKey} marked as SENT (msgId: ${providerMessageId || 'none'})`);
      }
    } catch (err) {
      console.error(`[EmailGuard] Exception in markSent for ${eventKey}:`, err);
    }
  }

  /**
   * Marks an email event as FAILED when provider delivery fails.
   */
  async markFailed(eventKey: string, errorMessage: string): Promise<void> {
    if (!isEmailEnabled()) return;
    try {
      const sanitizedError = errorMessage ? errorMessage.substring(0, 1000) : 'Unknown error';
      const { error } = await supabaseAdmin
        .from('email_events')
        .update({
          status: 'FAILED',
          error_message: sanitizedError,
        })
        .eq('event_key', eventKey);

      if (error && error.code === 'PGRST205') {
        const store = this.readFallbackStore();
        if (store[eventKey]) {
          store[eventKey].status = 'FAILED';
          store[eventKey].error_message = sanitizedError;
          this.writeFallbackStore(store);
        }
        return;
      }

      if (error) {
        console.error(`[EmailGuard] Failed to mark event ${eventKey} as FAILED:`, error);
      } else {
        console.log(`[EmailGuard] Event ${eventKey} marked as FAILED`);
      }
    } catch (err) {
      console.error(`[EmailGuard] Exception in markFailed for ${eventKey}:`, err);
    }
  }

  /**
   * Retrieves an email event by eventKey.
   */
  async getEvent(eventKey: string): Promise<EmailEvent | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('email_events')
        .select('*')
        .eq('event_key', eventKey)
        .single();

      if (!error && data) return data as EmailEvent;

      if (error?.code === 'PGRST205') {
        const store = this.readFallbackStore();
        return store[eventKey] || null;
      }

      return null;
    } catch {
      return null;
    }
  }
}

export const emailGuard = new EmailGuard();
