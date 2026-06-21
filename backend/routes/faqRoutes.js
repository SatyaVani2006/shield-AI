const express = require('express');
const router = express.Router();

// All FAQ endpoints are disabled since management is done directly via database/code.
router.all('*', (req, res) => {
  res.status(403).json({
    success: false,
    message: 'FAQ management via API is disabled.',
  });
});

module.exports = router;
