Object.assign(LunarGameUI.prototype, {
  renderConstruction() {
    this.quizCard.classList.add("is-summary-mode");
    this.quizForm.hidden = false;
    if (this.formActions) this.formActions.hidden = true;
    this.clearFeedback();
    this.questionEl.hidden = false;
    this.quizForm.onsubmit = (event) => event.preventDefault();
    this.questionEl.textContent = "Use seus recursos para construir ou melhorar um módulo da base.";

    // O modelo 3D e o botão de tutorial já são mostrados na função render()
    // quando a fase muda para "construction"

    this.updateCardTitle("Construção e Upgrades");

    const modules = getModulesData();
    const previewState = this.pendingBuildKey ? this.createBuildPreviewState(this.pendingBuildKey) : null;
    const previewVital = previewState
      ? this.applyVitalCaps(this.calculateWeekVitalChanges(previewState)).vitalAfter
      : this.createSkipWeekPreview();
    this.updateResources(null, previewState?.operational ?? this.state.operational);
    const moduleCards = Object.entries(modules)
      .map(([key, module]) => this.createModuleCard(key, module))
      .join("");
    const selectedModule = this.pendingBuildKey ? modules[this.pendingBuildKey] : null;

    this.answerList.innerHTML = `
      ${this.createRiskAlerts()}
      ${this.createVitalSummary(this.state.vital, previewVital, { showBaseConsumption: true })}
      <div class="construction-grid">
        ${moduleCards}
      </div>
      ${this.createSelectedBuildCallout(selectedModule)}
      <div class="construction-actions">
        ${
          selectedModule
            ? `
              <button type="button" class="botao-iniciar" data-confirm-build>
                Confirmar escolha e finalizar semana
              </button>
            `
            : `
              <button type="button" class="botao-iniciar button-secondary" data-skip-build>
                Guardar recursos e finalizar semana
              </button>
            `
        }
      </div>
    `;

    this.answerList.querySelectorAll("[data-module-option]").forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target.closest("[data-module-action]")) {
          return;
        }

        this.selectBuildModule(card.dataset.moduleOption);
      });
    });

    this.answerList.querySelectorAll("[data-module-action]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this.handleModuleAction(button.dataset.moduleAction);
      });
    });

    this.answerList.querySelector("[data-confirm-build]")?.addEventListener("click", () => {
      this.confirmSelectedBuild();
    });

    this.answerList.querySelector("[data-skip-build]")?.addEventListener("click", () => {
      this.skipBuildStep();
    });
  },

  // O mapa com tooltips do JS antigo virou uma lista de cards simples,
  // entao cada card ja mostra custo, producao e consumo antes do clique.
  createModuleCard(key, module) {
    const currentLevel = getActiveModuleLevel(this.state, key);
    const nextLevel = module.levels[currentLevel];
    const isMaxLevel = !nextLevel;
    const cost = nextLevel?.cost ?? {};
    const available = !isMaxLevel && canAfford(this.state.operational, cost);
    const isUpgrade = currentLevel > 0 && !isMaxLevel;
    const isSelected = this.pendingBuildKey === key;
    const actionLabel = currentLevel === 0 ? "Construir módulo" : "Fazer upgrade";
    const buttonLabel = isMaxLevel ? "Completo" : isSelected ? "Confirmar escolha" : actionLabel;
    const buttonClass = isUpgrade ? "button-upgrade" : "button-build";
    const statusClass = isMaxLevel ? "is-complete" : isUpgrade ? "is-upgrade" : "is-new";
    const previousLevel = currentLevel > 0 ? module.levels[currentLevel - 1] : null;
    const previewLevel = isSelected && !isMaxLevel ? currentLevel + 1 : currentLevel;
    const effectText = isMaxLevel
      ? this.createModuleEffects(module.levels[currentLevel - 1])
      : this.createModuleEffects(nextLevel, previousLevel);

    return `
      <article
        class="module-option ${statusClass} ${isSelected ? "is-selected" : ""} ${available ? "" : "is-disabled"}"
        data-module-option="${key}"
      >
        <i class="bi ${MODULE_ICONS[key] ?? "bi-tools"}" aria-hidden="true"></i>
        <div class="module-option-content">
          ${this.createModuleLevelBlocks(currentLevel, previewLevel)}
          <h3>${module.name}</h3>
          ${this.createCostTags(cost, isMaxLevel)}
          ${effectText}
          <button
            type="button"
            class="botao-iniciar ${buttonClass}"
            data-module-action="${key}"
            ${available ? "" : "disabled"}
          >
            ${buttonLabel}
          </button>
        </div>
      </article>
    `;
  },

  createModuleLevelBlocks(currentLevel, previewLevel = currentLevel) {
    const blocks = Array.from({ length: 3 }, (_, index) => `
      <i class="${index < currentLevel ? "is-active" : index < previewLevel ? "is-preview" : ""}"></i>
    `).join("");

    const levelLabel = currentLevel === 0 ? "Não construído" : `Nível ${currentLevel} de 3`;

    return `
      <div class="module-level-row" aria-label="${levelLabel}">
        <span>${levelLabel}</span>
        <div class="module-level-blocks" aria-hidden="true">${blocks}</div>
      </div>
    `;
  },

  createSkipWeekPreview() {
    return this.applyVitalCaps(this.calculateWeekVitalChanges()).vitalAfter;
  },

  createCostTags(cost, isMaxLevel) {
    if (isMaxLevel) {
      return `<div class="module-cost-tags"><span class="module-tag is-neutral">Nível máximo</span></div>`;
    }

    const entries = Object.entries(cost);

    if (!entries.length) {
      return `<div class="module-cost-tags"><span class="module-tag is-neutral">Sem custo</span></div>`;
    }

    return `
      <div class="module-cost-tags" aria-label="Custo do módulo">
        <strong>Custo</strong>
        ${entries
          .map(([resource, value]) => {
            const meta = getResourceMeta(resource);
            return `
              <span class="module-tag is-cost">
                <i class="bi ${meta.icon}" aria-hidden="true"></i>
                ${value}
              </span>
            `;
          })
          .join("")}
      </div>
    `;
  },

  createModuleEffects(levelData, previousLevelData = null) {
    if (!levelData) {
      return "";
    }

    const production = this.createVitalEffectTags(levelData.prod, previousLevelData?.prod, "prod");
    const consumption = this.createVitalEffectTags(levelData.cons, previousLevelData?.cons, "cons");
    const isUpgradePreview = Boolean(previousLevelData);

    return `
      <div class="module-effects">
        <div class="effect-group">
          <strong>${isUpgradePreview ? "Adiciona" : "Produz"}</strong>
          <div>${production || `<span class="module-tag is-neutral">Nada</span>`}</div>
        </div>
        <div class="effect-group">
          <strong>${isUpgradePreview ? "Ajusta consumo" : "Consome"}</strong>
          <div>${consumption || `<span class="module-tag is-neutral">Nada</span>`}</div>
        </div>
      </div>
    `;
  },

  createVitalEffectTags(nextValues, previousValues = null, type = "prod") {
    return Object.entries(nextValues)
      .map(([resource, value]) => {
        const previousValue = previousValues?.[resource] ?? 0;
        const delta = previousValues ? value - previousValue : value;

        if (delta === 0) return "";

        const meta = getVitalMeta(resource);
        const isConsumption = type === "cons";
        const displayValue = isConsumption ? -delta : delta;
        const isPositive = displayValue > 0;

        return `
          <span class="module-tag ${isPositive ? "is-positive" : "is-negative"}">
            <i class="bi ${meta.icon}" aria-hidden="true"></i>
            ${isPositive ? "+" : ""}${displayValue}
          </span>
        `;
      })
      .join("");
  },

  createSelectedBuildCallout(module) {
    if (!module) {
      return `
        <article class="build-selection-callout">
          <strong>Escolha um módulo para prever o impacto.</strong>
          <p>As barras e o inventário mostram como a base ficará ao guardar recursos ou confirmar uma construção.</p>
        </article>
      `;
    }

    return `
      <article class="build-selection-callout is-selected">
        <strong>${module.name} selecionado</strong>
        <p>Confira o impacto nos recursos vitais e no inventário antes de confirmar a escolha.</p>
      </article>
    `;
  },

  async skipBuildStep() {
    if (
      this.hasAffordableBuildOption() &&
      !(await showGameConfirm({
        title: "Guardar recursos?",
        message:
          "Você ainda pode construir ou melhorar um módulo nesta semana. Deseja guardar os recursos e finalizar mesmo assim?",
        confirmText: "Guardar recursos",
        cancelText: "Voltar aos módulos",
      }))
    ) {
      return;
    }

    this.pendingBuildKey = null;
    this.finishWeek("Nenhum módulo foi construído nesta semana.");
  },

  hasAffordableBuildOption() {
    return Object.entries(getModulesData()).some(([key, module]) => {
      const currentLevel = getActiveModuleLevel(this.state, key);
      const nextLevel = module.levels[currentLevel];

      return Boolean(nextLevel && canAfford(this.state.operational, nextLevel.cost));
    });
  },

  handleModuleAction(key) {
    if (this.pendingBuildKey === key) {
      this.confirmSelectedBuild({ requireConfirmation: true });
      return;
    }

    this.selectBuildModule(key);
  },

  selectBuildModule(key) {
    if (this.pendingBuildKey === key) {
      this.pendingBuildKey = null;
      this.render();
      return;
    }

    const previewState = this.createBuildPreviewState(key);

    if (!previewState) {
      this.showFeedback("Recursos insuficientes para esse módulo.", "warning");
      return;
    }

    this.pendingBuildKey = key;
    this.render();
  },

  async confirmSelectedBuild({ requireConfirmation = false } = {}) {
    if (!this.pendingBuildKey) {
      return;
    }

    const module = getModulesData()[this.pendingBuildKey];
    const currentLevel = getActiveModuleLevel(this.state, this.pendingBuildKey);
    const nextState = this.createBuildPreviewState(this.pendingBuildKey);

    if (!nextState) {
      this.showFeedback("Recursos insuficientes para esse módulo.", "warning");
      return;
    }

    if (
      requireConfirmation &&
      !(await showGameConfirm({
        title: "Confirmar construção?",
        message: `${module.name} será aplicado e a semana será finalizada com a previsão mostrada nos recursos vitais.`,
        confirmText: "Confirmar e finalizar",
        cancelText: "Voltar aos módulos",
      }))
    ) {
      return;
    }

    this.pendingBuildKey = null;
    this.finishWeek(`${module.name} chegou ao nível ${currentLevel + 1}.`, nextState);
  },

  createBuildPreviewState(key) {
    const module = getModulesData()[key];
    const currentLevel = getActiveModuleLevel(this.state, key);
    const nextLevel = module.levels[currentLevel];

    if (!nextLevel || !canAfford(this.state.operational, nextLevel.cost)) {
      return null;
    }

    const nextOperational = { ...this.state.operational };
    Object.entries(nextLevel.cost).forEach(([resource, value]) => {
      nextOperational[resource] -= value;
    });

    const nextState = {
      ...this.state,
      operational: nextOperational,
      activeModules: {
        ...this.state.activeModules,
        [key]: currentLevel + 1,
      },
    };

    return nextState;
  },


});
