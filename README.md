# 🧬 GENAI ESCAPE

**Learn. Solve. Generate. Escape.**

GENAI ESCAPE is an interactive **Generative AI learning platform** wrapped in a **story-based escape-room game**. The player is trapped inside a futuristic AI laboratory (GEN-X Laboratory) that has entered lockdown, and must complete 5 rooms — each teaching a core Generative AI concept — to recover 5 hidden code fragments and escape.

The project both **teaches** Generative AI and **uses** Generative AI: every hint, prompt evaluation, quiz, and text/code generation in the game is powered live by the **Google Gemini API**.

---

## ✨ Features

- 🏠 Polished, animated landing page with a futuristic lab aesthetic
- 📖 Story-driven mission briefing
- 🧪 5 interactive rooms, each teaching a distinct GenAI concept:
  1. **The Origin** — What is Generative AI?
  2. **The Prompt** — Prompt engineering (role, context, task, constraints, format)
  3. **The Model Vault** — Popular GenAI models (GPT, Gemini, Claude, Llama, DALL-E)
  4. **The Creation Chamber** — Modalities of Generative AI (text, image, audio, video, code)
  5. **The Dark Side** — Responsible AI (hallucinations, bias, deepfakes, privacy, copyright)
- 🔐 Final "Master Prompt" challenge, evaluated live by Gemini
- 🤖 AI Lab Assistant — real Gemini-powered hints in every room (small score penalty per hint)
- 📚 AI Knowledge Hub (`explorer.html`) — expandable reference sections plus a live "Try Generative AI" playground and an AI quiz generator
- 🎮 Score, timer, progress bar, code fragments, and room-unlocking — all persisted in `localStorage`
- 🔊 Optional sound effects (WebAudio-based, no external audio files)
- 🎉 Confetti + success screen on completion
- 📱 Fully responsive (desktop, tablet, mobile)
- 🛡️ Graceful AI fallback — the game never breaks if Gemini is unavailable; only the AI-powered extras degrade

---

## 🧱 Technology Stack

**Frontend:** HTML5, CSS3 (custom design system with CSS variables), Vanilla JavaScript
**Backend:** Node.js + Express.js
**AI:** Google Gemini API (`@google/generative-ai`)
**Storage:** Browser `localStorage` only — **no database of any kind**

---

## 🗂️ Project Architecture

```
genai-escape/
│
├── package.json
├── server.js              # Express server + Gemini proxy endpoints
├── .env                    # Your Gemini API key (never committed)
├── .env.example
├── .gitignore
├── README.md
│
└── public/
    ├── index.html          # Home / landing page
    ├── story.html          # Mission briefing → starts the game state
    ├── explorer.html        # AI Knowledge Hub + live Gemini demos
    ├── room1.html … room5.html
    ├── final.html          # Master Prompt challenge
    ├── result.html         # Success screen + stats
    │
    ├── css/
    │   ├── style.css        # Design system, layout, components
    │   ├── animations.css   # Keyframes, particles, confetti
    │   └── rooms.css        # Room-specific layouts
    │
    └── js/
        ├── game.js          # Shared game state engine (localStorage)
        ├── explorer.js
        ├── room1.js … room5.js
        └── final.js
```

---

## 🤖 How Generative AI Is Used

All Gemini calls happen **server-side only** — the API key is never exposed to the browser. The frontend calls these backend endpoints:

| Endpoint | Purpose |
|---|---|
| `POST /api/hint` | Generates a guided (non-revealing) hint for the current puzzle |
| `POST /api/generate` | Generates text or code (used in the Creation Chamber & Knowledge Hub demo) |
| `POST /api/evaluate-prompt` | Scores a player-written prompt (Room 2 and the Final Challenge) |
| `POST /api/generate-quiz` | Generates a 5-question multiple-choice quiz on any topic |
| `POST /api/check-answer` | Optional AI-assisted free-text answer checking |
| `GET /api/status` | Reports whether the Gemini key is configured |

If Gemini is unavailable (missing key, network error, rate limit), every endpoint returns a clean JSON error and the frontend shows **"AI assistant temporarily unavailable"** — the core game (static puzzles, scoring, progress) keeps working regardless.

---

## 🎮 How the Game Works

1. **Home →** Enter the Lab
2. **Story →** Start Mission (creates a fresh game state in `localStorage`)
3. **Rooms 1–5 →** Learn a concept, solve a puzzle, optionally use an AI hint, unlock a code fragment
4. **Final Challenge →** Enter the 5-digit code assembled from your fragments, then write a "master prompt" that Gemini evaluates
5. **Result →** See your score, time, hints used, and AI prompt score; play again anytime

Game state persists across page refreshes via `localStorage` (key: `genaiEscapeState`). "Play Again" clears it and starts fresh.

---

## 🚀 Installation

### 1. Clone / unzip the project

```bash
cd genai-escape
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure your Gemini API key

Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey), then edit `.env`:

```
GEMINI_API_KEY=your_actual_key_here
PORT=3000
```

> The game runs fine without a key — AI-powered features will just show a graceful "unavailable" message.

### 4. Run the server

```bash
npm start
```

### 5. Open the app

```
http://localhost:3000
```

---

## 🗃️ No Database

**GENAI ESCAPE is a database-free educational web application.** Player progress — score, completed rooms, hints used, code fragments, and timer information — is stored locally in the browser using `localStorage`. No MongoDB, MySQL, Firebase, Supabase, PostgreSQL, or SQLite is used anywhere in this project.

---

## 🔐 Security Notes

- The `GEMINI_API_KEY` lives only in `.env` on the server and is read via `dotenv`.
- `.env` is listed in `.gitignore` and should never be committed.
- The frontend never sees the API key — it only talks to your own `/api/*` Express routes.

---

## 📄 License

MIT — built as an educational Generative AI project.
