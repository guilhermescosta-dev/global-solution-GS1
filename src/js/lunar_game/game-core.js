// Adaptador visual do layout novo. A regra do jogo foi reaproveitada,
// mas os IDs antigos foram trocados por seletores semanticos do quiz atual.
class LunarGameUI {
  constructor() {
    this.state = loadState();
    this.root = document.querySelector(".quiz-section");
    this.quizCard = document.querySelector(".quiz-card");
    this.quizForm = document.querySelector(".quiz-form");
    this.formActions = document.querySelector(".quiz-form > .game-actions");
    this.questionEl = document.querySelector(".quiz-question");
    this.answerList = document.querySelector(".answer-list");
    this.rewardEl = document.querySelector(".answer-reward");
    this.progressWeek = document.querySelector("[data-progress-week]");
    this.progressQuestion = document.querySelector("[data-progress-question]");
    this.progressRow = document.querySelector(".quiz-progress-row");
    this.resourceCards = document.querySelectorAll("[data-resource-card]");
    this.resourcesSection = document.querySelector(".quiz-resources");
    this.pendingBuildKey = null;

    if (!this.root || !this.quizCard || !this.quizForm) {
      return;
    }

    this.render();
  }

  setState(nextState) {
    const previousState = this.state;
    this.state = nextState;
    saveState(this.state);
    this.render();
    this.scrollToGameTop(previousState, nextState);
  }

  scrollToGameTop(previousState, nextState) {
    const changedSection =
      previousState.phase !== nextState.phase ||
      previousState.questionIndex !== nextState.questionIndex;

    if (!changedSection) {
      return;
    }

    setTimeout(() => {
      this.root.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  render() {
    this.updateResources();
    this.updateProgress();
    this.updateProgressVisibility();

    if (this.state.phase === "construction") {
      this.renderConstruction();
      return;
    }

    if (this.state.phase === "week-summary") {
      this.renderWeekSummary();
      return;
    }

    if (this.state.phase === "game-over") {
      this.renderGameOver();
      return;
    }

    this.renderQuestion();
  }

  updateResources(targetResource = null) {
    const question = getCurrentQuestion(this.state);
    const activeResource = targetResource ?? question?.resource;

    if (this.resourcesSection) {
      this.resourcesSection.hidden = this.state.phase === "game-over";
    }

    this.resourceCards.forEach((card) => {
      const resource = card.dataset.resourceCard;
      const value = card.querySelector("strong");
      card.classList.toggle("is-target", resource === activeResource && this.state.phase === "quiz");

      if (value) {
        value.textContent = this.state.operational[resource] ?? 0;
      }

      card.querySelector(".resource-gain")?.remove();

      const shouldShowGain =
        this.state.phase === "quiz" &&
        this.state.lastAnswer?.resource === resource &&
        this.state.lastAnswer?.rewardValue > 0;

      card.classList.toggle("is-gained", shouldShowGain);

      if (shouldShowGain) {
        const gain = document.createElement("em");
        gain.className = "resource-gain";
        gain.textContent = `+${this.state.lastAnswer.rewardValue}`;
        card.querySelector(".operational-card-info")?.appendChild(gain);
      }
    });
  }

  updateProgress() {
    this.updateProgressChip(this.progressWeek, {
      current: this.state.week,
      total: CONFIG.MAX_WEEKS,
      completedStatus: "is-correct",
    });

    this.updateProgressChip(this.progressQuestion, {
      current: Math.min(this.state.questionIndex + 1, CONFIG.QUESTIONS_PER_WEEK),
      total: CONFIG.QUESTIONS_PER_WEEK,
      questionResults: this.state.questionResults,
    });
  }

  updateProgressVisibility() {
    const hideQuestionProgress = ["week-summary", "game-over"].includes(this.state.phase);

    if (this.progressQuestion) {
      this.progressQuestion.hidden = hideQuestionProgress;
    }

    this.progressRow?.classList.toggle("is-week-only", hideQuestionProgress);
  }

  updateProgressChip(chip, config) {
    if (!chip) {
      return;
    }

    const number = chip.querySelector(".progress-chip-heading strong");
    const blocks = chip.querySelector(".progress-blocks");

    if (number) {
      number.textContent = `${config.current}/${config.total}`;
    }

    if (!blocks) {
      return;
    }

    blocks.innerHTML = "";

    for (let index = 0; index < config.total; index++) {
      const block = document.createElement("i");

      if (config.questionResults) {
        const result = config.questionResults[index];
        if (result === "correct") block.classList.add("is-correct");
        if (result === "wrong") block.classList.add("is-wrong");
        if (!result && index === this.state.questionIndex && this.state.phase === "quiz") {
          block.classList.add("is-active");
        }
      } else if (this.state.phase === "game-over") {
        block.classList.add(config.completedStatus);
      } else if (index + 1 < this.state.week) {
        block.classList.add(config.completedStatus);
      } else if (index + 1 === this.state.week) {
        block.classList.add("is-active");
      }

      blocks.appendChild(block);
    }
  }

  isReviewingAnswer() {
    return Boolean(this.state.lastAnswer);
  }

  updateCardTitle(title) {
    const header = this.quizCard.querySelector(".quiz-card-header h2");

    if (header) {
      header.textContent = title;
    }
  }

  showFeedback(message, type) {
    this.clearFeedback();

    const feedback = document.createElement("p");
    feedback.className = `quiz-inline-feedback is-${type}`;
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.textContent = message;
    this.quizForm.appendChild(feedback);
  }

  clearFeedback() {
    this.quizForm.querySelector(".quiz-inline-feedback")?.remove();
  }
}
