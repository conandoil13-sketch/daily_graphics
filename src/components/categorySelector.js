import { qsa, qs } from "../dom.js?v=6";
import { inputMetaByCategory, setCategory, subscribe, unitsByCategory } from "../state.js?v=6";

export function initCategorySelector() {
  const categoryInput = qs("#category");
  const valueInput = qs("#metric-value");
  const valueLabel = qs('label[for="metric-value"]');
  const unitInput = qs("#metric-unit");
  const buttons = qsa("[data-category]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => setCategory(button.dataset.category));
  });

  subscribe(({ selectedCategory }) => {
    const units = unitsByCategory[selectedCategory] || unitsByCategory["이동"];
    const meta = inputMetaByCategory[selectedCategory] || inputMetaByCategory["이동"];

    categoryInput.value = selectedCategory;
    unitInput.innerHTML = units.map((unit) => `<option value="${unit.value}">${unit.label}</option>`).join("");
    unitInput.value = units[0].value;
    valueLabel.textContent = meta.label;
    valueInput.placeholder = meta.placeholder;

    buttons.forEach((button) => {
      button.classList.toggle("active", button.dataset.category === selectedCategory);
    });
  });
}
