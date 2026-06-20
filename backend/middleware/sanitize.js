const sanitizeHtml = require('sanitize-html');

const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
};

const sanitizeBody = (req, res, next) => {
  const walk = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeInput(obj[key]);
      } else if (typeof obj[key] === 'object') {
        walk(obj[key]);
      }
    });
  };
  if (req.body) walk(req.body);
  next();
};

module.exports = { sanitizeInput, sanitizeBody };
