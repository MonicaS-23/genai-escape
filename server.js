/**
 * GENAI ESCAPE - Backend Server
 * -------------------------------------------------------
 * Express server that serves the static frontend and proxies
 * all Generative AI requests to the Google Gemini API.
 *
 * IMPORTANT: The Gemini API key lives ONLY on the server side,
 * loaded from the .env file. It is never sent to the browser.
 * -------------------------------------------------------
 */

require("dotenv").config();

const express = require("express");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------
// Gemini setup
// ---------------------------------------------------------
const API_KEY = process.env.GEMINI_API_KEY;
const isKeyConfigured = Boolean(API_KEY && API_KEY !== "YOUR_API_KEY_HERE");

let genAI = null;
if (isKeyConfigured) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

const MODEL_NAME = "gemini-1.5-flash";

function getModel(systemInstruction) {
  if (!genAI) return null;
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction,
  });
}

/**
 * Wraps a Gemini call with consistent error handling so the
 * rest of the game never crashes if the AI is unavailable.
 */
async function safeGenerate(systemInstruction, userPrompt) {
  if (!isKeyConfigured) {
    return {
      success: false,
      error: "AI assistant temporarily unavailable.",
      reason: "missing_api_key",
    };
  }

  try {
    const model = getModel(systemInstruction);
    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const text = response.text();
    return { success: true, response: text };
  } catch (err) {
    console.error("Gemini API error:", err.message || err);
    return {
      success: false,
      error: "AI assistant temporarily unavailable.",
      reason: "gemini_error",
    };
  }
}

function extractJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

// ---------------------------------------------------------
// POST /api/hint
// Body: { roomTitle, concept, question, context }
// ---------------------------------------------------------
app.post("/api/hint", async (req, res) => {
  const { roomTitle, concept, question, context } = req.body || {};

  if (!question && !concept) {
    return res.status(400).json({ success: false, error: "Missing puzzle context." });
  }

  const systemInstruction =
    "You are an educational AI assistant inside a Generative AI escape-room game called GENAI ESCAPE. " +
    "Give helpful, encouraging hints that guide the player's reasoning WITHOUT directly revealing the correct answer or option letter. " +
    "Keep hints to 2-3 short sentences. Never state the final answer explicitly.";

  const userPrompt =
    `Room: ${roomTitle || "Unknown"}\n` +
    `Concept being tested: ${concept || "Generative AI"}\n` +
    `Puzzle/question: ${question || ""}\n` +
    `Extra context: ${context || "none"}\n\n` +
    "Give a short hint (max 3 sentences) that helps the player reason toward the answer without revealing it.";

  const result = await safeGenerate(systemInstruction, userPrompt);
  if (!result.success) return res.status(200).json(result);
  res.json({ success: true, response: result.response.trim() });
});

// ---------------------------------------------------------
// POST /api/generate
// Body: { mode, topic, style }
// mode: "text" | "code" | "explain" | "custom"
// ---------------------------------------------------------
app.post("/api/generate", async (req, res) => {
  const { mode, topic, style } = req.body || {};

  if (!topic) {
    return res.status(400).json({ success: false, error: "Please provide a topic." });
  }

  let systemInstruction =
    "You are a helpful, accurate Generative AI assistant embedded inside an educational escape-room game about Generative AI. " +
    "Keep responses well-formatted, concise, and beginner-friendly unless told otherwise.";
  let userPrompt = topic;

  if (mode === "code") {
    systemInstruction +=
      " When asked for code, produce a short, correct, well-commented code snippet (under 25 lines) in an appropriate language.";
    userPrompt = `Write a small code example related to: ${topic}`;
  } else if (mode === "explain") {
    const styleMap = {
      simple: "Explain it simply, as if to a beginner, in 3-4 sentences.",
      detailed: "Give a detailed, structured explanation with headings.",
      examples: "Give 3 concrete real-world examples with 1-2 sentences each.",
      quiz: "Create 3 short quiz questions (with answers hidden below a 'Answers:' section) about this topic.",
      interview: "Act as an interviewer and ask the user 3 thoughtful questions about this topic to test their understanding.",
    };
    userPrompt = `Topic: ${topic}\n\nInstruction: ${styleMap[style] || styleMap.simple}`;
  } else if (mode === "custom") {
    userPrompt = topic;
  }

  const result = await safeGenerate(systemInstruction, userPrompt);
  if (!result.success) return res.status(200).json(result);
  res.json({ success: true, response: result.response.trim() });
});

// ---------------------------------------------------------
// POST /api/evaluate-prompt
// Body: { prompt, task }
// Used by Room 2 (prompt builder) and the Final Challenge.
// ---------------------------------------------------------
app.post("/api/evaluate-prompt", async (req, res) => {
  const { prompt, task } = req.body || {};

  if (!prompt || prompt.trim().length < 5) {
    return res.status(400).json({ success: false, error: "Prompt is too short to evaluate." });
  }

  const systemInstruction =
    "You are a strict but fair prompt-engineering evaluator inside an educational game. " +
    "Evaluate the user's prompt against these criteria: role, context, task clarity, specificity, constraints, output format, and overall clarity. " +
    "Respond ONLY with valid JSON, no markdown fences, no preamble, no extra text. " +
    'The JSON schema must be exactly: {"score": <integer 0-100>, "strengths": ["..."], "improvements": ["..."], "summary": "..."}. ' +
    "strengths and improvements should each contain 2-4 short bullet strings. summary should be 1-2 sentences.";

  const userPrompt =
    `Task the prompt should accomplish: ${task || "Explain Generative AI to a beginner."}\n\n` +
    `Player's prompt to evaluate:\n"""${prompt}"""\n\n` +
    "Score this prompt and return the JSON object described in your instructions.";

  const result = await safeGenerate(systemInstruction, userPrompt);
  if (!result.success) return res.status(200).json(result);

  const parsed = extractJson(result.response);
  if (!parsed || typeof parsed.score !== "number") {
    return res.status(200).json({
      success: false,
      error: "AI assistant temporarily unavailable.",
      reason: "parse_error",
    });
  }

  parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));
  res.json({ success: true, ...parsed });
});

// ---------------------------------------------------------
// POST /api/generate-quiz
// Body: { topic }
// Returns 5 MCQs as JSON.
// ---------------------------------------------------------
app.post("/api/generate-quiz", async (req, res) => {
  const { topic } = req.body || {};

  if (!topic) {
    return res.status(400).json({ success: false, error: "Please provide a topic for the quiz." });
  }

  const systemInstruction =
    "You are a quiz-generation AI for an educational Generative AI game. " +
    "Respond ONLY with valid JSON, no markdown fences, no preamble. " +
    'Schema: {"questions": [{"question": "...", "options": ["A text","B text","C text","D text"], "correctIndex": 0, "explanation": "..."}]}. ' +
    "Generate exactly 5 multiple-choice questions with 4 options each. correctIndex is 0-based.";

  const userPrompt = `Generate a 5-question multiple choice quiz about: ${topic}`;

  const result = await safeGenerate(systemInstruction, userPrompt);
  if (!result.success) return res.status(200).json(result);

  const parsed = extractJson(result.response);
  if (!parsed || !Array.isArray(parsed.questions)) {
    return res.status(200).json({
      success: false,
      error: "AI assistant temporarily unavailable.",
      reason: "parse_error",
    });
  }

  res.json({ success: true, questions: parsed.questions });
});

// ---------------------------------------------------------
// POST /api/check-answer
// Generic helper endpoint - lets the frontend verify a free-text
// answer with AI assistance (used sparingly; most puzzles are
// evaluated client-side so the game never fully depends on AI).
// ---------------------------------------------------------
app.post("/api/check-answer", async (req, res) => {
  const { question, correctAnswer, userAnswer } = req.body || {};

  if (!question || !userAnswer) {
    return res.status(400).json({ success: false, error: "Missing question or answer." });
  }

  const systemInstruction =
    "You are an answer-checking AI for an educational game. Judge whether the user's answer is conceptually correct. " +
    'Respond ONLY with valid JSON: {"correct": true|false, "feedback": "one short sentence"}.';

  const userPrompt =
    `Question: ${question}\nExpected concept: ${correctAnswer || "N/A"}\nUser answer: ${userAnswer}`;

  const result = await safeGenerate(systemInstruction, userPrompt);
  if (!result.success) return res.status(200).json(result);

  const parsed = extractJson(result.response);
  if (!parsed) {
    return res.status(200).json({
      success: false,
      error: "AI assistant temporarily unavailable.",
      reason: "parse_error",
    });
  }

  res.json({ success: true, ...parsed });
});

// ---------------------------------------------------------
// Health check
// ---------------------------------------------------------
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    aiConfigured: isKeyConfigured,
    message: isKeyConfigured
      ? "Gemini API is configured."
      : "Gemini API key not configured. AI features will be unavailable, but the game will still work.",
  });
});

// Fallback to index for any unknown non-API route (simple SPA-ish safety net)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`\n🧪 GENAI ESCAPE server running at http://localhost:${PORT}`);
  if (!isKeyConfigured) {
    console.log("⚠️  GEMINI_API_KEY not set. AI features (hints, evaluation, generation) will return a graceful fallback message.");
    console.log("   Add your key to the .env file to enable them.\n");
  } else {
    console.log("✅ Gemini API key detected. AI features enabled.\n");
  }
});
