const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 500 },
    answer: { type: String, required: true, maxlength: 4000 },
    category: {
      type: String,
      default: 'general',
      enum: [
        'general',
        'password',
        'malware',
        'phishing',
        'network',
        'awareness',
        'threats',
      ],
    },
    keywords: [{ type: String, trim: true, lowercase: true }],
    language: { type: String, default: 'en' },
  },
  { timestamps: true }
);

faqSchema.index({ question: 'text', keywords: 'text', answer: 'text' });

module.exports = mongoose.model('Faq', faqSchema);
