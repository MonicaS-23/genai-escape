/**
 * ROOM 3 — THE MODEL VAULT
 * Concept: Popular Generative AI models & categories
 * A click-to-match puzzle. Pairs are fully configurable below.
 */

const ROOM_NUMBER = 3;
const CODE_FRAGMENT = "2";

// Configurable answer pairs: id -> { model, category }
const PAIRS = [
  { id: "gpt", model: "GPT", category: "AI Assistant / Conversational Reasoning" },
  { id: "gemini", model: "Gemini", category: "Multimodal AI (text, image, audio)" },
  { id: "claude", model: "Claude", category: "AI Assistant" },
  { id: "llama", model: "Llama", category: "Open-weight / Open-access Model" },
  { id: "dalle", model: "DALL-E", category: "Image Generation" },
];

let selectedModel = null;
let matchedCount = 0;
let wrongAttempts = 0;

document.addEventListener("DOMContentLoaded", () => {
  guardRoomAccess(ROOM_NUMBER);
  startTimer("hud-timer");

  const state = getGameState();
  renderPuzzle();

  if (state.completedRooms.includes(ROOM_NUMBER)) {
    lockInCompletedState();
  }

  document.getElementById("hintBtn").addEventListener("click", handleHint);
  document.getElementById("nextRoomBtn").addEventListener("click", () => {
    window.location.href = "room4.html";
  });
});

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderPuzzle() {
  const modelsCol = document.getElementById("matchModels");
  const catsCol = document.getElementById("matchCategories");

  const shuffledModels = shuffle(PAIRS);
  const shuffledCats = shuffle(PAIRS);

  modelsCol.innerHTML = "";
  shuffledModels.forEach((p) => {
    const div = document.createElement("div");
    div.className = "match-item";
    div.dataset.id = p.id;
    div.dataset.type = "model";
    div.textContent = p.model;
    modelsCol.appendChild(div);
  });

  catsCol.innerHTML = "";
  shuffledCats.forEach((p) => {
    const div = document.createElement("div");
    div.className = "match-item";
    div.dataset.id = p.id;
    div.dataset.type = "category";
    div.textContent = p.category;
    catsCol.appendChild(div);
  });

  document.querySelectorAll(".match-item").forEach((item) => {
    item.addEventListener("click", () => handleMatchClick(item));
  });
}

function handleMatchClick(item) {
  if (item.classList.contains("matched")) return;

  if (item.dataset.type === "model") {
    document.querySelectorAll('.match-item[data-type="model"]').forEach((el) => el.classList.remove("selected"));
    item.classList.add("selected");
    selectedModel = item;
    return;
  }

  // category clicked
  if (!selectedModel) return;

  const feedback = document.getElementById("feedbackBox");

  if (selectedModel.dataset.id === item.dataset.id) {
    SFX.correct();
    selectedModel.classList.remove("selected");
    selectedModel.classList.add("matched");
    item.classList.add("matched");
    matchedCount++;
    selectedModel = null;

    feedback.textContent = `✅ Correct match! (${matchedCount}/${PAIRS.length})`;
    feedback.className = "feedback-box success show";

    if (matchedCount === PAIRS.length) {
      completeVault();
    }
  } else {
    SFX.wrong();
    wrongAttempts++;
    item.classList.add("wrong-flash");
    shakeElement(item);
    feedback.textContent = "❌ Not a match. Think about what each model specializes in.";
    feedback.className = "feedback-box error show";
    setTimeout(() => item.classList.remove("wrong-flash"), 700);
  }
}

function completeVault() {
  const feedback = document.getElementById("feedbackBox");
  feedback.textContent = "🎉 Vault unlocked! All models matched correctly.";
  feedback.className = "feedback-box success show";

  addScore(150);
  completeRoom(ROOM_NUMBER, CODE_FRAGMENT);

  setTimeout(() => {
    document.getElementById("fragmentReveal").classList.add("show");
    flashUnlock();
    SFX.unlock();
  }, 500);

  document.getElementById("nextRoomBtn").disabled = false;
}

function lockInCompletedState() {
  document.querySelectorAll(".match-item").forEach((el) => el.classList.add("matched"));
  document.getElementById("fragmentReveal").classList.add("show");
  document.getElementById("nextRoomBtn").disabled = false;
}

async function handleHint() {
  const hintBtn = document.getElementById("hintBtn");
  const hintText = document.getElementById("hintText");

  hintBtn.disabled = true;
  hintBtn.innerHTML = '<span class="spinner"></span> Thinking...';

  const result = await callApi("/api/hint", {
    roomTitle: "Room 3: The Model Vault",
    concept: "Popular Generative AI models: GPT, Gemini, Claude, Llama, DALL-E",
    question: "Match each model to its primary category (assistant, multimodal, open-weight, image generation).",
  });

  hintBtn.disabled = false;
  hintBtn.textContent = "GET AI HINT";

  if (result.success) {
    hintText.textContent = "💡 " + result.response;
    hintText.classList.add("show");
    useHint();
  } else {
    hintText.textContent = "🤖 " + (result.error || "AI assistant temporarily unavailable.");
    hintText.classList.add("show");
  }
}
