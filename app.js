const MOCK_QUESTION_COUNT = 20;
const MOCK_PASS_MARK = 15;
const MOCK_DURATION_SECONDS = 45 * 60;

const root = document.getElementById("app");

const state = {
  view: "home",
  // mock test
  mockQuestions: [],
  mockAnswers: [],
  mockIndex: 0,
  mockTimeRemaining: MOCK_DURATION_SECONDS,
  mockTimerId: null,
  mockSubmitted: false,
  // open practice
  practiceQueue: [],
  practiceIndex: 0,
  practiceSelected: null,
  practiceCorrectCount: 0,
  practiceAttemptCount: 0,
};

function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function goHome() {
  clearMockTimer();
  state.view = "home";
  render();
}

// ---------------- Mock Test ----------------

function startMockTest() {
  state.mockQuestions = shuffle(QUESTION_BANK).slice(0, MOCK_QUESTION_COUNT);
  state.mockAnswers = new Array(MOCK_QUESTION_COUNT).fill(null);
  state.mockIndex = 0;
  state.mockTimeRemaining = MOCK_DURATION_SECONDS;
  state.mockSubmitted = false;
  state.view = "mock-test";
  startMockTimer();
  render();
}

function startMockTimer() {
  clearMockTimer();
  state.mockTimerId = setInterval(() => {
    state.mockTimeRemaining--;
    if (state.mockTimeRemaining <= 0) {
      state.mockTimeRemaining = 0;
      submitMockTest();
      return;
    }
    updateTimerDisplayOnly();
  }, 1000);
}

function clearMockTimer() {
  if (state.mockTimerId) {
    clearInterval(state.mockTimerId);
    state.mockTimerId = null;
  }
}

function updateTimerDisplayOnly() {
  const el = document.getElementById("mock-timer");
  if (!el) return;
  el.textContent = formatTime(state.mockTimeRemaining);
  el.classList.toggle("low", state.mockTimeRemaining <= 60);
}

function selectMockAnswer(optionIndex) {
  state.mockAnswers[state.mockIndex] = optionIndex;
  render();
}

function mockGoNext() {
  if (state.mockIndex < state.mockQuestions.length - 1) {
    state.mockIndex++;
    render();
  }
}

function mockGoPrev() {
  if (state.mockIndex > 0) {
    state.mockIndex--;
    render();
  }
}

function mockJumpTo(i) {
  state.mockIndex = i;
  render();
}

function attemptSubmitMockTest() {
  const unanswered = state.mockAnswers.filter((a) => a === null).length;
  if (unanswered > 0) {
    const proceed = confirm(
      `You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. Submit anyway?`
    );
    if (!proceed) return;
  }
  submitMockTest();
}

function submitMockTest() {
  if (state.mockSubmitted) return;
  state.mockSubmitted = true;
  clearMockTimer();
  state.view = "mock-results";
  render();
}

function computeMockScore() {
  let score = 0;
  state.mockQuestions.forEach((q, i) => {
    if (state.mockAnswers[i] === q.correct) score++;
  });
  return score;
}

// ---------------- Open Practice ----------------

function startPractice() {
  state.practiceQueue = shuffle(QUESTION_BANK);
  state.practiceIndex = 0;
  state.practiceSelected = null;
  state.practiceCorrectCount = 0;
  state.practiceAttemptCount = 0;
  state.view = "practice";
  render();
}

function currentPracticeQuestion() {
  return state.practiceQueue[state.practiceIndex];
}

function selectPracticeAnswer(optionIndex) {
  if (state.practiceSelected !== null) return;
  state.practiceSelected = optionIndex;
  state.practiceAttemptCount++;
  if (optionIndex === currentPracticeQuestion().correct) {
    state.practiceCorrectCount++;
  }
  render();
}

function nextPracticeQuestion() {
  state.practiceIndex++;
  if (state.practiceIndex >= state.practiceQueue.length) {
    const lastId = state.practiceQueue[state.practiceQueue.length - 1].id;
    let reshuffled = shuffle(QUESTION_BANK);
    if (reshuffled.length > 1 && reshuffled[0].id === lastId) {
      [reshuffled[0], reshuffled[1]] = [reshuffled[1], reshuffled[0]];
    }
    state.practiceQueue = reshuffled;
    state.practiceIndex = 0;
  }
  state.practiceSelected = null;
  render();
}

// ---------------- Rendering ----------------

function render() {
  root.innerHTML = "";
  if (state.view === "home") root.appendChild(renderHome());
  else if (state.view === "mock-test") root.appendChild(renderMockTest());
  else if (state.view === "mock-results") root.appendChild(renderMockResults());
  else if (state.view === "practice") root.appendChild(renderPractice());
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === null || v === undefined || v === false) return;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c === null || c === undefined) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}

function renderHome() {
  const wrap = el("div");
  wrap.appendChild(
    el("header", { class: "topbar" }, [
      el("div", {}, [
        el("h1", {}, [el("span", { class: "flag-strip" }), "Citizenship Test Practice"]),
        el("p", { class: "subtitle" }, "Prepare for the Australian citizenship test"),
      ]),
    ])
  );

  const grid = el("div", { class: "home-grid" }, [
    el("button", { class: "mode-btn", onclick: startMockTest }, [
      el("strong", {}, "Mock Test"),
      el("span", {}, `${MOCK_QUESTION_COUNT} questions, 45 minutes, ${MOCK_PASS_MARK}/${MOCK_QUESTION_COUNT} to pass. Your score and all answers are revealed at the end.`),
    ]),
    el("button", { class: "mode-btn", onclick: startPractice }, [
      el("strong", {}, "Open Practice"),
      el("span", {}, "Work through random questions one at a time. See the correct answer immediately after each pick."),
    ]),
  ]);
  wrap.appendChild(grid);

  wrap.appendChild(
    el("p", { class: "disclaimer" },
      "Questions are written to reflect the general topics of the official Australian citizenship test " +
      "(Australia and its people; democratic beliefs, rights and liberties; government and law). " +
      "They are not sourced from the official test booklet and may not exactly match its wording or every fact — " +
      "use this for practice alongside, not instead of, the official material."
    )
  );

  return wrap;
}

function renderMockTest() {
  const q = state.mockQuestions[state.mockIndex];
  const total = state.mockQuestions.length;
  const selected = state.mockAnswers[state.mockIndex];

  const wrap = el("div");

  wrap.appendChild(
    el("div", { class: "progress-row" }, [
      el("span", { text: `Question ${state.mockIndex + 1} of ${total}` }),
      el("span", { id: "mock-timer", class: "timer" + (state.mockTimeRemaining <= 60 ? " low" : ""), text: formatTime(state.mockTimeRemaining) }),
    ])
  );

  const card = el("div", { class: "card" });
  card.appendChild(el("p", { class: "question-text", text: q.q }));

  const options = el("div", { class: "options" });
  q.options.forEach((opt, i) => {
    const btn = el("button", {
      class: "option-btn" + (selected === i ? " selected" : ""),
      onclick: () => selectMockAnswer(i),
    }, opt);
    options.appendChild(btn);
  });
  card.appendChild(options);

  const nav = el("div", { class: "nav-row" }, [
    el("button", { class: "btn", disabled: state.mockIndex === 0, onclick: mockGoPrev }, "Previous"),
    state.mockIndex < total - 1
      ? el("button", { class: "btn", onclick: mockGoNext }, "Next")
      : null,
    el("div", { class: "spacer" }),
    el("button", { class: "btn primary", onclick: attemptSubmitMockTest }, "Submit Test"),
  ]);
  card.appendChild(nav);

  wrap.appendChild(card);

  // question jump grid
  const jump = el("div", { class: "options" });
  jump.style.display = "grid";
  jump.style.gridTemplateColumns = "repeat(10, 1fr)";
  jump.style.gap = "6px";
  state.mockQuestions.forEach((_, i) => {
    const answered = state.mockAnswers[i] !== null;
    const b = el("button", {
      class: "btn" + (i === state.mockIndex ? " primary" : ""),
      style: `padding:6px; font-size:0.8rem; ${answered && i !== state.mockIndex ? "border-color:#00843d;" : ""}`,
      onclick: () => mockJumpTo(i),
      text: String(i + 1),
    });
    jump.appendChild(b);
  });
  wrap.appendChild(el("div", { class: "card" }, [
    el("p", { class: "subtitle", text: "Jump to question:" }),
    jump,
  ]));

  return wrap;
}

function renderMockResults() {
  const score = computeMockScore();
  const passed = score >= MOCK_PASS_MARK;
  const wrap = el("div");

  wrap.appendChild(
    el("header", { class: "topbar" }, [
      el("h1", {}, "Mock Test Results"),
    ])
  );

  wrap.appendChild(
    el("div", { class: "score-banner " + (passed ? "pass" : "fail") }, [
      el("div", { class: "score", text: `${score} / ${state.mockQuestions.length}` }),
      el("div", { class: "verdict", text: passed ? "PASS" : "FAIL" }),
      el("p", { class: "subtitle", text: `Passing mark is ${MOCK_PASS_MARK}/${state.mockQuestions.length}.` }),
    ])
  );

  wrap.appendChild(el("h2", { text: "Answer Review" }));

  state.mockQuestions.forEach((q, i) => {
    const userAnswer = state.mockAnswers[i];
    const item = el("div", { class: "review-item" });
    item.appendChild(el("div", { class: "review-q" }, [
      `${i + 1}. ${q.q}`,
      el("span", {
        class: "review-tag",
        style: userAnswer === q.correct ? "color:#1e7e34" : "color:#c0392b",
        text: userAnswer === q.correct ? "Correct" : (userAnswer === null ? "Not answered" : "Incorrect"),
      }),
    ]));
    q.options.forEach((opt, oi) => {
      let cls = "review-option";
      if (oi === q.correct) cls += " correct";
      else if (oi === userAnswer) cls += " user-wrong";
      const label = oi === q.correct ? " (correct answer)" : (oi === userAnswer ? " (your answer)" : "");
      item.appendChild(el("div", { class: cls, text: opt + label }));
    });
    wrap.appendChild(item);
  });

  wrap.appendChild(
    el("div", { class: "nav-row" }, [
      el("button", { class: "btn primary", onclick: startMockTest }, "Retake Mock Test"),
      el("button", { class: "btn", onclick: goHome }, "Home"),
    ])
  );

  return wrap;
}

function renderPractice() {
  const q = currentPracticeQuestion();
  const selected = state.practiceSelected;
  const answered = selected !== null;

  const wrap = el("div");

  wrap.appendChild(
    el("div", { class: "progress-row" }, [
      el("span", { class: "category-tag", text: q.category }),
      el("span", { class: "practice-tally", text: `Score: ${state.practiceCorrectCount} / ${state.practiceAttemptCount}` }),
    ])
  );

  const card = el("div", { class: "card" });

  if (answered) {
    const isCorrect = selected === q.correct;
    card.appendChild(
      el("div", { class: "feedback-banner " + (isCorrect ? "correct" : "incorrect") },
        isCorrect ? "Correct!" : "Incorrect"
      )
    );
  }

  card.appendChild(el("p", { class: "question-text", text: q.q }));

  const options = el("div", { class: "options" });
  q.options.forEach((opt, i) => {
    let cls = "option-btn";
    if (answered) {
      if (i === q.correct) cls += " correct";
      else if (i === selected) cls += " incorrect";
    } else if (i === selected) {
      cls += " selected";
    }
    const btn = el("button", {
      class: cls,
      disabled: answered ? "true" : null,
      onclick: () => selectPracticeAnswer(i),
    }, opt);
    options.appendChild(btn);
  });
  card.appendChild(options);

  const nav = el("div", { class: "nav-row" }, [
    el("button", { class: "btn", onclick: goHome }, "End Practice"),
    el("div", { class: "spacer" }),
    answered ? el("button", { class: "btn primary", onclick: nextPracticeQuestion }, "Next Question") : null,
  ]);
  card.appendChild(nav);

  wrap.appendChild(card);
  return wrap;
}

render();
