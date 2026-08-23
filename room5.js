/**
 * ROOM 5 — THE DARK SIDE
 * Concept: Responsible Generative AI (ethics, risk scenarios)
 */

const ROOM_NUMBER = 5;
const CODE_FRAGMENT = "5";
const PASS_RATIO = 0.7;

const SCENARIOS = [
  {
    tag: "Deepfakes",
    text: "You receive an AI-generated image that appears to show a celebrity doing something controversial.",
    question: "What should you do first?",
    options: [
      "Immediately share it",
      "Verify the source and authenticity",
      "Edit it and repost",
      "Assume it is real",
    ],
    correctIndex: 1,
    explanation: "Always verify before sharing — deepfakes and manipulated media spread fastest when unverified.",
  },
  {
    tag: "Hallucination",
    text: "An AI chatbot confidently cites a scientific study to support its answer, but the study doesn't actually exist.",
    question: "What is this an example of?",
    options: [
      "A software bug",
      "A hallucination — fabricated but confident output",
      "Intentional deception by the developers",
      "A network error",
    ],
    correctIndex: 1,
    explanation: "This is a classic hallucination: the model generates plausible-sounding but false information.",
  },
  {
    tag: "Bias",
    text: "An AI hiring tool consistently ranks resumes from one demographic group lower, even with similar qualifications.",
    question: "What is the most likely cause?",
    options: [
      "The AI is malfunctioning randomly",
      "Biased or unbalanced training data",
      "The resumes were poorly formatted",
      "The AI is intentionally cruel",
    ],
    correctIndex: 1,
    explanation: "Bias in outputs usually traces back to biased or unrepresentative training data.",
  },
  {
    tag: "Copyright",
    text: "You want to use an AI image generator to create art for a commercial product.",
    question: "What's the responsible first step?",
    options: [
      "Just publish it, AI art has no rules",
      "Check the tool's licensing terms and usage rights",
      "Claim you painted it yourself",
      "Ignore copyright since AI made it",
    ],
    correctIndex: 1,
    explanation: "Different tools have different licensing terms for commercial use — always check before publishing.",
  },
  {
    tag: "Privacy",
    text: "You're building a chatbot and want to fine-tune it on user conversation logs.",
    question: "What should you prioritize?",
    options: [
      "Use the data without telling users",
      "Anonymize data and get proper consent",
      "Sell the data to advertisers",
      "Store everything publicly for transparency",
    ],
    correctIndex: 1,
    explanation: "Responsible AI development requires consent and data protection, especially with personal conversations.",
  },
];

let currentIndex = 0;
let correctCount = 0;
let answeredCurrent = false;

document.addEventListener("DOMContentLoaded", () => {
  guardRoomAccess(ROOM_NUMBER);
  startTimer("hud-timer");

  const state = getGameState();
  if (state.completedRooms.includes(ROOM_NUMBER)) {
    lockInCompletedState();
    return;
  }

  renderProgress();
  renderScenario();

  document.getElementById("hintBtn").addEventListener("click", handleHint);
  document.getElementById("nextRoomBtn").addEventListener("click", () => {
    window.location.href = "final.html";
  });
});

function renderProgress() {
  const el = document.getElementById("scenarioProgress");
  el.innerHTML = SCENARIOS.map((_, i) => {
    let cls = "scenario-dot";
    if (i < currentIndex) cls += " done";
    else if (i === currentIndex) cls += " active";
    return `<div class="${cls}"></div>`;
  }).join("");
}

function renderScenario() {
  answeredCurrent = false;
  const scenario = SCENARIOS[currentIndex];
  const container = document.getElementById("scenarioContainer");

  container.innerHTML = `
    <div class="scenario-box glass-card">
      <span class="scenario-tag">${scenario.tag}</span>
      <p style="margin-bottom:14px;">${scenario.text}</p>
      <p style="font-weight:700; margin-bottom:14px;">${scenario.question}</p>
      <div class="options-list" id="scenarioOptions">
        ${scenario.options.map((opt, i) => `
          <button class="option-btn" data-idx="${i}">
            <span class="opt-letter">${String.fromCharCode(65 + i)}</span> ${opt}
          </button>`).join("")}
      </div>
    </div>
  `;

  document.querySelectorAll("#scenarioOptions .option-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleScenarioAnswer(btn, scenario));
  });

  document.getElementById("feedbackBox").classList.remove("show");
  document.getElementById("hintText").classList.remove("show");
}

function handleScenarioAnswer(btn, scenario) {
  if (answeredCurrent) return;
  answeredCurrent = true;

  const chosen = Number(btn.dataset.idx);
  const allBtns = document.querySelectorAll("#scenarioOptions .option-btn");
  allBtns.forEach((b) => (b.disabled = true));

  const feedback = document.getElementById("feedbackBox");

  if (chosen === scenario.correctIndex) {
    SFX.correct();
    btn.classList.add("correct");
    correctCount++;
    feedback.textContent = `✅ Correct! ${scenario.explanation}`;
    feedback.className = "feedback-box success show";
  } else {
    SFX.wrong();
    btn.classList.add("wrong");
    allBtns[scenario.correctIndex].classList.add("correct");
    shakeElement(btn);
    feedback.textContent = `❌ Not quite. ${scenario.explanation}`;
    feedback.className = "feedback-box error show";
  }

  setTimeout(() => {
    currentIndex++;
    if (currentIndex < SCENARIOS.length) {
      renderProgress();
      renderScenario();
    } else {
      finishRoom();
    }
  }, 1900);
}

function finishRoom() {
  renderProgress();
  const container = document.getElementById("scenarioContainer");
  const feedback = document.getElementById("feedbackBox");
  const ratio = correctCount / SCENARIOS.length;

  container.innerHTML = `
    <div class="scenario-box glass-card" style="text-align:center;">
      <h3>Scenario Set Complete</h3>
      <p style="color:var(--gray); margin-top:10px;">You answered ${correctCount}/${SCENARIOS.length} correctly.</p>
    </div>
  `;

  if (ratio >= PASS_RATIO) {
    feedback.textContent = "✅ The final seal breaks. Responsible AI understanding confirmed.";
    feedback.className = "feedback-box success show";

    addScore(200);
    completeRoom(ROOM_NUMBER, CODE_FRAGMENT);

    setTimeout(() => {
      document.getElementById("fragmentReveal").classList.add("show");
      flashUnlock();
      SFX.unlock();
    }, 400);

    document.getElementById("nextRoomBtn").disabled = false;
  } else {
    feedback.textContent = `❌ You need at least 70% correct to unlock the final fragment. Refresh the page to retry the scenarios.`;
    feedback.className = "feedback-box error show";
  }
}

function lockInCompletedState() {
  document.getElementById("scenarioProgress").innerHTML = SCENARIOS.map(() => '<div class="scenario-dot done"></div>').join("");
  document.getElementById("scenarioContainer").innerHTML = `
    <div class="scenario-box glass-card" style="text-align:center;">
      <h3>✅ Room already completed</h3>
      <p style="color:var(--gray); margin-top:10px;">You've already cleared the ethics scenarios in this session.</p>
    </div>
  `;
  document.getElementById("fragmentReveal").classList.add("show");
  document.getElementById("nextRoomBtn").disabled = false;
}

async function handleHint() {
  const hintBtn = document.getElementById("hintBtn");
  const hintText = document.getElementById("hintText");
  const scenario = SCENARIOS[Math.min(currentIndex, SCENARIOS.length - 1)];

  hintBtn.disabled = true;
  hintBtn.innerHTML = '<span class="spinner"></span> Thinking...';

  const result = await callApi("/api/hint", {
    roomTitle: "Room 5: The Dark Side",
    concept: `Responsible AI — ${scenario.tag}`,
    question: `${scenario.text} ${scenario.question}`,
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
