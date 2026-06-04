Object.assign(LunarGameUI.prototype, {
  renderQuestion() {
    const question = getCurrentQuestion(this.state);

    if (!question) {
      this.setState({ ...this.state, phase: "construction" });
      return;
    }

    const resource = question.resource;

    this.quizCard.classList.remove("is-summary-mode");
    this.quizForm.hidden = false;
    if (this.formActions) this.formActions.hidden = false;
    if (this.rewardEl) this.rewardEl.hidden = false;
    this.quizForm.onsubmit = (event) =>
      this.isReviewingAnswer() ? this.advanceAfterAnswer(event) : this.handleAnswerSubmit(event);
    this.updateResources(resource);

    this.updateCardTitle("Desafio da Semana");
    this.questionEl.hidden = false;
    this.questionEl.textContent = question.text;

    // No codigo antigo as respostas eram botoes injetados em action-area.
    // Agora elas sao labels com radio real para manter semantica e acessibilidade.
    this.answerList.innerHTML = "";
    question.options.forEach((option, index) => {
      this.answerList.appendChild(this.createAnswerOption(question, option, index));
    });

    this.updateRewardLabel(resource);
    this.updateQuestionSubmitButton();
    this.updateAnswerFeedback(question);
  },

  updateRewardLabel(resource) {
    if (!this.rewardEl) {
      return;
    }

    const resourceMeta = getResourceMeta(resource);
    const rewardText = this.isReviewingAnswer()
      ? `Ganho +${this.state.lastAnswer.rewardValue} ${resourceMeta.label}`
      : `Acerto +${CONFIG.REWARD_VALUES.correct} · Erro +${CONFIG.REWARD_VALUES.wrong}`;

    this.rewardEl.innerHTML = `
      <i class="bi ${resourceMeta.icon}" aria-hidden="true"></i>
      ${rewardText}
    `;
  },

  updateQuestionSubmitButton() {
    const submitButton = this.formActions?.querySelector(".botao-iniciar");

    if (!submitButton) {
      return;
    }

    const isLastQuestion = this.state.questionIndex + 1 >= CONFIG.QUESTIONS_PER_WEEK;
    submitButton.textContent = this.isReviewingAnswer()
      ? isLastQuestion
        ? "Ir para construção"
        : "Próxima pergunta"
      : "Confirmar Resposta";
  },

  updateAnswerFeedback(question) {
    if (!this.isReviewingAnswer()) {
      this.clearFeedback();
      return;
    }

    const correctLetter = String.fromCharCode(65 + question.correct);
    this.showFeedback(
      this.state.lastAnswer.isCorrect
        ? `Resposta correta! Alternativa ${correctLetter}.`
        : `Resposta incorreta. A correta era a alternativa ${correctLetter}.`,
      this.state.lastAnswer.isCorrect ? "success" : "error",
    );
  },

  createAnswerOption(question, option, index) {
    const letter = String.fromCharCode(65 + index);
    const isReviewing = this.isReviewingAnswer();
    const isCorrect = index === question.correct;
    const isSelected = index === this.state.lastAnswer?.answerIndex;
    const label = document.createElement("label");
    label.className = [
      "answer-option",
      isReviewing && isCorrect ? "is-correct-answer" : "",
      isReviewing && isSelected && !isCorrect ? "is-wrong-answer" : "",
    ]
      .filter(Boolean)
      .join(" ");
    label.innerHTML = `
      <input
        type="radio"
        name="quiz-answer"
        value="${index}"
        ${isSelected ? "checked" : ""}
        ${isReviewing ? "disabled" : ""}
      />
      <strong>${letter}</strong>
      <span>${option}</span>
    `;

    this.bindToggleableRadio(label);
    return label;
  },

  bindToggleableRadio(label) {
    label.addEventListener("pointerdown", () => {
      const input = label.querySelector("input");
      label.dataset.wasChecked = input.checked ? "true" : "false";
    });

    label.addEventListener("click", (event) => {
      const input = label.querySelector("input");
      if (input.disabled || label.dataset.wasChecked !== "true") return;

      event.preventDefault();
      input.checked = false;
      label.dataset.wasChecked = "false";
    });
  },

  handleAnswerSubmit(event) {
    event.preventDefault();

    const selected = this.quizForm.querySelector('input[name="quiz-answer"]:checked');
    if (!selected) {
      this.showFeedback("Escolha uma alternativa para confirmar a resposta.", "warning");
      return;
    }

    const question = getCurrentQuestion(this.state);
    const answerIndex = Number(selected.value);
    const isCorrect = answerIndex === question.correct;
    const rewardValue = isCorrect ? CONFIG.REWARD_VALUES.correct : CONFIG.REWARD_VALUES.wrong;
    const resource = question.resource;
    const nextResults = [...this.state.questionResults];
    nextResults[this.state.questionIndex] = isCorrect ? "correct" : "wrong";

    // Mantem a recompensa do codigo antigo, mas nao avanca automaticamente:
    // primeiro a UI mostra a resposta certa e so depois libera a proxima etapa.
    this.setState({
      ...this.state,
      questionResults: nextResults,
      lastAnswer: {
        answerIndex,
        isCorrect,
        rewardValue,
        resource,
      },
      operational: {
        ...this.state.operational,
        [resource]: this.state.operational[resource] + rewardValue,
      },
      stats: {
        answered: (this.state.stats?.answered ?? 0) + 1,
        correct: (this.state.stats?.correct ?? 0) + (isCorrect ? 1 : 0),
      },
    });
  },

  advanceAfterAnswer(event) {
    event.preventDefault();

    const nextQuestionIndex = this.state.questionIndex + 1;

    if (nextQuestionIndex >= CONFIG.QUESTIONS_PER_WEEK) {
      this.setState({
        ...this.state,
        phase: "construction",
        questionIndex: CONFIG.QUESTIONS_PER_WEEK - 1,
        lastAnswer: null,
      });
      return;
    }

    this.setState({
      ...this.state,
      questionIndex: nextQuestionIndex,
      lastAnswer: null,
    });
  },
});
