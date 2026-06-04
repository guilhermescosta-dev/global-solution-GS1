function createInitialState() {
  return {
    week: 1,
    phase: "quiz",
    questionIndex: 0,
    questionResults: Array(CONFIG.QUESTIONS_PER_WEEK).fill(null),
    lastAnswer: null,
    vital: { ...CONFIG.INITIAL_VITAL },
    operational: { ...CONFIG.INITIAL_OPERATIONAL },
    activeModules: {
      painel_solar: 0,
      estufa: 0,
      reciclador_agua: 0,
      gerador_oxigenio: 0,
    },
    stats: {
      answered: 0,
      correct: 0,
    },
    history: [],
    lastReport: null,
    finalResult: null,
  };
}

// Diferente do codigo antigo, o fluxo atual sai de briefing.html e entra em quiz.html.
// Por isso o estado do jogo fica salvo no localStorage entre uma pagina e outra.
function saveState(state) {
  localStorage.setItem(LUNAR_STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const savedState = localStorage.getItem(LUNAR_STORAGE_KEY);

  if (!savedState) {
    const state = createInitialState();
    saveState(state);
    return state;
  }

  try {
    const normalizedState = normalizeGameState(JSON.parse(savedState));
    saveState(normalizedState);
    return normalizedState;
  } catch {
    const state = createInitialState();
    saveState(state);
    return state;
  }
}

function resetGameState() {
  saveState(createInitialState());
}

function normalizeGameState(savedState = {}) {
  const initialState = createInitialState();
  const normalizedActiveModules = Object.fromEntries(
    Object.keys(initialState.activeModules).map((key) => [
      key,
      normalizeModuleLevel(savedState.activeModules?.[key] ?? initialState.activeModules[key]),
    ]),
  );

  return {
    ...initialState,
    ...savedState,
    vital: {
      ...initialState.vital,
      ...savedState.vital,
    },
    operational: {
      ...initialState.operational,
      ...savedState.operational,
    },
    activeModules: normalizedActiveModules,
    stats: {
      ...initialState.stats,
      ...savedState.stats,
    },
    history: Array.isArray(savedState.history) ? savedState.history : [],
  };
}

function normalizeModuleLevel(value) {
  if (typeof value === "number") {
    return clampModuleLevel(value);
  }

  if (typeof value === "string") {
    return clampModuleLevel(Number(value));
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (value && typeof value === "object") {
    return clampModuleLevel(Number(value.level ?? value.currentLevel ?? value.nivel ?? value.value ?? 0));
  }

  return 0;
}

function clampModuleLevel(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(3, Math.trunc(value)));
}

function getActiveModuleLevel(state, key) {
  return normalizeModuleLevel(state.activeModules?.[key]);
}

function getSavedGameState() {
  // Usado pelo briefing para oferecer "Continuar missão" sem criar backend.
  try {
    const savedState = localStorage.getItem(LUNAR_STORAGE_KEY);
    return savedState ? normalizeGameState(JSON.parse(savedState)) : null;
  } catch {
    return null;
  }
}

function hasActiveSavedMission() {
  const savedState = getSavedGameState();
  return Boolean(savedState && savedState.phase !== "game-over" && hasMissionProgress(savedState));
}

function hasMissionProgress(state) {
  const initialState = createInitialState();
  const hasAnswered = (state.stats?.answered ?? 0) > 0;
  const hasHistory = (state.history ?? []).length > 0;
  const advancedPhase = state.phase !== initialState.phase || state.week !== initialState.week;
  const advancedQuestion = state.questionIndex !== initialState.questionIndex;
  const changedModules = Object.entries(state.activeModules).some(
    ([module, level]) => level !== initialState.activeModules[module],
  );
  const changedVital = Object.entries(state.vital).some(
    ([resource, value]) => value !== initialState.vital[resource],
  );
  const changedOperational = Object.entries(state.operational).some(
    ([resource, value]) => value !== initialState.operational[resource],
  );

  return (
    hasAnswered ||
    hasHistory ||
    advancedPhase ||
    advancedQuestion ||
    changedModules ||
    changedVital ||
    changedOperational
  );
}

function getQuestionsData() {
  return typeof QUESTIONS !== "undefined" ? QUESTIONS : [];
}

function getModulesData() {
  return typeof MODULES !== "undefined" ? MODULES : {};
}

function getQuestionsForWeek(week) {
  const questions = getQuestionsData();
  const start = (week - 1) * CONFIG.QUESTIONS_PER_WEEK;
  const weeklyQuestions = questions.slice(start, start + CONFIG.QUESTIONS_PER_WEEK);

  if (weeklyQuestions.length === CONFIG.QUESTIONS_PER_WEEK) {
    return weeklyQuestions;
  }

  return questions.slice(0, CONFIG.QUESTIONS_PER_WEEK);
}

function getCurrentQuestion(state) {
  return getQuestionsForWeek(state.week)[state.questionIndex];
}

function canAfford(operational, cost) {
  return Object.entries(cost).every(([resource, value]) => operational[resource] >= value);
}
