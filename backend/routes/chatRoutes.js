const express = require('express');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/message', chatController.sendMessage);
router.get('/history', chatController.getHistory);
router.get('/:id', chatController.getChat);
router.delete('/:id', chatController.deleteChat);
router.post('/detect-language', chatController.detectLanguage);

module.exports = router;
