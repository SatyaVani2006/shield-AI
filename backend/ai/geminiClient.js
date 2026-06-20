const getGeminiReply = async (message, history = []) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[SHIELD AI] GEMINI_API_KEY is not defined in environment variables.');
    return null;
  }

  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Map database message history to Gemini API format (role mapping: assistant -> model)
  const contents = (history || []).map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  // Append current message to contents
  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  const payload = {
    contents,
    systemInstruction: {
      parts: [
        {
          text: 'You are SHIELD AI, an advanced multilingual cybersecurity chatbot assistant. Provide professional, concise, and actionable cybersecurity advice. Maintain your persona as SHIELD AI.',
        },
      ],
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[GEMINI API ERROR]:', errorData);
      return null;
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply || null;
  } catch (err) {
    console.error('[GEMINI CALL ERROR]:', err);
    return null;
  }
};

module.exports = { getGeminiReply };
