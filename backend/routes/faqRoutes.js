const express = require('express');
const { body } = require('express-validator');
const faqController = require('../controllers/faqController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All FAQ endpoints require user authentication
router.use(authMiddleware);

router.get('/', faqController.list);

router.post(
  '/',
  [
    body('question').isLength({ min: 5 }).trim(),
    body('answer').isLength({ min: 5 }).trim(),
    body('category').optional().trim(),
  ],
  faqController.create
);

router.put('/:id', faqController.update);

module.exports = router;
