# SHIELD AI

**SHIELD AI** is an advanced, multilingual cybersecurity chatbot platform built with vanilla HTML/CSS/JavaScript and a Node.js/Express backend. It uses **local NLP** (no OpenAI, Gemini, Claude, or other cloud AI APIs), **MongoDB** for persistence, and the **Web Speech API** for voice interaction.

![Theme](https://img.shields.io/badge/UI-Dark%20Cyber-blue) ![Stack](https://img.shields.io/badge/Stack-Node%20%2B%20Mongo-green)

## Features

- Real-time cybersecurity chat with typing animation
- FAQ training with TF-IDF + node-nlp intent matching
- Session-based conversation memory in MongoDB
- Multilingual support: English, Hindi, Telugu, Tamil, French, Spanish, German
- Auto language detection (`franc`)
- Voice input & output (Web Speech API)
- JWT authentication with bcrypt password hashing
- Security: Helmet, rate limiting, input sanitization, XSS protection

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| NLP/AI | natural, node-nlp, compromise.js, @tensorflow/tfjs (pure JS) |
| Speech | Web Speech API (browser) |
| Auth | JWT, bcryptjs |

## Project Structure

```
shield-ai/
├── frontend/          # Static UI (served by Express)
│   ├── index.html     # Landing page
│   ├── login.html     # Auth
│   ├── dashboard.html # Chat
│   ├── faq.html       # FAQ training
│   ├── settings.html  # User preferences
│   ├── css/
│   └── js/
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── ai/            # NLP engine & knowledge base
│   └── database/
├── package.json
├── .env
└── README.md
```

## Prerequisites

- **Node.js** 18+
- **MongoDB** 6+ (local or Atlas)

## Installation

1. **Clone or open the project folder**

```bash
cd "SHEILD AI"
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment**

Copy `.env.example` to `.env` and update values:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/shield_ai
JWT_SECRET=your_long_random_secret
```

4. **Start MongoDB** (if running locally)

```bash
# Windows (if installed as service)
net start MongoDB

# Or with mongod directly
mongod
```

5. **Seed default cybersecurity FAQs** (optional, first run)

```bash
npm run seed
```

6. **Start the server**

```bash
npm start
```

7. **Open the app**

Visit [http://localhost:5000](http://localhost:5000)

- Register a new account on **login.html**
- Use **Dashboard** to chat
- Add FAQs under **FAQ Training**
- Set preferred language in **Settings**

## How to Run Frontend & Backend

This project serves the frontend from the same Express server — **one command runs everything**:

```bash
npm start
```

- Backend API: `http://localhost:5000/api/*`
- Frontend pages: `http://localhost:5000/` (static files from `frontend/`)

Development with auto-restart (Node 18+):

```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `5000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window |
| `RATE_LIMIT_MAX` | Max requests per window |
| `LIBRETRANSLATE_URL` | Optional self-hosted LibreTranslate URL for full dynamic translation |

## REST API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Current user |
| PATCH | `/api/auth/settings` | Yes | Update language |
| POST | `/api/chat/message` | Yes | Send chat message |
| GET | `/api/chat/history` | Yes | List chats |
| GET | `/api/chat/:id` | Yes | Get chat |
| DELETE | `/api/chat/:id` | Yes | Delete chat |
| POST | `/api/chat/detect-language` | Yes | Detect language |
| GET | `/api/faq` | No | List FAQs |
| POST | `/api/faq` | Yes | Create FAQ |
| PUT | `/api/faq/:id` | Yes | Update FAQ |
| DELETE | `/api/faq/:id` | Yes | Delete FAQ |
| POST | `/api/faq/train` | Yes | Retrain NLP on FAQs |
| GET | `/api/health` | No | Health check |

## MongoDB Collections

- **users** — username, email, password (hashed), preferredLanguage
- **chats** — userId, messages[], sessionId, detectedLanguage
- **faqs** — question, answer, category, keywords[]

## Multilingual Notes

- **Detection**: `franc` on the backend
- **Responses**: Core answers in English, translated via bundled phrase maps; optional **LibreTranslate** (self-hosted) for dynamic text
- **Voice**: Browser TTS/STT locales mapped in `frontend/js/translate.js`

### Optional: LibreTranslate (self-hosted)

```bash
docker run -ti --rm -p 5001:5000 libretranslate/libretranslate
```

Add to `.env`:

```env
LIBRETRANSLATE_URL=http://localhost:5001
```

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT-protected chat & FAQ write routes
- `helmet` HTTP headers
- `express-rate-limit`
- `sanitize-html` on request bodies

## Future Improvements

- Expand offline translation phrase maps per language
- WebSocket streaming responses
- Admin roles and audit logs
- Export chat transcripts (PDF/JSON)
- On-device WASM models for richer NLU
- Docker Compose (app + MongoDB + LibreTranslate)
- Automated security quiz mode
- Integration with SIEM alert webhooks

## License

MIT
