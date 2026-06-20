const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true, maxlength: 8000 },
    timestamp: { type: Date, default: Date.now },
    detectedLanguage: { type: String, default: 'en' },
  },
  { _id: true }
);

const chatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New conversation', maxlength: 120 },
    messages: { type: [messageSchema], default: [] },
    detectedLanguage: { type: String, default: 'en' },
    sessionId: { type: String, index: true },
  },
  { timestamps: true }
);

chatSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);
