const natural = require('natural');
const nlp = require('compromise');
const fs = require('fs');
const path = require('path');
const { NlpManager } = require('node-nlp');
const { detectLanguage } = require('../utils/language');
const { getGroqReply } = require('./groqClient');
const knowledge = require('./data/cyberKnowledge.json');
const Faq = require('../models/Faq');
const Customer = require('../models/Customer');

const MODEL_PATH = path.join(__dirname, '..', 'model.nlp');
let manager = new NlpManager({ languages: ['en', 'hi', 'te', 'ta', 'fr', 'es', 'de'], autoSave: false });

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

const sessionMemory = {};

const preprocess = (text) => {

  const doc = nlp(text);

  const normalized = doc
    .normalize()
    .out('text')
    .toLowerCase()
    .trim();

  const tokens =
    tokenizer.tokenize(normalized) || [];

  const stems = tokens.map((t) =>
    stemmer.stem(t)
  );

  return {
    normalized,
    tokens,
    stems,
  };
};

const analyzeSentiment = (text) => {

  const analyzer =
    new natural.SentimentAnalyzer(
      'English',
      stemmer,
      'afinn'
    );

  const tokens =
    tokenizer.tokenize(
      text.toLowerCase()
    ) || [];

  if (!tokens.length) {
    return 'neutral';
  }

  const score =
    analyzer.getSentiment(tokens);

  if (score > 0.1) {
    return 'positive';
  }

  if (score < -0.1) {
    return 'negative';
  }

  return 'neutral';
};

const processMessage = async (
  text,
  context = {}
) => {

 const currentQuestion =
  text.split('\n').pop().replace(/^user:\s*/i, '');

const { normalized } =
  preprocess(currentQuestion);

  console.log(
    'USER QUESTION:',
    normalized
  );

  console.log(
    'CUSTOMER ID:',
    context.customerId
  );

  const sentiment =
    analyzeSentiment(text);

  const sessionId =
    context.sessionId || 'default';

  if (
    !sessionMemory[sessionId]
  ) {

    sessionMemory[sessionId] = {};
  }

  // =========================
  // GREETINGS
  // =========================
  const greetingsRegex = /^(hi|hello|hey|greetings|good\s+morning|good\s+afternoon|good\s+evening)\b/i;
  if (greetingsRegex.test(normalized)) {
    const savedName = sessionMemory[sessionId]?.name;
    const greetingText = savedName ? `Hello, ${savedName}!` : 'Hello!';
    return {
      reply: `${greetingText} I am SHIELD AI, your cybersecurity assistant. How can I help you stay secure today?`,
      intent: 'greetings',
      confidence: 0.99,
      sentiment,
      source: 'greetings',
    };
  }

  // =========================
  // STORE USER NAME
  // =========================

  const nameMatch =
    normalized.match(
      /^my name is\s+([a-zA-Z]+)/i
    );

  if (nameMatch) {

    sessionMemory[
      sessionId
    ].name = nameMatch[1];

    return {
      reply:
        `Nice to meet you, ${nameMatch[1]}!`,

      intent:
        'memory.store_name',

      confidence: 0.99,

      sentiment,

      source: 'memory',
    };
  }

  // =========================
  // GET USER NAME
  // =========================

  if (
    normalized.includes(
      'what is my name'
    ) ||
    normalized.includes(
      "what's my name"
    )
  ) {

    const savedName =
      sessionMemory[
        sessionId
      ].name;

    return {
      reply: savedName
        ? `Your name is ${savedName}.`
        : "I don't know your name yet.",

      intent:
        'memory.get_name',

      confidence: 0.99,

      sentiment,

      source: 'memory',
    };
  }

  // =========================
  // FAQ MATCHING FIRST
  // =========================

  const faqs =
    await Faq.find().lean();

  if (faqs.length) {

    let bestFaq = null;
    let bestScore = 0;

    for (const faq of faqs) {

      let score = 0;

      const faqQuestion =
        faq.question
          .toLowerCase()
          .trim();

      // EXACT QUESTION

      if (
        normalized === faqQuestion
      ) {

        score += 100;
      }

      // KEYWORDS

      (
        faq.keywords || []
      ).forEach((keyword) => {

        const cleanKeyword =
          keyword
            .toLowerCase()
            .trim();

        if (
          normalized.includes(
            cleanKeyword
          )
        ) {

          score += 40;
        }
      });

      // WORD MATCH

      const userWords =
        normalized.split(/\s+/);

      const faqWords =
        faqQuestion.split(/\s+/);

      userWords.forEach((word) => {

        if (
          word.length > 4 &&
          faqWords.includes(word)
        ) {

          score += 2;
        }
      });

      if (score > bestScore) {

        console.log(
          'FAQ:',
          faq.question,
          'SCORE:',
          score
        );

        bestScore = score;
        bestFaq = faq;
      }
    }

    if (
      bestFaq &&
      bestScore >= 60
    ) {

      return {
        reply:
          bestFaq.answer,

        intent:
          bestFaq.category ||
          'faq',

        confidence: 0.95,

        sentiment,

        source: 'faq',
      };
    }
  }

  // =========================
  // CUSTOMER DATA
  // =========================

  console.log("CONTEXT:", context);

console.log(
  "CUSTOMER ID RECEIVED:",
  context.customerId
);

const customer =
  await Customer.findOne({
    customerId:
      String(
        context.customerId
      ).trim(),
  });

console.log(
  "FOUND CUSTOMER:",
  customer
);

  console.log(
    'CUSTOMER:',
    customer
  );

  if (
    /\bplan\b/i.test(normalized) ||
    /\bsubscription\b/i.test(normalized)
  ) {

    if (customer) {

      return {

        reply:
          `Your current plan is ${customer.plan}.`,

        intent:
          'customer.plan',

        confidence: 0.99,

        sentiment,

        source:
          'customer',
      };
    }

    return {

      reply:
        'You are not subscribed to any SHIELD AI plan.',

      intent:
        'customer.no_plan',

      confidence: 0.99,

      sentiment,

      source:
        'customer',
    };
  }

  // =========================
  // STORAGE
  // =========================

  if (
    /\bstorage\b/i.test(normalized) ||
    /gb\s+used/i.test(normalized)
  ) {

    if (!customer) {

      return {
        reply:
          'You are not subscribed to any SHIELD AI plan.',

        intent:
          'customer.no_plan',

        confidence: 0.99,

        sentiment,

        source:
          'customer',
      };
    }

    return {

      reply:
        `You have used ${customer.storageUsedGB} GB out of ${customer.totalStorageGB} GB.`,

      intent:
        'customer.storage',

      confidence: 0.99,

      sentiment,

      source:
        'customer',
    };
  }

  // =========================
  // SESSIONS
  // =========================

  if (
    /\bsessions\b/i.test(normalized)
  ) {

    if (!customer) {

      return {
        reply:
          'You are not subscribed to any SHIELD AI plan.',

        intent:
          'customer.no_plan',

        confidence: 0.99,

        sentiment,

        source:
          'customer',
      };
    }

    return {

      reply:
        `You have completed ${customer.sessionsCompleted} sessions.`,

      intent:
        'customer.sessions',

      confidence: 0.99,

      sentiment,

      source:
        'customer',
    };
  }

  // =========================
  // LOGS
  // =========================

  if (
    /\blogs\b/i.test(normalized)
  ) {

    if (!customer) {

      return {
        reply:
          'You are not subscribed to any SHIELD AI plan.',

        intent:
          'customer.no_plan',

        confidence: 0.99,

        sentiment,

        source:
          'customer',
      };
    }

    return {

      reply:
        `You have uploaded ${customer.logsUploaded} logs.`,

      intent:
        'customer.logs',

      confidence: 0.99,

      sentiment,

      source:
        'customer',
    };
  }

  // =========================
  // API REQUESTS
  // =========================

  if (
    /\bapi\b/i.test(normalized)
  ) {

    if (!customer) {

      return {
        reply:
          'You are not subscribed to any SHIELD AI plan.',

        intent:
          'customer.no_plan',

        confidence: 0.99,

        sentiment,

        source:
          'customer',
      };
    }

    return {

      reply:
        `You have ${customer.apiRequestsRemaining} API requests remaining.`,

      intent:
        'customer.api',

      confidence: 0.99,

      sentiment,

      source:
        'customer',
    };
  }

  // =========================
  // GROQ FALLBACK
  // =========================

  const groqReply = await getGroqReply(normalized, context.history || []);
  if (groqReply) {
    return {
      reply: groqReply,
      intent: 'groq_fallback',
      confidence: 0.9,
      sentiment,
      source: 'groq',
    };
  }

  // =========================
  // NLP MODEL MATCHING
  // =========================

  const lang = detectLanguage(normalized);
  const nlpResult = await manager.process(lang, normalized);

  console.log('NLP Model Classification Result:', {
    intent: nlpResult.intent,
    score: nlpResult.score,
    answer: nlpResult.answer,
  });

  if (nlpResult.intent && nlpResult.intent !== 'None' && nlpResult.score >= 0.5) {
    return {
      reply: nlpResult.answer || "I found a match but no answer was defined.",
      intent: nlpResult.intent,
      confidence: nlpResult.score,
      sentiment,
      source: 'nlp_model',
    };
  }

  // =========================
  // STATIC FALLBACK
  // =========================

  return {

    reply:
      "I couldn't find an exact answer. Try asking another cybersecurity question.",

    intent:
      'unknown',

    confidence:
      0.3,

    sentiment,

    source:
      'fallback',
  };
};

const retrainFromFaqs = async () => {
  const freshManager = new NlpManager({ languages: ['en', 'hi', 'te', 'ta', 'fr', 'es', 'de'], autoSave: false });

  // 1. Train static cyber knowledge base
  knowledge.forEach((item) => {
    const intent = `cyber.${item.category}`;
    item.intents.forEach((phrase) => {
      freshManager.addDocument('en', phrase, intent);
    });
    freshManager.addAnswer('en', intent, item.response);
  });

  // 2. Train dynamic database FAQs
  const faqs = await Faq.find().lean();
  faqs.forEach((faq) => {
    const lang = faq.language || 'en';
    const intent = `faq.${faq.category || 'general'}.${faq._id}`;
    freshManager.addDocument(lang, faq.question, intent);
    freshManager.addAnswer(lang, intent, faq.answer);
  });

  await freshManager.train();
  try {
    await freshManager.save(MODEL_PATH);
  } catch (saveErr) {
    console.warn(`[SHIELD AI] Failed to save NLP model to disk (expected on Vercel): ${saveErr.message}`);
  }

  manager = freshManager;
  console.log(`[SHIELD AI] NLP retrained successfully with ${faqs.length} FAQs and saved to ${MODEL_PATH}`);
  return true;
};

const ensureNlp = async () => {
  if (fs.existsSync(MODEL_PATH)) {
    console.log(`[SHIELD AI] Loading existing NLP model from ${MODEL_PATH}`);
    await manager.load(MODEL_PATH);
    return true;
  } else {
    console.log('[SHIELD AI] NLP model not found. Training model...');
    return await retrainFromFaqs();
  }
};

module.exports = {
  processMessage,
  preprocess,
  analyzeSentiment,
  retrainFromFaqs,
  ensureNlp,
};