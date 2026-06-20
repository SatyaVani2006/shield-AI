# 🛡️ SHIELD AI — How to Run

## ✅ Prerequisites (Install these once)

| Tool | Download | Check if installed |
|------|----------|-------------------|
| **Node.js** (v18+) | https://nodejs.org | `node -v` |
| **MongoDB** | https://www.mongodb.com/try/download/community | `mongod --version` |

---

## 🚀 Steps to Run

### Step 1 — Open Terminal in Project Folder
Right-click inside the folder `SHEILD AI` → **"Open in Terminal"**
Or navigate manually:
```
cd "D:\Downloads\CHATBOT AI\SHEILD AI"
```

### Step 2 — Install Dependencies (first time only)
```
npm install
```

### Step 3 — Start MongoDB
Open a **separate terminal** and run:
```
mongod
```
Keep this terminal open.

### Step 4 — Start the Server
```
npm start
```
You should see:
```
✅ MongoDB connected
🚀 SHIELD AI running on http://localhost:5000
```

### Step 5 — Open the App
Open your browser and go to:
```
http://localhost:5000
```

---

## 🔁 Quick Start (every time)

1. Open terminal in project folder
2. Start MongoDB: `mongod` (separate terminal)
3. Run: `npm start`
4. Open: `http://localhost:5000`

---

## 🌐 For Public Link (share with others)

After starting the server, open another terminal and run:
```
npx localtunnel --port 5000
```
It will give you a public URL like: `https://xxxx.loca.lt`

---

## ⚙️ Environment Variables (backend/.env)

```
MONGO_URI=mongodb://127.0.0.1:27017/shield_ai
JWT_SECRET=shieldsecret
JWT_EXPIRES_IN=7d
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
```

> Get a free Groq API key at: https://console.groq.com

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 5000 already in use | Run `npx kill-port 5000` then restart |
| MongoDB not connecting | Make sure `mongod` is running |
| `npm install` fails | Delete `node_modules` folder and try again |
| Login not working | Check MongoDB is running and `.env` file exists |
