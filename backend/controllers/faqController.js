const { validationResult } = require('express-validator');
const Faq = require('../models/Faq');
const { retrainFromFaqs } = require('../ai/nlpEngine');
const { isCyberRelated } = require('../utils/relevancy');

exports.list = async (req, res) => {
  try {
    // Only return FAQs created by the currently logged-in user
    const faqs = await Faq.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ success: true, faqs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { question, answer, category, keywords, language } = req.body;

    // Check cybersecurity relevancy
    const isRelated = await isCyberRelated(question, answer);
    if (!isRelated) {
      return res.status(400).json({
        success: false,
        message: 'Submission rejected: The question and answer must be relevant to cybersecurity, online safety, or threats.',
      });
    }

    const faq = await Faq.create({
      question,
      answer,
      category: category || 'general',
      keywords: keywords || [],
      language: language || 'en',
      userId: req.user._id,
    });

    // Retrain model in the background so it can match this FAQ
    retrainFromFaqs().catch(() => {});

    res.status(201).json({ success: true, faq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    // Verify ownership: only the user who created it can edit it
    if (!faq.userId || faq.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit FAQs that you submitted.',
      });
    }

    const { question, answer, category, keywords, language } = req.body;

    // Check cybersecurity relevancy of updated content
    const isRelated = await isCyberRelated(question || faq.question, answer || faq.answer);
    if (!isRelated) {
      return res.status(400).json({
        success: false,
        message: 'Update rejected: The updated question and answer must be relevant to cybersecurity, online safety, or threats.',
      });
    }

    if (question) faq.question = question;
    if (answer) faq.answer = answer;
    if (category) faq.category = category;
    if (keywords) faq.keywords = keywords;
    if (language) faq.language = language;

    await faq.save();

    // Retrain in background
    retrainFromFaqs().catch(() => {});

    res.json({ success: true, faq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

