Object.assign(LunarGameUI.prototype, {
  finishWeek(actionMessage) {
    const weekChanges = this.calculateWeekVitalChanges();
    const nextState = this.createNextWeekState(actionMessage, weekChanges);

    this.setState(nextState);
  },

  calculateWeekVitalChanges() {
    const vitalBefore = { ...this.state.vital };
    const vitalAfter = { ...this.state.vital };
    const totalDelta = this.createEmptyVitalDelta();

    // Mantem a regra antiga de ativar modulos, mas troca a tabela detalhada
    // por um saldo geral mais facil de entender no novo layout.
    Object.entries(this.state.activeModules).forEach(([key, level]) => {
      if (level <= 0) return;

      const module = getModulesData()[key];
      const moduleData = module.levels[level - 1];

      Object.entries(moduleData.prod).forEach(([resource, value]) => {
        vitalAfter[resource] += value;
        totalDelta[resource] += value;
      });

      Object.entries(moduleData.cons).forEach(([resource, value]) => {
        vitalAfter[resource] -= value;
        totalDelta[resource] -= value;
      });
    });

    Object.entries(CONFIG.BASE_CONSUMPTION).forEach(([resource, value]) => {
      vitalAfter[resource] -= value;
      totalDelta[resource] -= value;
    });

    return { vitalBefore, vitalAfter, totalDelta };
  },

  createEmptyVitalDelta() {
    return Object.fromEntries(Object.keys(CONFIG.INITIAL_VITAL).map((resource) => [resource, 0]));
  },

  createNextWeekState(actionMessage, weekChanges) {
    const failed = Object.values(weekChanges.vitalAfter).some((value) => value <= 0);
    const completedMission = this.state.week >= CONFIG.MAX_WEEKS;
    const nextState = {
      ...this.state,
      vital: weekChanges.vitalAfter,
      lastReport: {
        actionMessage,
        ...weekChanges,
      },
    };

    if (failed || completedMission) {
      nextState.phase = "game-over";
      nextState.finalResult = this.createFinalResult(!failed, weekChanges.vitalAfter);
    } else {
      nextState.phase = "week-summary";
      nextState.week += 1;
      nextState.questionIndex = 0;
      nextState.questionResults = Array(CONFIG.QUESTIONS_PER_WEEK).fill(null);
      nextState.lastAnswer = null;
    }

    return nextState;
  },

  renderWeekSummary() {
    this.updateResources(null);
    this.quizCard.classList.add("is-summary-mode");
    this.quizForm.hidden = false;
    if (this.formActions) this.formActions.hidden = true;
    this.clearFeedback();
    this.questionEl.hidden = false;
    this.quizForm.onsubmit = (event) => event.preventDefault();
    this.questionEl.textContent = "A base sobreviveu a mais uma semana. Confira os impactos antes de seguir.";

    this.updateCardTitle("Resumo da Semana");

    this.answerList.innerHTML = `
      ${this.createVitalSummary()}
      ${this.createReportCard()}
      <div class="construction-actions">
        <button type="button" class="botao-iniciar" data-next-week>
          Ir para Semana ${this.state.week}
        </button>
      </div>
    `;

    this.answerList.querySelector("[data-next-week]").addEventListener("click", () => {
      this.setState({ ...this.state, phase: "quiz" });
    });
  },

  createReportCard() {
    const report = this.state.lastReport;

    if (!report) {
      return "";
    }

    if (!report.totalDelta) {
      return `
        <article class="quiz-feedback-card">
          <strong>${report.actionMessage ?? "Semana finalizada."}</strong>
          <p>Os recursos vitais foram atualizados. Continue para a pr\u00f3xima semana para ver o novo saldo.</p>
        </article>
      `;
    }

    return `
      <article class="quiz-feedback-card">
        <strong>${report.actionMessage}</strong>
        <p>Saldo geral da semana ap\u00f3s produ\u00e7\u00e3o dos m\u00f3dulos e consumo da base:</p>
        <div class="round-summary-grid">
          ${Object.entries(report.totalDelta)
            .map(([resource, delta]) => this.createRoundSummaryItem(report, resource, delta))
            .join("")}
        </div>
      </article>
    `;
  },

  createRoundSummaryItem(report, resource, delta) {
    const before = report.vitalBefore[resource];
    const after = report.vitalAfter[resource];
    const signal = delta > 0 ? "+" : "";
    const statusClass = delta >= 0 ? "is-positive" : "is-negative";

    return `
      <article class="round-summary-item ${statusClass}">
        <span>${VITAL_LABELS[resource]}</span>
        <strong>${before} â†’ ${Math.max(0, after)}</strong>
        <small>${signal}${delta}</small>
      </article>
    `;
  },

  createVitalSummary() {
    return `
      <div class="vital-summary">
        ${Object.entries(this.state.vital)
          .map(([resource, value]) => this.createVitalSummaryCard(resource, value))
          .join("")}
      </div>
    `;
  },

  createVitalSummaryCard(resource, value) {
    return `
      <article class="vital-summary-card vital-${getVitalClass(resource)}">
        <span>${VITAL_LABELS[resource]}</span>
        <strong>${Math.max(0, value)}</strong>
        <div class="resource-bar" aria-hidden="true">
          <span style="--progress: ${clampBarValue(value)}%"></span>
        </div>
      </article>
    `;
  },

  createFinalResult(victory, vital = this.state.vital) {
    if (!victory) {
      return {
        title: "Falha na Miss\u00e3o",
        status: "Um recurso vital chegou a zero.",
        message:
          "A base perdeu estabilidade e a tripula\u00e7\u00e3o precisou encerrar a opera\u00e7\u00e3o. Tente outra estrat\u00e9gia de constru\u00e7\u00e3o.",
      };
    }

    const minVital = Math.min(...Object.values(vital));

    if (minVital >= 60) {
      return {
        title: "Base Autossustent\u00e1vel",
        status: "Miss\u00e3o conclu\u00edda com excel\u00eancia.",
        message: "Sua base sobreviveu \u00e0s 10 semanas com grande equil\u00edbrio de recursos.",
      };
    }

    if (minVital >= 30) {
      return {
        title: "Miss\u00e3o Conclu\u00edda",
        status: "A tripula\u00e7\u00e3o chegou ao fim da opera\u00e7\u00e3o.",
        message: "A base sobreviveu, mas alguns recursos ainda poderiam ser otimizados.",
      };
    }

    return {
      title: "Miss\u00e3o em Risco",
      status: "A base sobreviveu no limite.",
      message: "Voc\u00ea concluiu a miss\u00e3o, mas a gest\u00e3o de recursos precisaria de melhorias.",
    };
  },

  renderGameOver() {
    this.updateResources(null);
    this.quizCard.classList.add("is-summary-mode");
    this.quizForm.hidden = false;
    if (this.formActions) this.formActions.hidden = true;
    this.clearFeedback();
    this.quizForm.onsubmit = (event) => event.preventDefault();

    const result = this.state.finalResult ?? this.createFinalResult(false);
    this.updateCardTitle("Resultado da Miss\u00e3o");

    this.questionEl.hidden = false;
    this.questionEl.textContent = result.title;

    this.answerList.innerHTML = `
      ${this.createVitalSummary()}
      <article class="quiz-feedback-card result-card">
        <strong>${result.status}</strong>
        <p>${result.message}</p>
      </article>
      ${this.createReportCard()}
      <div class="construction-actions">
        <button type="button" class="botao-iniciar" data-restart-game>
          Tentar novamente
        </button>
        <a href="./briefing.html" class="botao-iniciar button-secondary">
          Voltar ao briefing
        </a>
      </div>
    `;

    this.answerList.querySelector("[data-restart-game]").addEventListener("click", () => {
      resetGameState();
      this.setState(loadState());
    });
  },
});

