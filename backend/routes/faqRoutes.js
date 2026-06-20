const express = require('express');
const { body } = require('express-validator');
const faqController = require('../controllers/faqController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', faqController.list);

router.use(authMiddleware);

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
router.delete('/:id', faqController.remove);
router.post('/train', faqController.train);

module.exports = router;
