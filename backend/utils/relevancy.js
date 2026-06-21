// Utility to classify if user FAQ submission is related to cybersecurity
const fetch = require('node-fetch'); // fallback check if global fetch is not defined, but Node 18+ has it. We can just use global.fetch or check.

async function isCyberRelated(question, answer) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[SHIELD AI] GROQ_API_KEY is not defined. Bypassing relevancy check.');
    return true; // Bypass to avoid blocking users if key is missing
  }

  const textToCheck = `Question: ${question}\nAnswer: ${answer}`;
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a strict cybersecurity classifier. Analyze if the text provided by the user is related to cybersecurity, computer networks, online safety, malware, cryptography, digital forensics, hacking, password security, system hardening, or online threats. Respond with exactly "YES" or "NO". Do not include any other words or punctuation.',
          },
          {
            role: 'user',
            content: textToCheck,
          }
        ],
        temperature: 0.0,
        max_completion_tokens: 5,
      }),
      signal: AbortSignal.timeout(5000), // 5 seconds timeout
    });

    if (response.ok) {
      const data = await response.json();
      const answerText = (data?.choices?.[0]?.message?.content || '').trim().toUpperCase();
      console.log('[RELEVANCY CHECK RESULT]:', answerText);
      return answerText.includes('YES');
    } else {
      console.error('[RELEVANCY CHECK API ERROR]:', response.status);
    }
  } catch (err) {
    console.error('[RELEVANCY CHECK ERROR]:', err.message);
  }

  // Basic local backup keyword matching if Groq fails or timeouts
  const keywords = [
    'password', 'phishing', 'spam', 'scam', 'hacker', 'malware', 'virus', 'ransomware',
    'trojan', 'spyware', 'firewall', 'encrypt', 'decrypt', 'cyber', 'security', 'hack',
    'vulnerability', 'exploit', 'ddos', 'spoof', 'leak', 'auth', 'mfa', 'dns', 'port',
    'sql', 'xss', 'inject', 'cert', 'hash', 'threat', 'botnet', 'proxy', 'vpn'
  ];
  const combined = `${question} ${answer}`.toLowerCase();
  const matched = keywords.some(kw => combined.includes(kw));
  console.log('[RELEVANCY LOCAL BACKUP MATCH]:', matched);
  return matched;
}

module.exports = { isCyberRelated };
