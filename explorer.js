/**
 * AI KNOWLEDGE HUB — explorer.js
 * Accordion behavior + live Gemini-powered demo + quiz generator.
 */

document.addEventListener("DOMContentLoaded", () => {
  initAccordions();

  document.getElementById("demoGenerateBtn").addEventListener("click", runDemoGenerate);
  document.getElementById("demoCopyBtn").addEventListener("click", copyDemoOutput);
  document.getElementById("demoClearBtn").addEventListener("click", clearDemo);
  document.getElementById("quizGenerateBtn").addEventListener("click", generateQuiz);
});

function initAccordions() {
  document.querySelectorAll(".accordion-item").forEach((item) => {
    const head = item.querySelector(".accordion-head");
    head.addEventListener("click", () => {
      item.classList.toggle("open");
    });
  });
}

let lastDemoResponse = "";

async function runDemoGenerate() {
  const topic = document.getElementById("demoTopic").value.trim();
  const mode = document.getElementById("demoMode").value;
  const output = document.getElementById("demoOutput");
  const btn = document.getElementById("demoGenerateBtn");

  if (!topic) {
    output.textContent = "⚠️ Please enter a topic first.";
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Generating...';
  output.textContent = "Thinking...";

  const result = await callApi("/api/generate", { mode: "explain", topic, style: mode });

  btn.disabled = false;
  btn.textContent = "⚡ GENERATE";

  if (result.success) {
    lastDemoResponse = result.response;
    output.textContent = result.response;
  } else {
    lastDemoResponse = "";
    output.textContent = "🤖 " + (result.error || "AI assistant temporarily unavailable.");
  }
}

function copyDemoOutput() {
  if (!lastDemoResponse) return;
  navigator.clipboard.writeText(lastDemoResponse).then(() => {
    const btn = document.getElementById("demoCopyBtn");
    const original = btn.textContent;
    btn.textContent = "✅ Copied!";
    setTimeout(() => (btn.textContent = original), 1500);
  });
}

function clearDemo() {
  document.getElementById("demoTopic").value = "";
  document.getElementById("demoOutput").textContent = "Your AI-generated response will appear here...";
  lastDemoResponse = "";
}

async function generateQuiz() {
  const topic = document.getElementById("quizTopic").value.trim();
  const container = document.getElementById("quizContainer");
  const btn = document.getElementById("quizGenerateBtn");

  if (!topic) {
    container.innerHTML = '<div class="feedback-box error show">⚠️ Please enter a quiz topic first.</div>';
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Building quiz...';
  container.innerHTML = "";

  const result = await callApi("/api/generate-quiz", { topic });

  btn.disabled = false;
  btn.textContent = "🧩 GENERATE QUIZ";

  if (!result.success || !result.questions || !result.questions.length) {
    container.innerHTML = `<div class="feedback-box info show">🤖 ${result.error || "AI assistant temporarily unavailable."}</div>`;
    return;
  }

  renderQuiz(result.questions, container);
}

function renderQuiz(questions, container) {
  container.innerHTML = "";
  questions.forEach((q, qIdx) => {
    const box = document.createElement("div");
    box.className = "scenario-box glass-card";
    box.style.marginBottom = "16px";
    box.innerHTML = `
      <p style="font-weight:700; margin-bottom:14px;">${qIdx + 1}. ${q.question}</p>
      <div class="options-list" data-qidx="${qIdx}">
        ${q.options.map((opt, i) => `<button class="option-btn" data-oidx="${i}"><span class="opt-letter">${String.fromCharCode(65 + i)}</span> ${opt}</button>`).join("")}
      </div>
      <div class="feedback-box" data-explain></div>
    `;
    container.appendChild(box);

    box.querySelectorAll(".option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const oidx = Number(btn.dataset.oidx);
        const allBtns = box.querySelectorAll(".option-btn");
        allBtns.forEach((b) => (b.disabled = true));
        const explainBox = box.querySelector("[data-explain]");

        if (oidx === q.correctIndex) {
          SFX.correct();
          btn.classList.add("correct");
          explainBox.textContent = "✅ Correct! " + (q.explanation || "");
          explainBox.className = "feedback-box success show";
        } else {
          SFX.wrong();
          btn.classList.add("wrong");
          allBtns[q.correctIndex].classList.add("correct");
          explainBox.textContent = "❌ " + (q.explanation || "Not quite — see the highlighted correct answer.");
          explainBox.className = "feedback-box error show";
        }
      });
    });
  });
}
