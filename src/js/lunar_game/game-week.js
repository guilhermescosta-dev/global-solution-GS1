Object.assign(LunarGameUI.prototype, {
  finishWeek(actionMessage, sourceState = this.state) {
    const weekChanges = this.calculateWeekVitalChanges(sourceState);
    const cappedChanges = this.applyVitalCaps(weekChanges);
    const nextState = this.createNextWeekState(actionMessage, cappedChanges, sourceState);

    this.setState(nextState);
  },

  calculateWeekVitalChanges(sourceState = this.state) {
    const vitalBefore = { ...sourceState.vital };
    const vitalAfter = { ...sourceState.vital };
    const totalDelta = this.createEmptyVitalDelta();

    // Mantem a regra antiga de ativar modulos, mas troca a tabela detalhada
    // por um saldo geral mais facil de entender no novo layout.
    Object.entries(sourceState.activeModules).forEach(([key]) => {
      const level = getActiveModuleLevel(sourceState, key);
      if (level <= 0) return;

      const module = getModulesData()[key];
      const moduleData = module?.levels[level - 1];
      if (!moduleData) return;

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

  applyVitalCaps(weekChanges) {
    const vitalAfter = Object.fromEntries(
      Object.entries(weekChanges.vitalAfter).map(([resource, value]) => [
        resource,
        clampBarValue(value),
      ]),
    );
    const totalDelta = Object.fromEntries(
      Object.entries(vitalAfter).map(([resource, value]) => [
        resource,
        value - weekChanges.vitalBefore[resource],
      ]),
    );

    return {
      ...weekChanges,
      vitalAfter,
      totalDelta,
    };
  },

  createEmptyVitalDelta() {
    return Object.fromEntries(Object.keys(CONFIG.INITIAL_VITAL).map((resource) => [resource, 0]));
  },

  createNextWeekState(actionMessage, weekChanges, sourceState = this.state) {
    const failed = Object.values(weekChanges.vitalAfter).some((value) => value <= 0);
    const completedMission = sourceState.week >= CONFIG.MAX_WEEKS;
    const nextState = {
      ...sourceState,
      vital: weekChanges.vitalAfter,
      lastReport: {
        actionMessage,
        ...weekChanges,
      },
      history: [...(sourceState.history ?? []), this.createHistoryEntry(actionMessage, weekChanges, sourceState)],
    };

    if (failed || completedMission) {
      nextState.phase = "game-over";
      nextState.finalResult = this.createFinalResult(!failed, weekChanges.vitalAfter);
    } else {
      nextState.phase = "week-summary";
      nextState.week = sourceState.week + 1;
      nextState.questionIndex = 0;
      nextState.questionResults = Array(CONFIG.QUESTIONS_PER_WEEK).fill(null);
      nextState.lastAnswer = null;
    }

    return nextState;
  },

  createHistoryEntry(actionMessage, weekChanges, sourceState = this.state) {
    const correctAnswers = (sourceState.questionResults ?? []).filter((result) => result === "correct").length;

    return {
      week: sourceState.week,
      actionMessage,
      correctAnswers,
      questionResults: [...(sourceState.questionResults ?? [])],
      vitalAfter: { ...weekChanges.vitalAfter },
      totalDelta: { ...weekChanges.totalDelta },
      modules: { ...sourceState.activeModules },
    };
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
      ${this.createRiskAlerts()}
      ${this.createVitalSummary(this.state.vital, this.state.lastReport?.vitalBefore, {
        mode: "summary",
        deltas: this.state.lastReport?.totalDelta,
      })}
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
          <p>Os recursos vitais foram atualizados. Continue para a próxima semana para ver o novo saldo.</p>
        </article>
      `;
    }

    return `
      <article class="quiz-feedback-card">
        <strong>${report.actionMessage}</strong>
        <p>Os cards acima já mostram o saldo final da semana, incluindo produção dos módulos e consumo da base.</p>
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
        <strong>${before} → ${Math.max(0, after)}</strong>
        <small>${signal}${delta}</small>
      </article>
    `;
  },

  createVitalSummary(vital = this.state.vital, previewVital = null, options = {}) {
    return `
      <div class="vital-summary">
        ${Object.entries(vital)
          .map(([resource, value]) =>
            this.createVitalSummaryCard(resource, value, previewVital?.[resource], options),
          )
          .join("")}
      </div>
    `;
  },

  createVitalSummaryCard(resource, value, previewValue = null, options = {}) {
    const meta = getVitalMeta(resource);
    const hasPreview = Number.isFinite(previewValue) && previewValue !== value;
    const currentBar = clampBarValue(value);
    const previewBar = clampBarValue(previewValue ?? value);
    const deltaStart = Math.min(currentBar, previewBar);
    const deltaWidth = Math.abs(currentBar - previewBar);
    const previewClass = previewBar >= currentBar ? "is-gain" : "is-loss";
    const delta = options.deltas?.[resource] ?? (hasPreview ? value - previewValue : 0);
    const deltaSignal = delta > 0 ? "+" : "";
    const summaryMode = options.mode === "summary";

    return `
      <article class="vital-summary-card vital-${getVitalClass(resource)}">
        <span class="vital-card-label">
          <i class="bi ${meta.icon}" aria-hidden="true"></i>
          ${meta.label}
          ${
            options.showBaseConsumption
              ? `<small class="base-consumption" title="Consumo semanal da base">-${CONFIG.BASE_CONSUMPTION[resource] ?? 0}</small>`
              : ""
          }
        </span>
        <strong>
          ${
            summaryMode && hasPreview
              ? `<small class="vital-previous-value">${Math.max(0, previewValue)} →</small>`
              : ""
          }
          ${Math.max(0, value)}
          ${
            hasPreview && !summaryMode
              ? `<small class="vital-preview-value ${previewClass}">→ ${Math.max(0, previewValue)}</small>`
              : ""
          }
          ${
            summaryMode
              ? `<small class="vital-delta-value ${delta >= 0 ? "is-gain" : "is-loss"}">${deltaSignal}${delta}</small>`
              : ""
          }
        </strong>
        <div class="resource-bar" aria-hidden="true">
          <span style="--progress: ${clampBarValue(value)}%"></span>
          ${
            hasPreview
              ? summaryMode
                ? `<em class="resource-bar-previous" style="--previous: ${previewBar}%"></em>`
                : `<em class="resource-bar-delta ${previewClass}" style="--delta-start: ${deltaStart}%; --delta-width: ${deltaWidth}%"></em>`
              : ""
          }
        </div>
      </article>
    `;
  },
});

