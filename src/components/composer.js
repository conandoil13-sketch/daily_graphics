import { qs } from "../dom.js?v=8";
import { finishToday } from "./dayLifecycle.js?v=8";
import { addEntry, getKoreaTodayKey, resetEntries, state } from "../state.js?v=8";

export function initComposer() {
  const valueInput = qs("#metric-value");
  const unitInput = qs("#metric-unit");
  const moodInput = qs("#mood");
  const addButton = qs("#add-entry-button");
  const finishButton = qs("#finish-day-button");
  const resetButton = qs("#reset-button");
  const finishModal = qs("#finish-modal");
  const outputNameInput = qs("#output-name");
  const finishCancelButton = qs("#finish-cancel-button");
  const finishConfirmButton = qs("#finish-confirm-button");

  function openFinishModal() {
    outputNameInput.value = `${getKoreaTodayKey().replaceAll("-", ".")} output`;
    finishModal.classList.remove("hidden");
    outputNameInput.focus();
  }

  function closeFinishModal() {
    finishModal.classList.add("hidden");
  }

  function submitEntry() {
    const numericValue = valueInput.value.trim();
    if (!numericValue) {
      valueInput.focus();
      return;
    }

    addEntry({
      category: state.selectedCategory,
      value: numericValue,
      unit: unitInput.value,
      mood: moodInput.value,
    });

    valueInput.value = "";
    moodInput.value = "";
    moodInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  addButton.addEventListener("click", submitEntry);
  finishButton.addEventListener("click", openFinishModal);
  finishCancelButton.addEventListener("click", closeFinishModal);
  finishConfirmButton.addEventListener("click", () => {
    const saved = finishToday(outputNameInput.value.trim());
    if (!saved) {
      closeFinishModal();
      return;
    }
    valueInput.value = "";
    moodInput.value = "";
    moodInput.dispatchEvent(new Event("change", { bubbles: true }));
    closeFinishModal();
  });
  outputNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") finishConfirmButton.click();
  });
  resetButton.addEventListener("click", () => {
    valueInput.value = "";
    moodInput.value = "";
    moodInput.dispatchEvent(new Event("change", { bubbles: true }));
    resetEntries();
  });

  valueInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") submitEntry();
  });
}
