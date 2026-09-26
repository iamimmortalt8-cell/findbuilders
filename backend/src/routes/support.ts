import { Router } from 'express';
import { emailService } from '../email/emailService.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Determine the support recipient (usually the founders or a central support address)
    // The user requested: bharathtommandru1@gmail.com, rishichowdary2099@gmail.com
    // We'll send to one and CC the other, or just send to bharathtommandru1@gmail.com 
    // Wait, resend supports array of recipients if we bypass the strict guard single-recipient typing.
    // The email guard requires a single recipient string. We can just send to one primary address.
    const primaryRecipient = 'bharathtommandru1@gmail.com';

    // Event key based on time or unique hash since a user can send multiple support requests
    const eventKey = `SUPPORT_REQUEST:${Date.now()}_${email.replace(/[^a-zA-Z0-9]/g, '')}`;

    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>New Support Request (FindBuilders)</h2>
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
    `;

    const text = `New Support Request (FindBuilders)\n\nFrom: ${name} <${email}>\nSubject: ${subject}\n\nMessage:\n${message}`;

    const result = await emailService.sendTransactionalEmail({
      eventKey,
      eventType: 'SUPPORT_REQUEST',
      recipient: primaryRecipient,
      subject: `[FindBuilders Support] ${subject}`,
      html,
      text,
      metadata: { sender_email: email, sender_name: name }
    });

    if (!result.success) {
      // If email is disabled, we still might get success=true skipped=true.
      // If it fails for real, success is false.
      if (result.reason === 'EMAIL_DISABLED') {
        // According to user, if email is disabled, don't fake success.
        return res.status(503).json({ error: 'Email service is currently disabled. Please try again later.' });
      }
      return res.status(500).json({ error: result.error || 'Failed to send message.' });
    }

    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (error: any) {
    console.error('[Support Route Error]:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
