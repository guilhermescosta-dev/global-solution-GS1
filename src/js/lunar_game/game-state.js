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
    return {
      ...createInitialState(),
      ...JSON.parse(savedState),
    };
  } catch {
    const state = createInitialState();
    saveState(state);
    return state;
  }
}

function resetGameState() {
  saveState(createInitialState());
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
