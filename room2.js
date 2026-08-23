/**
 * ROOM 2 — THE PROMPT
 * Concept: Prompt Engineering
 * The player builds a structured prompt; Gemini evaluates it.
 */

const ROOM_NUMBER = 2;
const CODE_FRAGMENT = "3";
const PASS_SCORE = 70;
const TASK_DESCRIPTION =
  "Explain Generative AI to a 15-year-old student in simple language using 3 examples.";

const fields = ["pbRole", "pbContext", "pbTask", "pbConstraint", "pbFormat"];

document.addEventListener("DOMContentLoaded", () => {
  guardRoomAccess(ROOM_NUMBER);
  startTimer("hud-timer");

  const state = getGameState();
  if (state.completedRooms.includes(ROOM_NUMBER)) {
    lockInCompletedState();
  }

  fields.forEach((id) => {
    document.getElementById(id).addEventListener("input", updatePreview);
  });
  updatePreview();

  document.getElementById("evaluateBtn").addEventListener("click", evaluatePrompt);
  document.getElementById("hintBtn").addEventListener("click", handleHint);
  document.getElementById("nextRoomBtn").addEventListener("click", () => {
    window.location.href = "room3.html";
  });
});

function lockInCompletedState() {
  document.getElementById("fragmentReveal").classList.add("show");
  document.getElementById("nextRoomBtn").disabled = false;
}

function buildPrompt() {
  const role = document.getElementById("pbRole").value.trim();
  const context = document.getElementById("pbContext").value.trim();
  const task = document.getElementById("pbTask").value.trim();
  const constraint = document.getElementById("pbConstraint").value.trim();
  const format = document.getElementById("pbFormat").value.trim();

  const parts = [];
  if (role) parts.push(role + ".");
  if (context) parts.push("Context: " + context + ".");
  if (task) parts.push("Task: " + task + ".");
  if (constraint) parts.push("Constraints: " + constraint + ".");
  if (format) parts.push("Output format: " + format + ".");

  return parts.join(" ");
}

function updatePreview() {
  const preview = document.getElementById("promptPreview");
  const prompt = buildPrompt();
  if (!prompt) {
    preview.innerHTML = '<span class="ph">Your assembled prompt will appear here as you type...</span>';
  } else {
    preview.textContent = prompt;
  }
}

async function evaluatePrompt() {
  const prompt = buildPrompt();
  const feedback = document.getElementById("feedbackBox");
  const btn = document.getElementById("evaluateBtn");

  if (prompt.split(" ").length < 8) {
    feedback.textContent = "⚠️ Fill in more fields before evaluating — your prompt is too short.";
    feedback.className = "feedback-box error show";
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Evaluating with Gemini...';

  const result = await callApi("/api/evaluate-prompt", { prompt, task: TASK_DESCRIPTION });

  btn.disabled = false;
  btn.textContent = "⚡ EVALUATE PROMPT WITH AI";

  if (!result.success) {
    feedback.innerHTML = `🤖 ${result.error || "AI assistant temporarily unavailable."} <br/><span style="font-size:0.8rem; color:var(--gray-dim);">Tip: make sure your prompt includes a role, clear task, constraints, and output format, then try again once the AI service is back.</span>`;
    feedback.className = "feedback-box info show";
    return;
  }

  const score = result.score;
  const strengths = result.strengths || [];
  const improvements = result.improvements || [];

  let html = `<div class="score-badge ${score >= PASS_SCORE ? "high" : "low"}">Score: ${score}/100</div>`;
  html += `<p style="margin-top:12px;">${result.summary || ""}</p>`;
  if (strengths.length) {
    html += `<p style="margin-top:12px; font-weight:700; color:var(--green);">Strengths</p><ul class="eval-list">${strengths.map((s) => `<li>${s}</li>`).join("")}</ul>`;
  }
  if (improvements.length) {
    html += `<p style="margin-top:12px; font-weight:700; color:var(--yellow);">Improve</p><ul class="eval-list">${improvements.map((s) => `<li>${s}</li>`).join("")}</ul>`;
  }

  feedback.innerHTML = html;
  feedback.className = `feedback-box ${score >= PASS_SCORE ? "success" : "error"} show`;

  if (score >= PASS_SCORE) {
    SFX.correct();
    addScore(150);
    completeRoom(ROOM_NUMBER, CODE_FRAGMENT);
    setTimeout(() => {
      document.getElementById("fragmentReveal").classList.add("show");
      flashUnlock();
      SFX.unlock();
    }, 400);
    document.getElementById("nextRoomBtn").disabled = false;
  } else {
    SFX.wrong();
  }
}

async function handleHint() {
  const hintBtn = document.getElementById("hintBtn");
  const hintText = document.getElementById("hintText");

  hintBtn.disabled = true;
  hintBtn.innerHTML = '<span class="spinner"></span> Thinking...';

  const result = await callApi("/api/hint", {
    roomTitle: "Room 2: The Prompt",
    concept: "Prompt engineering: role, context, task, constraints, output format",
    question: `Build a prompt for: ${TASK_DESCRIPTION}`,
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
