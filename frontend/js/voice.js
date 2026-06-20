/**
 * SHIELD AI — Web Speech API (voice input / output)
 */
const ShieldVoice = (() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;

  let recognition = null;
  let listening = false;
  let onResult = null;
  let onError = null;

  const isSupported = () => !!(SpeechRecognition && synth);

  const initRecognition = (langCode = 'en') => {
    if (!SpeechRecognition) return null;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = ShieldTranslate.getSpeechLocale(langCode);

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (onResult) onResult(transcript, event.results[event.results.length - 1]?.isFinal);
    };

    recognition.onerror = (e) => {
      listening = false;
      if (onError) onError(e.error);
    };

    recognition.onend = () => {
      listening = false;
      updateVisualizer(false);
    };

    return recognition;
  };

  const startListening = (langCode, callbacks = {}) => {
    if (!SpeechRecognition) {
      callbacks.onError?.('not-supported');
      return;
    }
    onResult = callbacks.onResult;
    onError = callbacks.onError;
    initRecognition(langCode);
    try {
      recognition.start();
      listening = true;
      updateVisualizer(true);
    } catch (err) {
      callbacks.onError?.(err.message);
    }
  };

  const stopListening = () => {
    if (recognition && listening) {
      recognition.stop();
    }
    listening = false;
    updateVisualizer(false);
  };

  const toggleListening = (langCode, callbacks) => {
    if (listening) {
      stopListening();
    } else {
      startListening(langCode, callbacks);
    }
    return !listening;
  };

  const pickVoice = (langCode, gender) => {
    const voices = synth.getVoices();
    const locale = ShieldTranslate.getSpeechLocale(langCode);
    const prefix = locale.split('-')[0];

    const match = voices.filter((v) => v.lang.startsWith(prefix));
    if (!match.length) return voices[0];

    const female = match.find((v) => /female|woman|zira|samantha|neural/i.test(v.name));
    const male = match.find((v) => /male|man|david|mark|neural/i.test(v.name));

    if (gender === 'male' && male) return male;
    if (gender === 'female' && female) return female;
    return match[0];
  };

  const stripMarkdown = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/^\s*[-*•]\s+/gm, '')
      .replace(/^###\s+/gm, '')
      .replace(/^##\s+/gm, '')
      .replace(/^#\s+/gm, '');
  };

  const speak = (text, langCode = 'en', gender = 'female', callbacks = {}) => {
    if (!synth || !text) return;
    synth.cancel();
    
    // 100ms timeout resolves issues in Chrome/Edge where cancel() cancels the next speak() call if called synchronously
    setTimeout(() => {
      const cleanText = stripMarkdown(text);
      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.lang = ShieldTranslate.getSpeechLocale(langCode);
      const voice = pickVoice(langCode, gender);
      if (voice) utter.voice = voice;
      utter.rate = 0.95;
      utter.pitch = gender === 'male' ? 0.85 : 1.05;
      
      utter.onstart = () => {
        callbacks.onStart?.();
      };
      utter.onend = () => {
        callbacks.onEnd?.();
      };
      utter.onerror = () => {
        callbacks.onEnd?.();
      };
      
      synth.speak(utter);
    }, 100);
  };

  const stopSpeaking = () => {
    if (synth) {
      synth.cancel();
    }
  };

  const isSpeaking = () => {
    return !!(synth && synth.speaking);
  };

  const updateVisualizer = (active) => {
    const viz = document.getElementById('voice-viz');
    if (!viz) return;
    viz.classList.toggle('hidden', !active);
    viz.classList.toggle('listening', active);
  };

  if (synth) {
    synth.onvoiceschanged = () => {};
  }

  return {
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    isSpeaking,
    get listening() {
      return listening;
    },
  };
})();

window.ShieldVoice = ShieldVoice;
