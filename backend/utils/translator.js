/**
 * Offline-first translation using bundled cybersecurity phrase maps.
 * Optional LibreTranslate self-hosted endpoint via LIBRETRANSLATE_URL.
 */
const { SUPPORTED } = require('./language');

const PHRASES = require('../ai/data/phrases.json');

const translatePhrase = (text, targetLang) => {
  if (!text || targetLang === 'en') return text;
  const key = text.toLowerCase().trim();
  const entry = PHRASES[key];
  if (entry?.[targetLang]) return entry[targetLang];
  return null;
};

const translateWithLibre = async (text, sourceLang, targetLang) => {
  const base = process.env.LIBRETRANSLATE_URL;
  if (!base || sourceLang === targetLang) return null;
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: sourceLang === 'en' ? 'en' : sourceLang,
        target: targetLang,
        format: 'text',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.translatedText || null;
  } catch {
    return null;
  }
};

const translateWithAI = async (text, targetLang) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const langNames = {
    hi: 'Hindi',
    te: 'Telugu',
    ta: 'Tamil',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
  };
  const targetLangName = langNames[targetLang] || targetLang;

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
            content: `You are a professional, high-fidelity translator. Translate the user text directly into ${targetLangName}. Keep the formatting (markdown, bolding, line breaks) intact. Return only the translated text. Do not add any conversational remarks or explanations.`,
          },
          {
            role: 'user',
            content: text,
          }
        ],
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const data = await response.json();
      const translated = data?.choices?.[0]?.message?.content;
      return translated || null;
    }
  } catch (err) {
    console.error('[AI TRANSLATE ERROR]:', err.message);
  }
  return null;
};

const translateText = async (text, targetLang, sourceLang = 'en') => {
  if (!text || !SUPPORTED.includes(targetLang) || targetLang === sourceLang) {
    return text;
  }

  const exact = translatePhrase(text, targetLang);
  if (exact) return exact;

  const libre = await translateWithLibre(text, sourceLang, targetLang);
  if (libre) return libre;

  // Fallback to high-quality AI translation
  const aiTranslated = await translateWithAI(text, targetLang);
  if (aiTranslated) return aiTranslated;

  // Final fallback if AI translation fails
  if (targetLang !== 'en') {
    return `${text}\n\n_[Response in English — enable LibreTranslate or expand phrase maps for full ${targetLang} translation.]_`;
  }
  return text;
};

module.exports = { translateText, translatePhrase };
