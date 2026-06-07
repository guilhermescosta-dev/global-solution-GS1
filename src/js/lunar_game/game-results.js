Object.assign(LunarGameUI.prototype, {
  createFinalResult(victory, vital = this.state.vital) {
    const rank = this.getMissionRank(victory, vital);

    return {
      ...rank,
      victory,
      vital: { ...vital },
      operational: { ...this.state.operational },
    };
  },

  getMissionRank(victory, vital) {
    // Ranking final mantido separado para facilitar rebalanceamento sem mexer na tela.
    const values = Object.values(vital);
    const minVital = Math.min(...values);
    const allAbove60 = values.every((value) => value >= 60);
    const allAbove40 = values.every((value) => value >= 40);

    if (!victory) {
      return {
        title: "Falha na Missão",
        status: "Um recurso vital chegou a zero.",
        message:
          "A base perdeu estabilidade e a tripulação precisou encerrar a operação. Tente outra estratégia de construção.",
      };
    }

    if (allAbove60) {
      return {
        title: "Base Autossustentável",
        status: "Missão concluída com excelência.",
        message: "Todos os recursos vitais terminaram acima de 60%.",
      };
    }

    if (allAbove40) {
      return {
        title: "Missão Sustentável",
        status: "A base completou a operação com estabilidade.",
        message: "A missão foi concluída, mesmo com alguns recursos abaixo do ideal.",
      };
    }

    if (minVital < 30) {
      return {
        title: "Missão no Limite",
        status: "A base sobreviveu, mas com recursos críticos.",
        message: "A tripulação chegou ao fim, porém a margem de segurança ficou baixa.",
      };
    }

    return {
      title: "Missão Concluída",
      status: "A tripulação chegou ao fim da operação.",
      message: "A base sobreviveu, mas ainda pode ser otimizada em uma próxima rodada.",
    };
  },

  renderGameOver() {
    this.updateResources(null);
    this.quizCard.classList.add("is-summary-mode");
    this.quizForm.hidden = false;
    if (this.formActions) this.formActions.hidden = true;
    this.clearFeedback();
    this.quizForm.onsubmit = (event) => event.preventDefault();

    const inferredVictory =
      this.state.week >= CONFIG.MAX_WEEKS && Object.values(this.state.vital).every((value) => value > 0);
    const result = this.state.finalResult ?? this.createFinalResult(inferredVictory);
    const totalQuestions = CONFIG.MAX_WEEKS * CONFIG.QUESTIONS_PER_WEEK;

    this.updateCardTitle("Resultado da Missão");
    this.questionEl.hidden = false;
    this.questionEl.textContent = result.title;

    this.answerList.innerHTML = `
      <section class="final-result-panel" role="status" aria-live="polite">
        <div class="final-stat-card">
          <span>Total de acertos</span>
          <strong>${this.state.stats?.correct ?? 0}/${totalQuestions}</strong>
        </div>
        <article class="quiz-feedback-card result-card">
          <strong>${result.status}</strong>
          <p>${result.message}</p>
        </article>
      </section>
      ${this.createVitalSummary()}
      ${this.createMissionTimeline()}
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

  createMissionTimeline() {
    const history = this.state.history ?? [];

    if (!history.length) {
      return "";
    }

    return `
      <section class="mission-timeline" aria-label="Histórico da missão">
        <h3>Histórico da missão</h3>
        <div class="mission-timeline-list">
          ${history.map((entry) => this.createTimelineItem(entry)).join("")}
        </div>
      </section>
    `;
  },

  createTimelineItem(entry) {
    return `
      <article class="timeline-item">
        <span>Semana ${entry.week}</span>
        ${this.createTimelineAnswerBlocks(entry)}
        <small>${entry.actionMessage}</small>
      </article>
    `;
  },

  createTimelineAnswerBlocks(entry) {
    const results = entry.questionResults ?? [];
    const blocks = Array.from({ length: CONFIG.QUESTIONS_PER_WEEK }, (_, index) => {
      const result = results[index];
      const className = result === "correct" ? "is-correct" : result === "wrong" ? "is-wrong" : "";

      return `<i class="${className}"></i>`;
    }).join("");

    return `
      <div class="timeline-answer-blocks" aria-label="${entry.correctAnswers ?? 0} acertos na semana">
        ${blocks}
      </div>
    `;
  },
});
