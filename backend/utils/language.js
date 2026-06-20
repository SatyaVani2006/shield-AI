const franc = require('franc');

const SUPPORTED = ['en', 'hi', 'te', 'ta', 'fr', 'es', 'de'];

const FRANC_MAP = {
  eng: 'en',
  hin: 'hi',
  tel: 'te',
  tam: 'ta',
  fra: 'fr',
  spa: 'es',
  deu: 'de',
};

const detectLanguage = (text) => {
  if (!text || text.trim().length < 3) return 'en';
  const code = franc(text, { minLength: 3 });
  if (code === 'und') return 'en';
  return FRANC_MAP[code] || 'en';
};

const isSupported = (lang) => SUPPORTED.includes(lang);

module.exports = { detectLanguage, isSupported, SUPPORTED };
