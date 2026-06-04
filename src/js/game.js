document.querySelectorAll(".answer-option").forEach((option) => {
  const input = option.querySelector('input[type="radio"]');

  if (!input) {
    return;
  }

  option.addEventListener("pointerdown", () => {
    option.dataset.wasChecked = input.checked ? "true" : "false";
  });

  option.addEventListener("click", (event) => {
    if (option.dataset.wasChecked !== "true") {
      return;
    }

    event.preventDefault();
    input.checked = false;
    option.dataset.wasChecked = "false";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
});
