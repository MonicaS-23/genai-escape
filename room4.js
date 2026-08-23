/**
 * ROOM 4 — THE CREATION CHAMBER
 * Concept: Types of Generative AI (text, image, audio, video, code)
 */

const ROOM_NUMBER = 4;
const CODE_FRAGMENT = "9";
const PASS_RATIO = 0.7; // 70% correct required

let currentModality = "text";

const QUIZ_ITEMS = [
  { desc: "A 400-word blog post written from a single sentence prompt.", answer: "text" },
  { desc: "A photorealistic picture of a cat astronaut generated from a description.", answer: "image" },
  { desc: "A synthesized voice reading a script in a chosen tone.", answer: "audio" },
  { desc: "A 5-second animated clip created from a storyboard description.", answer: "video" },
  { desc: "A Python function written to sort a list, generated from a plain-English request.", answer: "code" },
];

const MODALITY_LABELS = { text: "Text", image: "Image", audio: "Audio", video: "Video", code: "Code" };

document.addEventListener("DOMContentLoaded", () => {
  guardRoomAccess(ROOM_NUMBER);
  startTimer("hud-timer");

  const state = getGameState();
  renderQuiz();

  if (state.completedRooms.includes(ROOM_NUMBER)) {
    lockInCompletedState();
  }

  document.querySelectorAll('#modalityTabs .tab-btn').forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('#modalityTabs .tab-btn').forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentModality = btn.dataset.modality;
    });
  });

  document.getElementById("generateBtn").addEventListener("click", handleGenerate);
  document.getElementById("hintBtn").addEventListener("click", handleHint);
  document.getElementById("nextRoomBtn").addEventListener("click", () => {
    window.location.href = "room5.html";
  });
});

async function handleGenerate() {
  const topic = document.getElementById("chamberTopic").value.trim() || "Generative AI";
  const output = document.getElementById("chamberOutput");
  const btn = document.getElementById("generateBtn");

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Generating...';

  if (currentModality === "text") {
    const result = await callApi("/api/generate", { mode: "explain", topic, style: "simple" });
    output.textContent = result.success ? result.response : "🤖 " + (result.error || "AI assistant temporarily unavailable.");
  } else if (currentModality === "code") {
    const result = await callApi("/api/generate", { mode: "code", topic });
    output.textContent = result.success ? result.response : "🤖 " + (result.error || "AI assistant temporarily unavailable.");
  } else if (currentModality === "image") {
    output.innerHTML = renderWorkflow(topic, [
      "Encode prompt into text embeddings",
      "Diffusion model denoises random noise",
      "Guided by prompt at each step",
      "Final image rendered"
    ], `A text-to-image model would interpret "${topic}" and generate an original image — no camera involved, purely synthesized from learned visual patterns.`);
  } else if (currentModality === "audio") {
    output.innerHTML = renderWorkflow(topic, [
      "Parse text / style prompt",
      "Predict acoustic features",
      "Vocoder synthesizes waveform",
      "Audio output produced"
    ], `A text-to-audio model would turn "${topic}" into narration, sound effects, or music, synthesizing a waveform sample by sample.`);
  } else if (currentModality === "video") {
    output.innerHTML = renderWorkflow(topic, [
      "Parse scene / storyboard prompt",
      "Generate keyframes",
      "Interpolate motion between frames",
      "Render final clip"
    ], `A text-to-video model would turn "${topic}" into a short generated clip by predicting a coherent sequence of frames over time.`);
  }

  btn.disabled = false;
  btn.textContent = "⚡ GENERATE";
}

function renderWorkflow(topic, steps, description) {
  const stepsHtml = steps.map((s, i) => `<div class="workflow-step">${s}</div>${i < steps.length - 1 ? '<span class="workflow-arrow">→</span>' : ""}`).join("");
  return `<p>${description}</p><div class="workflow-steps">${stepsHtml}</div>`;
}

function renderQuiz() {
  const container = document.getElementById("modalityQuiz");
  container.innerHTML = "";
  QUIZ_ITEMS.forEach((item, idx) => {
    const wrap = document.createElement("div");
    wrap.style.marginBottom = "18px";
    wrap.innerHTML = `
      <p style="font-size:0.9rem; color:var(--gray); margin-bottom:8px;"><strong>${idx + 1}.</strong> ${item.desc}</p>
      <div class="modality-guess-grid" data-idx="${idx}">
        ${Object.keys(MODALITY_LABELS).map((key) => `<button class="option-btn" data-answer="${key}">${MODALITY_LABELS[key]}</button>`).join("")}
      </div>
    `;
    container.appendChild(wrap);
  });

  container.querySelectorAll(".modality-guess-grid").forEach((grid) => {
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".option-btn");
      if (!btn || btn.disabled) return;
      const idx = Number(grid.dataset.idx);
      handleQuizAnswer(grid, btn, idx);
    });
  });
}

let quizScore = 0;
let quizAnswered = 0;

function handleQuizAnswer(grid, btn, idx) {
  const correct = QUIZ_ITEMS[idx].answer;
  const chosen = btn.dataset.answer;
  const allBtns = grid.querySelectorAll(".option-btn");

  allBtns.forEach((b) => (b.disabled = true));

  if (chosen === correct) {
    SFX.correct();
    btn.classList.add("correct");
    quizScore++;
  } else {
    SFX.wrong();
    btn.classList.add("wrong");
    allBtns.forEach((b) => {
      if (b.dataset.answer === correct) b.classList.add("correct");
    });
  }

  quizAnswered++;
  checkQuizCompletion();
}

function checkQuizCompletion() {
  const feedback = document.getElementById("feedbackBox");
  if (quizAnswered < QUIZ_ITEMS.length) {
    feedback.textContent = `Progress: ${quizAnswered}/${QUIZ_ITEMS.length} identified — ${quizScore} correct so far.`;
    feedback.className = "feedback-box info show";
    return;
  }

  const ratio = quizScore / QUIZ_ITEMS.length;
  if (ratio >= PASS_RATIO) {
    feedback.textContent = `✅ Chamber cleared! You correctly identified ${quizScore}/${QUIZ_ITEMS.length} modalities.`;
    feedback.className = "feedback-box success show";

    addScore(150);
    completeRoom(ROOM_NUMBER, CODE_FRAGMENT);

    setTimeout(() => {
      document.getElementById("fragmentReveal").classList.add("show");
      flashUnlock();
      SFX.unlock();
    }, 400);

    document.getElementById("nextRoomBtn").disabled = false;
  } else {
    feedback.textContent = `❌ You got ${quizScore}/${QUIZ_ITEMS.length}. You need at least 70% correct. Refresh the room to retry.`;
    feedback.className = "feedback-box error show";
  }
}

function lockInCompletedState() {
  document.getElementById("fragmentReveal").classList.add("show");
  document.getElementById("nextRoomBtn").disabled = false;
}

async function handleHint() {
  const hintBtn = document.getElementById("hintBtn");
  const hintText = document.getElementById("hintText");

  hintBtn.disabled = true;
  hintBtn.innerHTML = '<span class="spinner"></span> Thinking...';

  const result = await callApi("/api/hint", {
    roomTitle: "Room 4: The Creation Chamber",
    concept: "Modalities of Generative AI: text, image, audio, video, code",
    question: "Identify which modality each generated output description belongs to.",
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
