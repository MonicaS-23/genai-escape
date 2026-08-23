/**
 * FINAL CHALLENGE — MASTER PROMPT
 * Verifies the 5-digit escape code, then runs the master prompt
 * evaluation through Gemini. Score >= 75 = ESCAPE SUCCESSFUL.
 */

const SECRET_CODE = "73295";
const MASTER_TASK =
  "Explain Generative AI to a beginner using simple language, three real-world examples, one limitation, one ethical concern, and a short summary.";
const MASTER_PASS_SCORE = 75;

document.addEventListener("DOMContentLoaded", () => {
  const state = getGameState();

  if (!state.startTime || state.completedRooms.length < 5) {
    window.location.href = state.startTime ? `room${state.currentRoom}.html` : "story.html";
    return;
  }

  startTimer("hud-timer");
  renderFragments(state);

  if (state.completed) {
    unlockCodeStage(true);
    showPromptStage(true);
  }

  document.getElementById("submitCodeBtn").addEventListener("click", checkCode);
  document.getElementById("evaluateMasterBtn").addEventListener("click", evaluateMasterPrompt);

  const digitInputs = document.querySelectorAll(".code-digit");
  digitInputs.forEach((input, idx) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^0-9]/g, "");
      if (input.value && idx < digitInputs.length - 1) digitInputs[idx + 1].focus();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && idx > 0) digitInputs[idx - 1].focus();
    });
  });
});

function renderFragments(state) {
  const row = document.getElementById("fragmentsRow");
  row.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const frag = state.codeFragments.find((f) => f.room === i);
    const chip = document.createElement("div");
    chip.className = "fragment-chip";
    chip.innerHTML = `${frag ? frag.value : "?"}<span>ROOM ${i}</span>`;
    row.appendChild(chip);
  }
}

function checkCode() {
  const digits = Array.from(document.querySelectorAll(".code-digit")).map((i) => i.value).join("");
  const feedback = document.getElementById("codeFeedback");

  if (digits.length < 5) {
    feedback.textContent = "⚠️ Enter all 5 digits.";
    feedback.className = "feedback-box error show";
    return;
  }

  if (digits === SECRET_CODE) {
    SFX.unlock();
    feedback.textContent = "✅ ACCESS GRANTED — Master Prompt Challenge unlocked.";
    feedback.className = "feedback-box success show";
    unlockCodeStage(false);
    showPromptStage(false);
  } else {
    SFX.wrong();
    feedback.textContent = "❌ ACCESS DENIED — Incorrect code. Check your fragments and try again.";
    feedback.className = "feedback-box error show";
  }
}

function unlockCodeStage(instant) {
  document.querySelectorAll(".code-digit").forEach((el) => (el.disabled = true));
  document.getElementById("submitCodeBtn").disabled = true;
  document.getElementById("submitCodeBtn").textContent = "✔ UNLOCKED";
}

function showPromptStage(instant) {
  const stage = document.getElementById("promptStage");
  stage.style.display = "block";
  if (!instant) {
    stage.classList.add("slide-up");
    flashUnlock();
  }
}

async function evaluateMasterPrompt() {
  const prompt = document.getElementById("masterPromptInput").value.trim();
  const feedback = document.getElementById("masterFeedback");
  const btn = document.getElementById("evaluateMasterBtn");

  if (prompt.split(" ").length < 10) {
    feedback.textContent = "⚠️ Your prompt is too short. Include role, examples, limitation, ethics, and summary instructions.";
    feedback.className = "feedback-box error show";
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Evaluating with Gemini...';

  const result = await callApi("/api/evaluate-prompt", { prompt, task: MASTER_TASK });

  btn.disabled = false;
  btn.textContent = "⚡ SUBMIT TO GEMINI";

  if (!result.success) {
    feedback.innerHTML = `🤖 ${result.error || "AI assistant temporarily unavailable."} <br/><span style="font-size:0.8rem; color:var(--gray-dim);">Try again once the AI service is back online.</span>`;
    feedback.className = "feedback-box info show";
    return;
  }

  const score = result.score;
  let html = `<div class="score-badge ${score >= MASTER_PASS_SCORE ? "high" : "low"}">AI Evaluation Score: ${score}/100</div>`;
  html += `<p style="margin-top:12px;">${result.summary || ""}</p>`;
  if (result.strengths && result.strengths.length) {
    html += `<p style="margin-top:12px; font-weight:700; color:var(--green);">Strengths</p><ul class="eval-list">${result.strengths.map((s) => `<li>${s}</li>`).join("")}</ul>`;
  }
  if (result.improvements && result.improvements.length) {
    html += `<p style="margin-top:12px; font-weight:700; color:var(--yellow);">Improve</p><ul class="eval-list">${result.improvements.map((s) => `<li>${s}</li>`).join("")}</ul>`;
  }

  feedback.innerHTML = html;

  if (score >= MASTER_PASS_SCORE) {
    feedback.className = "feedback-box success show";
    SFX.escape();

    const state = getGameState();
    state.completed = true;
    state.finalPromptScore = score;
    saveGame(state);

    launchConfetti();

    setTimeout(() => {
      document.getElementById("viewResultBtn").style.display = "inline-flex";
      document.getElementById("viewResultBtn").classList.add("pulse-glow");
    }, 300);
  } else {
    feedback.className = "feedback-box error show";
  }
}
