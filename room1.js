/**
 * ROOM 1 — THE ORIGIN
 * Concept: What is Generative AI?
 */

const ROOM_NUMBER = 1;
const CORRECT_ANSWER = "C";
const CODE_FRAGMENT = "7";

const explanations = {
  A: "Detecting spam is classification — it analyzes existing data, it doesn't generate anything new.",
  B: "Weather prediction analyzes patterns to forecast — it's predictive AI, not generative.",
  D: "Calculating a percentage is a deterministic computation, not content generation.",
};

let answered = false;

document.addEventListener("DOMContentLoaded", () => {
  guardRoomAccess(ROOM_NUMBER);
  startTimer("hud-timer");

  const state = getGameState();
  if (state.completedRooms.includes(ROOM_NUMBER)) {
    lockInCompletedState();
  }

  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleAnswer(btn));
  });

  document.getElementById("hintBtn").addEventListener("click", handleHint);
  document.getElementById("nextRoomBtn").addEventListener("click", () => {
    window.location.href = "room2.html";
  });
});

function lockInCompletedState() {
  answered = true;
  document.querySelectorAll(".option-btn").forEach((b) => {
    b.disabled = true;
    if (b.dataset.value === CORRECT_ANSWER) b.classList.add("correct");
  });
  document.getElementById("fragmentReveal").classList.add("show");
  document.getElementById("nextRoomBtn").disabled = false;
}

function handleAnswer(btn) {
  if (answered) return;
  const value = btn.dataset.value;
  const feedback = document.getElementById("feedbackBox");

  if (value === CORRECT_ANSWER) {
    answered = true;
    SFX.correct();
    btn.classList.add("correct", "success-anim");
    document.querySelectorAll(".option-btn").forEach((b) => (b.disabled = true));

    feedback.textContent = "✅ Correct! Creating new content from a description is the essence of Generative AI.";
    feedback.className = "feedback-box success show";

    addScore(100);
    const state = completeRoom(ROOM_NUMBER, CODE_FRAGMENT);

    setTimeout(() => {
      const reveal = document.getElementById("fragmentReveal");
      reveal.classList.add("show");
      flashUnlock();
      SFX.unlock();
    }, 500);

    document.getElementById("nextRoomBtn").disabled = false;
  } else {
    SFX.wrong();
    btn.classList.add("wrong");
    shakeElement(btn);
    feedback.textContent = `❌ Not quite. ${explanations[value] || "Try again."}`;
    feedback.className = "feedback-box error show";
    setTimeout(() => btn.classList.remove("wrong"), 900);
  }
}

async function handleHint() {
  const hintBtn = document.getElementById("hintBtn");
  const hintText = document.getElementById("hintText");

  hintBtn.disabled = true;
  hintBtn.innerHTML = '<span class="spinner"></span> Thinking...';

  const result = await callApi("/api/hint", {
    roomTitle: "Room 1: The Origin",
    concept: "Generative AI vs traditional AI",
    question: "Which of the following is the BEST example of Generative AI? A) Detecting spam B) Predicting temperature C) Creating an image from text D) Calculating attendance",
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
