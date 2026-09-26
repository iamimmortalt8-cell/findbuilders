import { Router } from 'express';

const router = Router();

router.post('/chat', async (req, res) => {
  const requestId = (req as any).requestId || 'unknown';
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.', requestId });
    }

    const apiKey = process.env.FB_API_KEY;
    if (!apiKey) {
      return res.json({
        success: true,
        reply: "Hello! I am currently running in offline mode because FB_API_KEY is not configured. However, I can see your message! " + (messages[messages.length - 1]?.content || ""),
        requestId
      });
    }

    const systemContent = context || 'You are a helpful assistant for FindBuilders.';

    const apiMessages = [
      { role: 'system', content: systemContent },
      ...messages
    ];

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://findbuilders.pages.dev',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: apiMessages,
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!aiResponse.ok) {
      console.warn(`[AI API Error]: ${aiResponse.status}`, { requestId });
      return res.json({
        success: true,
        reply: "I'm sorry, I'm having trouble connecting to my AI brain right now. If you need help, you can contact the FindBuilders team below.",
        requestId
      });
    }

    const data: any = await aiResponse.json();
    const reply = data.choices[0].message.content;

    res.json({
      success: true,
      reply,
      requestId
    });

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('AI Chat timed out', { requestId });
      return res.json({
        success: true,
        reply: "I'm sorry, I took too long to respond. Please try again. If you need help, you can contact the FindBuilders team below.",
        requestId
      });
    }
    console.error('AI Chat Error', error);
    res.status(500).json({ success: false, message: 'An unexpected error occurred', requestId });
  }
});

export default router;
