import { Router } from 'express';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const aiApiUrl = process.env.AI_API_URL;
    const aiApiKey = process.env.AI_API_KEY;

    if (!aiApiUrl || !aiApiKey) {
      return res.status(503).json({ error: 'AI API is not configured on the server.' });
    }

    // Construct the payload based on standard OpenAI format, prepending the system context.
    const systemPrompt = {
      role: 'system',
      content: context || 'You are a helpful assistant for FindBuilders.'
    };

    const payload = {
      model: process.env.AI_API_MODEL || 'gpt-4o-mini', // Configurable model or fallback
      messages: [systemPrompt, ...messages],
      temperature: 0.7,
      max_tokens: 500,
    };

    const response = await fetch(aiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiApiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI API Error from Provider]:', response.status, errorText);
      return res.status(response.status).json({ error: 'AI provider error.' });
    }

    const data = await response.json();
    
    res.json(data);
  } catch (error: any) {
    console.error('[AI Route Error]:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
