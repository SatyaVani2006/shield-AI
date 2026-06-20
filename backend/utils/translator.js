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

const translateText = async (text, targetLang, sourceLang = 'en') => {
  if (!text || !SUPPORTED.includes(targetLang) || targetLang === sourceLang) {
    return text;
  }

  const exact = translatePhrase(text, targetLang);
  if (exact) return exact;

  const libre = await translateWithLibre(text, sourceLang, targetLang);
  if (libre) return libre;

  // Fallback: return English with language notice for unsupported dynamic text
  if (targetLang !== 'en') {
    return `${text}\n\n_[Response in English — enable LibreTranslate or expand phrase maps for full ${targetLang} translation.]_`;
  }
  return text;
};

module.exports = { translateText, translatePhrase };
