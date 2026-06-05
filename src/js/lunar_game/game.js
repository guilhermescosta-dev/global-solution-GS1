document.addEventListener("DOMContentLoaded", () => {
  setupStartLinks();
  setupContinueMissionLink();

  if (document.querySelector(".quiz-section") && typeof LunarGameUI !== "undefined") {
    window.game = new LunarGameUI();
  }
});

function setupStartLinks() {
  document.querySelectorAll("[data-game-start]").forEach((link) => {
    link.addEventListener("click", async (event) => {
      if (!hasActiveSavedMission()) {
        resetGameState();
        return;
      }

      event.preventDefault();

      const shouldRestart = await showGameConfirm({
        title: "Reiniciar missão?",
        message:
          "Existe uma missão em andamento. Se você iniciar outra simulação, o progresso atual será perdido.",
        confirmText: "Reiniciar",
        cancelText: "Continuar missão",
        isDanger: true,
      });

      if (!shouldRestart) {
        return;
      }

      resetGameState();
      window.location.href = link.href;
    });
  });
}

function setupContinueMissionLink() {
  if (!hasActiveSavedMission()) {
    return;
  }

  const actions = document.querySelector(".mission-copy .game-actions");
  if (!actions || actions.querySelector("[data-game-continue]")) {
    return;
  }

  const continueLink = document.createElement("a");
  continueLink.href = "./quiz.html";
  continueLink.className = "botao-iniciar button-secondary";
  continueLink.dataset.gameContinue = "true";
  continueLink.textContent = "Continuar missão";
  
  // Garante que o clique funcione corretamente redirecionando para o quiz
  continueLink.addEventListener("click", (e) => {
    // Se estivermos na home, o caminho é diferente
    const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    if (isHome) {
      e.preventDefault();
      window.location.href = "./src/pages/game-pages/quiz.html";
    }
  });

  actions.appendChild(continueLink);
}

function showGameConfirm({
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDanger = false,
}) {
  document.querySelector(".game-confirm-overlay")?.remove();

  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "game-confirm-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML = `
      <section class="game-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="game-confirm-title">
        <div class="game-confirm-icon ${isDanger ? "is-danger" : ""}" aria-hidden="true">
          <i class="bi ${isDanger ? "bi-exclamation-triangle" : "bi-question-circle"}"></i>
        </div>
        <div class="game-confirm-copy">
          <h2 id="game-confirm-title">${title}</h2>
          <p>${message}</p>
        </div>
        <div class="game-confirm-actions">
          <button type="button" class="botao-iniciar button-secondary" data-confirm-cancel>
            ${cancelText}
          </button>
          <button type="button" class="botao-iniciar ${isDanger ? "button-danger" : ""}" data-confirm-accept>
            ${confirmText}
          </button>
        </div>
      </section>
    `;

    const close = (result) => {
      document.removeEventListener("keydown", handleKeydown);
      overlay.remove();
      resolve(result);
    };

    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        close(false);
      }
    };

    overlay.querySelector("[data-confirm-cancel]").addEventListener("click", () => close(false));
    overlay.querySelector("[data-confirm-accept]").addEventListener("click", () => close(true));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        close(false);
      }
    });

    document.addEventListener("keydown", handleKeydown);
    document.body.appendChild(overlay);
    overlay.querySelector("[data-confirm-cancel]").focus();
  });
}
