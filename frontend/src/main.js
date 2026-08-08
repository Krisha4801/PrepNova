const API_BASE = window.INTERVIEW_API_BASE || "http://localhost:5000/api/interview";

const state = {
  sessionId: null,
  active: false,
  role: "",
  level: "",
  progress: null
};

const chat = document.getElementById("chat");
const inputArea = document.getElementById("inputArea");
const answerInput = document.getElementById("answerInput");
const statusBox = document.getElementById("status");
const startForm = document.getElementById("startForm");
const startButton = document.getElementById("startButton");
const sendButton = document.getElementById("sendButton");
const skipButton = document.getElementById("skipButton");
const newSessionButton = document.getElementById("newSessionButton");
const interviewShell = document.getElementById("interviewShell");
const sessionTitle = document.getElementById("sessionTitle");
const progressText = document.getElementById("progressText");
const levelText = document.getElementById("levelText");
const progressFill = document.getElementById("progressFill");

const sourceLabels = {
  txt: "Question bank",
  local: "Smart fallback",
  rubric: "Rubric scored",
  llm: "LLM"
};

function text(value, fallback = "") {
  return String(value ?? fallback);
}

function titleCase(value) {
  return text(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sourceLabel(source) {
  return sourceLabels[source] || titleCase(source || "Local");
}

function createElement(tag, className, content) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (content !== undefined) {
    element.textContent = content;
  }

  return element;
}

function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function setStatus(parts) {
  clearElement(statusBox);

  parts.filter(Boolean).forEach((part) => {
    statusBox.appendChild(createElement("span", "", part));
  });
}

function setBusy(isBusy) {
  startButton.disabled = isBusy;
  sendButton.disabled = isBusy;
  skipButton.disabled = isBusy;
  answerInput.disabled = isBusy;
}

function updateProgress(progress, level, source) {
  if (!progress) {
    return;
  }

  state.progress = progress;
  state.level = level;

  const current = Number(progress.current || 0);
  const total = Number(progress.total || 1);
  const percent = Math.max(0, Math.min(100, (current / total) * 100));
  const levelDisplay = titleCase(level);
  const questionDisplay = `Question ${current} of ${total}`;

  progressText.textContent = questionDisplay;
  levelText.textContent = levelDisplay;
  progressFill.style.width = `${percent}%`;
  setStatus([questionDisplay, levelDisplay, sourceLabel(source)]);
}

function addMessage(textContent, type, meta = {}) {
  const message = createElement("article", `message ${type}`);

  const metaItems = [meta.progress, meta.level, meta.source].filter(Boolean);
  if (metaItems.length) {
    const row = createElement("div", "message-meta");
    metaItems.forEach((item) => row.appendChild(createElement("span", "", item)));
    message.appendChild(row);
  }

  message.appendChild(createElement("p", "", textContent));
  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}

function scoreRow(label, value) {
  const normalized = Math.max(0, Math.min(10, Number(value) || 0));
  const row = createElement("div", "score-row");
  const name = createElement("span", "", label);
  const meter = createElement("meter");
  const score = createElement("strong", "", `${normalized}/10`);

  meter.min = 0;
  meter.max = 10;
  meter.value = normalized;

  row.append(name, meter, score);
  return row;
}

function chipList(items, className = "chip-list") {
  const list = createElement("div", className);
  items.filter(Boolean).forEach((item) => list.appendChild(createElement("span", "", item)));
  return list;
}

function bulletList(items) {
  const list = createElement("ul");

  items.filter(Boolean).forEach((item) => {
    list.appendChild(createElement("li", "", item));
  });

  return list;
}

function addEvaluation(evaluation) {
  const panel = createElement("article", "evaluation");
  const title = createElement("div", "evaluation-title");
  const heading = createElement("h2", "", `Answer score ${evaluation.rating}/10`);
  const badge = createElement("span", "", sourceLabel(evaluation.source));
  const scores = createElement("div", "scores");

  title.append(heading, badge);
  scores.append(
    scoreRow("Correctness", evaluation.correctness),
    scoreRow("Clarity", evaluation.clarity),
    scoreRow("Depth", evaluation.depth)
  );

  panel.append(title, createElement("p", "feedback", evaluation.feedback), scores);

  if (Array.isArray(evaluation.strengths) && evaluation.strengths.length) {
    const section = createElement("section", "result-section");
    section.append(createElement("h3", "", "Strengths"), bulletList(evaluation.strengths));
    panel.appendChild(section);
  }

  if (Array.isArray(evaluation.areasOfImprovement) && evaluation.areasOfImprovement.length) {
    const section = createElement("section", "result-section");
    section.append(createElement("h3", "", "Improve"), bulletList(evaluation.areasOfImprovement));
    panel.appendChild(section);
  }

  if (Array.isArray(evaluation.matchedConcepts) && evaluation.matchedConcepts.length) {
    const section = createElement("section", "result-section compact");
    section.append(createElement("h3", "", "Matched Concepts"), chipList(evaluation.matchedConcepts));
    panel.appendChild(section);
  }

  if (Array.isArray(evaluation.missedConcepts) && evaluation.missedConcepts.length) {
    const section = createElement("section", "result-section compact");
    section.append(createElement("h3", "", "Focus Concepts"), chipList(evaluation.missedConcepts, "chip-list muted"));
    panel.appendChild(section);
  }

  if (evaluation.referenceAnswer) {
    const reference = createElement("details", "reference");
    const summary = createElement("summary", "", "Reference answer");
    const referenceText = createElement("p", "", evaluation.referenceAnswer);

    reference.append(summary, referenceText);
    panel.appendChild(reference);
  }

  chat.appendChild(panel);
  chat.scrollTop = chat.scrollHeight;
}

function addFinalResult(data) {
  const panel = createElement("article", "final-result");
  const heading = createElement("h2", "", `${data.rating}: ${data.finalScore}/10`);
  const scores = createElement("div", "scores");
  const actions = createElement("div", "final-actions");
  const restart = createElement("button", "button primary", "New Session");

  restart.type = "button";
  restart.addEventListener("click", () => resetInterview({ preserveFields: true }));

  panel.append(heading, createElement("p", "feedback", data.feedback));

  if (data.categoryScores) {
    scores.append(
      scoreRow("Correctness", data.categoryScores.correctness),
      scoreRow("Clarity", data.categoryScores.clarity),
      scoreRow("Depth", data.categoryScores.depth)
    );
    panel.appendChild(scores);
  }

  if (Array.isArray(data.strengths) && data.strengths.length) {
    const section = createElement("section", "result-section");
    section.append(createElement("h3", "", "Strengths"), bulletList(data.strengths));
    panel.appendChild(section);
  }

  if (Array.isArray(data.areasOfImprovement) && data.areasOfImprovement.length) {
    const section = createElement("section", "result-section");
    section.append(createElement("h3", "", "Next Practice"), bulletList(data.areasOfImprovement));
    panel.appendChild(section);
  }

  actions.appendChild(restart);
  panel.appendChild(actions);
  chat.appendChild(panel);
  chat.scrollTop = chat.scrollHeight;
}

async function readJson(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

async function request(path, payload, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "POST",
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined
  });

  return readJson(response);
}

function showInterview(payload) {
  startForm.hidden = true;
  interviewShell.hidden = false;
  inputArea.hidden = false;
  newSessionButton.hidden = false;
  sessionTitle.textContent = `${payload.matchedRole ? titleCase(payload.matchedRole) : state.role} Interview`;
  updateProgress(payload.progress, payload.level, payload.source);
}

function addQuestion(data) {
  const source = sourceLabel(data.source);
  const level = data.levelChanged
    ? `${titleCase(data.previousLevel)} to ${titleCase(data.level)}`
    : titleCase(data.level);

  addMessage(data.question, "bot", {
    progress: `Question ${data.progress.current} of ${data.progress.total}`,
    level,
    source
  });
}

async function startInterview(event) {
  event.preventDefault();

  const roleInput = document.getElementById("role");
  const payload = {
    name: document.getElementById("name").value.trim(),
    role: roleInput.value.trim(),
    level: document.getElementById("level").value
  };

  if (!payload.role) {
    setStatus(["Choose a role"]);
    roleInput.focus();
    return;
  }

  setBusy(true);
  clearElement(chat);
  setStatus(["Starting"]);

  try {
    const data = await request("/start", payload);

    state.sessionId = data.sessionId;
    state.active = true;
    state.role = payload.role;
    state.level = data.level;

    showInterview(data);
    addQuestion(data);
    answerInput.value = "";
    answerInput.focus();
  } catch (error) {
    setStatus([error.message]);
  } finally {
    setBusy(false);
  }
}

async function completeTurn(data) {
  addEvaluation(data.evaluation);

  if (data.completed) {
    state.active = false;
    state.sessionId = null;
    inputArea.hidden = true;
    setStatus(["Completed", `${data.finalScore}/10`, data.rating]);
    addFinalResult(data);
    return;
  }

  updateProgress(data.progress, data.level, data.source);
  addQuestion(data);
  answerInput.focus();
}

async function sendAnswer(event) {
  event.preventDefault();

  const answer = answerInput.value.trim();

  if (!answer || !state.sessionId) {
    answerInput.focus();
    return;
  }

  addMessage(answer, "user");
  answerInput.value = "";
  setBusy(true);
  setStatus(["Scoring"]);

  try {
    const data = await request("/followup", {
      sessionId: state.sessionId,
      answer
    });

    await completeTurn(data);
  } catch (error) {
    setStatus([error.message]);
  } finally {
    setBusy(false);
  }
}

async function skipQuestion() {
  if (!state.sessionId) {
    return;
  }

  addMessage("Skipped this question.", "user");
  answerInput.value = "";
  setBusy(true);
  setStatus(["Skipping"]);

  try {
    const data = await request("/skip", { sessionId: state.sessionId });
    await completeTurn(data);
  } catch (error) {
    setStatus([error.message]);
  } finally {
    setBusy(false);
  }
}

async function endActiveSession() {
  if (!state.sessionId) {
    return;
  }

  await request(`/${encodeURIComponent(state.sessionId)}`, null, { method: "DELETE" }).catch(() => null);
}

async function resetInterview(options = {}) {
  await endActiveSession();

  state.sessionId = null;
  state.active = false;
  state.progress = null;
  state.level = "";

  clearElement(chat);
  answerInput.value = "";
  interviewShell.hidden = true;
  startForm.hidden = false;
  inputArea.hidden = false;
  newSessionButton.hidden = true;
  progressFill.style.width = "0%";
  setStatus(["Ready"]);
  setBusy(false);

  if (!options.preserveFields) {
    startForm.reset();
  }
}

startForm.addEventListener("submit", startInterview);
inputArea.addEventListener("submit", sendAnswer);
skipButton.addEventListener("click", skipQuestion);
newSessionButton.addEventListener("click", () => resetInterview({ preserveFields: true }));

answerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    inputArea.requestSubmit();
  }
});
