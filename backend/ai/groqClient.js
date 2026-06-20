const getGroqReply = async (message, history = []) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[SHIELD AI] GROQ_API_KEY is not defined in environment variables.');
    return null;
  }

  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const model = 'llama-3.3-70b-versatile';

  // Build messages array
  const messages = [
    {
      role: 'system',
      content: `You are SHIELD AI, a strict, advanced multilingual cybersecurity chatbot assistant.

You MUST adhere to the following rules:
1. TOPIC LIMIT: You are allowed to answer ONLY questions, alerts, or queries directly related to cybersecurity, threat mitigation, network security, malware, cryptography, and digital forensics.
2. OUT-OF-SCOPE REDIRECT: If the user asks about ANY topic outside of cybersecurity (e.g. general knowledge, capitals of countries, weather, math, general non-security programming, recipes, etc.), you must politely decline to answer. Respond with: "I am a dedicated cybersecurity assistant. I can only answer questions and resolve problems related to cybersecurity." NOTE: Polite greetings (e.g., "hi", "hello", "hey", "good morning") are allowed; you should greet the user back and ask how you can assist them with their cybersecurity needs.
3. CONCISENESS: Keep your responses highly concise, direct, and short. Avoid long introductory or concluding pleasantries. Focus on immediate clarity.
4. GOOD FORMAT: Structure your response cleanly using short paragraphs, bullet points, and bolding key security terms. Ensure it is easy to read and scan quickly.`,
    },
  ];

  // Map history to OpenAI format (roles: user, assistant)
  (history || []).forEach((msg) => {
    messages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    });
  });

  // Append current user message
  messages.push({
    role: 'user',
    content: message,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages,
        model,
        temperature: 0.3,
        max_completion_tokens: 400,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[GROQ API ERROR]:', errorData);
      return null;
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    return reply || null;
  } catch (err) {
    console.error('[GROQ CALL ERROR]:', err);
    return null;
  }
};

module.exports = { getGroqReply };
