/**
 * GENAI ESCAPE — Core Game Engine
 * Shared across every page. Handles localStorage game state,
 * the HUD, sound effects, and small UI helpers.
 * No database is used anywhere — everything lives in localStorage.
 */

const GAME_KEY = "genaiEscapeState";
const SOUND_KEY = "genaiEscapeSound";

const DEFAULT_STATE = {
  score: 0,
  currentRoom: 1,
  completedRooms: [],
  hintsUsed: 0,
  codeFragments: [],
  startTime: null,
  completed: false,
  finalPromptScore: null,
};

/* ------------------------------------------------------------
   Core state helpers
------------------------------------------------------------ */
function getGameState() {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch (e) {
    return { ...DEFAULT_STATE };
  }
}

function saveGame(state) {
  localStorage.setItem(GAME_KEY, JSON.stringify(state));
  updateGameUI();
}

function resetGame() {
  localStorage.removeItem(GAME_KEY);
}

function startNewGame() {
  const state = { ...DEFAULT_STATE, startTime: Date.now() };
  saveGame(state);
  return state;
}

function addScore(points) {
  const state = getGameState();
  state.score = Math.max(0, state.score + points);
  saveGame(state);
  return state;
}

function completeRoom(roomNumber, codeFragment) {
  const state = getGameState();
  if (!state.completedRooms.includes(roomNumber)) {
    state.completedRooms.push(roomNumber);
  }
  const existingIndex = state.codeFragments.findIndex((f) => f.room === roomNumber);
  const fragmentEntry = { room: roomNumber, value: String(codeFragment) };
  if (existingIndex >= 0) {
    state.codeFragments[existingIndex] = fragmentEntry;
  } else {
    state.codeFragments.push(fragmentEntry);
  }
  state.currentRoom = Math.max(state.currentRoom, roomNumber + 1);
  saveGame(state);
  return state;
}

function useHint() {
  const state = getGameState();
  state.hintsUsed += 1;
  state.score = Math.max(0, state.score - 5);
  saveGame(state);
  return state;
}

function getElapsedTime() {
  const state = getGameState();
  if (!state.startTime) return 0;
  return Math.floor((Date.now() - state.startTime) / 1000);
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

let __timerInterval = null;
function startTimer(elementId) {
  if (__timerInterval) clearInterval(__timerInterval);
  const el = document.getElementById(elementId);
  if (!el) return;
  const tick = () => {
    el.textContent = formatTime(getElapsedTime());
  };
  tick();
  __timerInterval = setInterval(tick, 1000);
}

/* ------------------------------------------------------------
   Room access guard — redirect if trying to skip ahead
------------------------------------------------------------ */
function guardRoomAccess(roomNumber) {
  const state = getGameState();
  if (!state.startTime) {
    window.location.href = "story.html";
    return null;
  }
  if (roomNumber > 1 && !state.completedRooms.includes(roomNumber - 1) && state.currentRoom < roomNumber) {
    window.location.href = `room${state.currentRoom}.html`;
    return null;
  }
  return state;
}

/* ------------------------------------------------------------
   HUD (top bar shown on every room page)
------------------------------------------------------------ */
function updateGameUI() {
  const state = getGameState();
  const scoreEl = document.getElementById("hud-score");
  const roomsEl = document.getElementById("hud-rooms");
  const barEl = document.getElementById("hud-progress-bar");

  if (scoreEl) scoreEl.textContent = state.score;
  if (roomsEl) roomsEl.textContent = `${state.completedRooms.length}/5`;
  if (barEl) barEl.style.width = `${(state.completedRooms.length / 5) * 100}%`;
}

/* ------------------------------------------------------------
   Sound effects (simple WebAudio beeps — no external files needed)
------------------------------------------------------------ */
function isSoundOn() {
  const v = localStorage.getItem(SOUND_KEY);
  return v === null ? true : v === "true";
}

function setSoundOn(on) {
  localStorage.setItem(SOUND_KEY, String(on));
}

let __audioCtx = null;
function playTone(freq, duration, type = "sine", vol = 0.08) {
  if (!isSoundOn()) return;
  try {
    if (!__audioCtx) __audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = __audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    /* silently ignore audio errors */
  }
}

const SFX = {
  click: () => playTone(440, 0.08, "sine", 0.05),
  correct: () => { playTone(523, 0.12); setTimeout(() => playTone(784, 0.18), 100); },
  wrong: () => playTone(160, 0.25, "sawtooth", 0.07),
  unlock: () => { playTone(392, 0.1); setTimeout(() => playTone(523, 0.1), 90); setTimeout(() => playTone(659, 0.22), 180); },
  escape: () => { [392, 523, 659, 880].forEach((f, i) => setTimeout(() => playTone(f, 0.25), i * 130)); },
};

function initSoundToggle(buttonId) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  const render = () => { btn.textContent = isSoundOn() ? "🔊" : "🔇"; };
  render();
  btn.addEventListener("click", () => {
    setSoundOn(!isSoundOn());
    render();
    if (isSoundOn()) SFX.click();
  });
}

/* ------------------------------------------------------------
   Mobile nav toggle
------------------------------------------------------------ */
function initNavToggle() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => links.classList.toggle("open"));
}

/* ------------------------------------------------------------
   Background particles (used on home + story pages)
------------------------------------------------------------ */
function spawnParticles(containerId, count = 22) {
  const container = document.getElementById(containerId);
  if (!container) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = 2 + Math.random() * 4;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDuration = `${6 + Math.random() * 8}s`;
    p.style.animationDelay = `${Math.random() * 4}s`;
    container.appendChild(p);
  }
}

function spawnNodes(containerId, count = 6) {
  const container = document.getElementById(containerId);
  if (!container) return;
  for (let i = 0; i < count; i++) {
    const n = document.createElement("div");
    n.className = "node";
    n.style.left = `${10 + Math.random() * 70}%`;
    n.style.top = `${10 + Math.random() * 70}%`;
    n.style.animationDelay = `${Math.random() * 3}s`;
    container.appendChild(n);
  }
}

/* ------------------------------------------------------------
   Confetti (final escape celebration)
------------------------------------------------------------ */
function launchConfetti() {
  const colors = ["#8b5cf6", "#22d3ee", "#3b82f6", "#ec4899", "#34d399", "#fbbf24"];
  for (let i = 0; i < 90; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 5500);
  }
}

function flashUnlock() {
  const flash = document.createElement("div");
  flash.className = "unlock-flash";
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 1500);
}

/* ------------------------------------------------------------
   Small helper: shake an element (wrong answer feedback)
------------------------------------------------------------ */
function shakeElement(el) {
  if (!el) return;
  el.classList.remove("shake-anim");
  void el.offsetWidth;
  el.classList.add("shake-anim");
}

/* ------------------------------------------------------------
   Generic API caller with graceful fallback
------------------------------------------------------------ */
async function callApi(endpoint, body) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json();
    return data;
  } catch (e) {
    return { success: false, error: "AI assistant temporarily unavailable." };
  }
}

/* ------------------------------------------------------------
   Init on every page load
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  updateGameUI();
  initSoundToggle("soundToggle");
  initNavToggle();
});
