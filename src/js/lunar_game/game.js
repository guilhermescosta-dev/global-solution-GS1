// Inicializador do Jogo Operação Selene
document.addEventListener("DOMContentLoaded", () => {
  // Verifica se estamos na página do quiz
  if (document.querySelector(".quiz-section")) {
    window.game = new LunarGameUI();
    console.log("Jogo inicializado na página de Quiz.");
  }

  // Verifica se estamos na página de briefing para resetar o estado se necessário
  const startButton = document.querySelector("[data-game-start]");
  if (startButton) {
    startButton.addEventListener("click", () => {
      resetGameState();
      console.log("Estado do jogo resetado para nova missão.");
    });
  }
});
