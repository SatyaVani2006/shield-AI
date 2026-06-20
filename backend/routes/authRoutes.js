const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('username').isLength({ min: 3 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('preferredLanguage').optional().isIn(['en', 'hi', 'te', 'ta', 'fr', 'es', 'de']),
  ],
  authController.register
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  authController.login
);

router.get('/me', authMiddleware, authController.me);
router.patch('/settings', authMiddleware, authController.updateSettings);

module.exports = router;
