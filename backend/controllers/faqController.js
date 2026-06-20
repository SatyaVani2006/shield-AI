const { validationResult } = require('express-validator');
const Faq = require('../models/Faq');
const { retrainFromFaqs } = require('../ai/nlpEngine');

exports.list = async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ updatedAt: -1 });
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
    const faq = await Faq.create({
      question,
      answer,
      category: category || 'general',
      keywords: keywords || [],
      language: language || 'en',
    });
    await retrainFromFaqs().catch(() => {});
    res.status(201).json({ success: true, faq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
    await retrainFromFaqs().catch(() => {});
    res.json({ success: true, faq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    let deletedFaq = null;

    // 1. Try finding and deleting as Mongoose ObjectId
    try {
      deletedFaq = await Faq.findByIdAndDelete(id);
    } catch (castErr) {
      console.warn(`[SHIELD AI] Mongoose ObjectId cast failed for ID: ${id}. Trying string match...`);
    }

    // 2. Fallback to raw MongoDB collection deletion to bypass Mongoose casting
    if (!deletedFaq) {
      try {
        const { ObjectId } = require('mongoose').Types;
        if (ObjectId.isValid(id)) {
          const rawResult = await Faq.collection.deleteOne({ _id: new ObjectId(id) });
          if (rawResult.deletedCount > 0) {
            deletedFaq = true;
          }
        }
      } catch (err) {
        console.warn(`[SHIELD AI] Raw ObjectId delete failed: ${err.message}`);
      }

      if (!deletedFaq) {
        const rawResult = await Faq.collection.deleteOne({ _id: id });
        if (rawResult.deletedCount > 0) {
          deletedFaq = true;
        }
      }
    }

    await retrainFromFaqs().catch((retrainErr) => {
      console.error('[SHIELD AI] Retraining failed after deletion:', retrainErr.message);
    });

    res.json({ success: true, message: 'FAQ removed' });
  } catch (err) {
    console.error('[SHIELD AI] Error removing FAQ:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.train = async (req, res) => {
  try {
    await retrainFromFaqs();
    const count = await Faq.countDocuments();
    res.json({ success: true, message: `NLP retrained on ${count} FAQs` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
