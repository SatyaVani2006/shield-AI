/**
 * SHIELD AI — Client-side language labels & Web Speech locale mapping
 */
const ShieldTranslate = (() => {
  const LANG_LABELS = {
    en: 'English',
    hi: 'Hindi',
    te: 'Telugu',
    ta: 'Tamil',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
  };

  const SPEECH_LOCALES = {
    en: 'en-US',
    hi: 'hi-IN',
    te: 'te-IN',
    ta: 'ta-IN',
    fr: 'fr-FR',
    es: 'es-ES',
    de: 'de-DE',
  };

  const getLabel = (code) => LANG_LABELS[code] || code.toUpperCase();

  const getSpeechLocale = (code) => SPEECH_LOCALES[code] || 'en-US';

  return { LANG_LABELS, SPEECH_LOCALES, getLabel, getSpeechLocale };
})();

window.ShieldTranslate = ShieldTranslate;
