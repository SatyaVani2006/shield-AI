const { randomUUID } = require('crypto');
const Chat = require('../models/Chat');
const { processMessage } = require('../ai/nlpEngine');
const { scoreWithTensor } = require('../ai/tensorSentiment');
const { detectLanguage } = require('../utils/language');
const { translateText } = require('../utils/translator');

exports.sendMessage = async (req, res) => {
  try {
    const {
      message,
      chatId,
      sessionId,
      targetLanguage,
    } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const detectedLang =
      detectLanguage(message);

    const preferred =
      targetLanguage ||
      req.user.preferredLanguage ||
      'en';

    let chat = null;

    if (chatId) {
      chat = await Chat.findOne({
        _id: chatId,
        userId: req.user._id,
      });
    }

    if (!chat) {
      chat = await Chat.create({
        userId: req.user._id,
        sessionId:
          sessionId || randomUUID(),
        detectedLanguage:
          detectedLang,
        title: message.slice(0, 60),
        messages: [],
      });
    }

    console.log(
      'CURRENT QUESTION:',
      message
    );

    const ai =
      await processMessage(
        message,
        {
          customerId:
            req.body.customerId,

          sessionId:
            chat.sessionId,

          history:
            chat.messages || [],
        }
      );

    const tensorScore =
      scoreWithTensor(message);

    let reply = ai.reply;

    if (preferred !== 'en') {
      reply =
        await translateText(
          reply,
          preferred,
          'en'
        );
    }

    chat.messages.push({
      role: 'user',
      content: message,
      detectedLanguage:
        detectedLang,
    });

    chat.messages.push({
      role: 'assistant',
      content: reply,
      detectedLanguage:
        preferred,
    });

    chat.detectedLanguage =
      detectedLang;

    await chat.save();

    return res.json({
      success: true,
      chatId: chat._id,
      sessionId:
        chat.sessionId,
      reply,
      originalReply: ai.reply,
      meta: {
        intent: ai.intent,
        confidence:
          ai.confidence,
        sentiment:
          ai.sentiment,
        tensorScore,
        detectedLanguage:
          detectedLang,
        responseLanguage:
          preferred,
        source: ai.source,
      },
    });
  } catch (err) {
    console.error(
      'CHAT ERROR:',
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const chats = await Chat.find({
      userId: req.user._id,
    })
      .sort({ updatedAt: -1 })
      .select(
        'title sessionId detectedLanguage updatedAt messages'
      )
      .limit(50);

    res.json({
      success: true,
      chats,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getChat = async (req, res) => {
  try {
    const chat =
      await Chat.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    res.json({
      success: true,
      chat,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    await Chat.deleteOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    res.json({
      success: true,
      message: 'Chat deleted',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.detectLanguage = async (req, res) => {
  const { text } = req.body;

  res.json({
    success: true,
    language: detectLanguage(text || ''),
  });
};