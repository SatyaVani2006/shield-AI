const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
});
require('dotenv').config({
  path: path.join(__dirname, '.env'),
});

console.log('MONGO URI:', process.env.MONGO_URI);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./database/connection');
const { sanitizeBody } = require('./middleware/sanitize');
const { ensureNlp } = require('./ai/nlpEngine');

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const faqRoutes = require('./routes/faqRoutes');

const app = express();

// Trust reverse proxy (required for localtunnel, ngrok, nginx, etc.)
app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;

// ======================
// DATABASE CONNECTION
// ======================

connectDB()
  .then(() => {
    console.log('[SHIELD AI] MongoDB Connected');
  })
  .catch((err) => {
    console.error(
      '[SHIELD AI] MongoDB connection failed:',
      err.message
    );
  });

// ======================
// NLP ENGINE
// ======================

ensureNlp().catch((err) =>
  console.warn(
    '[SHIELD AI] NLP warmup:',
    err.message
  )
);

// ======================
// SECURITY
// ======================

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs:
      Number(process.env.RATE_LIMIT_WINDOW_MS) ||
      15 * 60 * 1000,

    max:
      Number(process.env.RATE_LIMIT_MAX) ||
      500, // raised from 100 → 500 so static assets + API calls don't hit the limit

    standardHeaders: true,
    legacyHeaders: false,

    // Skip rate limiting for static file requests
    skip: (req) => req.path.match(/\.(css|js|html|ico|png|jpg|svg|woff2?)$/),
  })
);

// ======================
// MIDDLEWARE
// ======================

app.use(express.json({ limit: '32kb' }));

app.use(sanitizeBody);

// ======================
// API ROUTES
// ======================

app.use('/api/auth', authRoutes);

app.use('/api/chat', chatRoutes);

app.use('/api/faq', faqRoutes);

// ======================
// HEALTH CHECK
// ======================

app.get('/api/health', (req, res) => {

  res.json({

    success: true,

    service: 'SHIELD AI',

    status: 'online',

  });

});

// ======================
// FRONTEND
// ======================

const frontendPath = path.join(
  __dirname,
  '..',
  'frontend'
);

app.use(
  express.static(frontendPath, {
    etag: false,
    maxAge: '0',
    setHeaders: (res, filePath) => {
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    },
  })
);

app.get('*', (req, res, next) => {

  if (req.path.startsWith('/api')) {
    return next();
  }

  const file =
    req.path.endsWith('.html') ||
    req.path === '/'
      ? req.path
      : '/dashboard.html';

  const target =
    file === '/'
      ? 'index.html'
      : file.replace(/^\//, '');

  res.sendFile(
    path.join(frontendPath, target),
    (err) => {

      if (err) {

        res.sendFile(
          path.join(
            frontendPath,
            'index.html'
          )
        );

      }

    }
  );

});

// ======================
// ERROR HANDLER
// ======================

app.use((err, req, res, next) => {

  console.error(err);

  res.status(500).json({

    success: false,

    message: 'Internal server error',

  });

});

// ======================
// START SERVER (Conditional for Serverless environments like Vercel)
// ======================

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`[SHIELD AI] Server running at http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error(`   Another server is already running at http://localhost:${PORT}`);
      console.error(`   ✅ Just open http://localhost:${PORT} in your browser — it's already working!`);
      console.error(`   Or run: npx kill-port ${PORT}  then  npm start\n`);
      process.exit(0); // exit cleanly (code 0) instead of crashing
    } else {
      console.error('[SHIELD AI] Server error:', err.message);
      process.exit(1);
    }
  });
}

module.exports = app;