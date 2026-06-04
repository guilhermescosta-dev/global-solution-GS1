Object.assign(LunarGameUI.prototype, {
  renderConstruction() {
    this.updateResources(null);
    this.quizCard.classList.add("is-summary-mode");
    this.quizForm.hidden = false;
    if (this.formActions) this.formActions.hidden = true;
    this.clearFeedback();
    this.questionEl.hidden = false;
    this.quizForm.onsubmit = (event) => event.preventDefault();
    this.questionEl.textContent = "Use seus recursos para construir ou melhorar um módulo da base.";

    this.updateCardTitle("Construção e Upgrades");

    const modules = getModulesData();
    const moduleCards = Object.entries(modules)
      .map(([key, module]) => this.createModuleCard(key, module))
      .join("");

    this.answerList.innerHTML = `
      ${this.createVitalSummary()}
      <div class="construction-grid">
        ${moduleCards}
      </div>
      <div class="construction-actions">
        <button type="button" class="botao-iniciar button-secondary" data-skip-build>
          Guardar recursos e finalizar semana
        </button>
      </div>
    `;

    this.answerList.querySelectorAll("[data-build-module]").forEach((button) => {
      button.addEventListener("click", () => this.buildModule(button.dataset.buildModule));
    });

    this.answerList.querySelector("[data-skip-build]").addEventListener("click", () => {
      this.finishWeek("Nenhum m\u00f3dulo foi constru\u00eddo nesta semana.");
    });
  },

  // O mapa com tooltips do JS antigo virou uma lista de cards simples,
  // entao cada card ja mostra custo, producao e consumo antes do clique.
  createModuleCard(key, module) {
    const currentLevel = this.state.activeModules[key] ?? 0;
    const nextLevel = module.levels[currentLevel];
    const isMaxLevel = !nextLevel;
    const cost = nextLevel?.cost ?? {};
    const available = !isMaxLevel && canAfford(this.state.operational, cost);
    const actionLabel = currentLevel === 0 ? "Construir" : "Fazer upgrade";
    const costText = isMaxLevel ? "Nível máximo alcançado" : formatCostList(cost);
    const effectText = isMaxLevel
      ? this.createModuleEffects(module.levels[currentLevel - 1])
      : this.createModuleEffects(nextLevel);

    return `
      <article class="module-option ${available ? "" : "is-disabled"}">
        <i class="bi ${MODULE_ICONS[key] ?? "bi-tools"}" aria-hidden="true"></i>
        <div class="module-option-content">
          <span class="module-level">Nível atual: ${currentLevel}/3</span>
          <h3>${module.name}</h3>
          <p class="module-cost"><strong>Custo:</strong> ${costText}</p>
          ${effectText}
          <button
            type="button"
            class="botao-iniciar"
            data-build-module="${key}"
            ${available ? "" : "disabled"}
          >
            ${isMaxLevel ? "Completo" : actionLabel}
          </button>
        </div>
      </article>
    `;
  },

  createModuleEffects(levelData) {
    if (!levelData) {
      return "";
    }

    const production = Object.entries(levelData.prod)
      .map(([resource, value]) => formatVitalDelta(resource, value, "+"))
      .join(" · ");
    const consumption = Object.entries(levelData.cons)
      .map(([resource, value]) => formatVitalDelta(resource, value, "-"))
      .join(" · ");

    return `
      <div class="module-effects">
        <span class="effect-positive"><strong>Produz:</strong> ${production || "Nada"}</span>
        <span class="effect-negative"><strong>Consome:</strong> ${consumption || "Nada"}</span>
      </div>
    `;
  },

  buildModule(key) {
    const module = getModulesData()[key];
    const currentLevel = this.state.activeModules[key] ?? 0;
    const nextLevel = module.levels[currentLevel];

    if (!nextLevel || !canAfford(this.state.operational, nextLevel.cost)) {
      this.showFeedback("Recursos insuficientes para esse m\u00f3dulo.", "warning");
      return;
    }

    const nextOperational = { ...this.state.operational };
    Object.entries(nextLevel.cost).forEach(([resource, value]) => {
      nextOperational[resource] -= value;
    });

    this.state = {
      ...this.state,
      operational: nextOperational,
      activeModules: {
        ...this.state.activeModules,
        [key]: currentLevel + 1,
      },
    };

    this.finishWeek(`${module.name} chegou ao nível ${currentLevel + 1}.`);
  }
});

