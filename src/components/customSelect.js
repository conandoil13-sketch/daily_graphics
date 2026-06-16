import { qsa } from "../dom.js?v=11";

function optionLabel(select, value) {
  const option = Array.from(select.options).find((item) => item.value === value);
  return option?.textContent || select.options[select.selectedIndex]?.textContent || "";
}

function closeDropdown(wrapper) {
  wrapper.classList.remove("open");
  wrapper.querySelector(".select-menu")?.setAttribute("hidden", "");
  wrapper.querySelector(".select-trigger")?.setAttribute("aria-expanded", "false");
}

function renderOptions(select, wrapper) {
  const menu = wrapper.querySelector(".select-menu");
  const label = wrapper.querySelector(".select-value");
  const selected = select.value;

  label.textContent = optionLabel(select, selected);
  menu.innerHTML = Array.from(select.options)
    .map(
      (option) => `
        <button class="select-option ${option.value === selected ? "selected" : ""}" type="button" data-value="${option.value}">
          <span>${option.textContent}</span>
        </button>
      `,
    )
    .join("");
}

function enhanceSelect(select) {
  if (select.dataset.enhancedSelect === "true") return;
  select.dataset.enhancedSelect = "true";
  select.classList.add("native-select");

  const wrapper = document.createElement("div");
  wrapper.className = "custom-select";
  wrapper.innerHTML = `
    <button class="select-trigger" type="button" aria-haspopup="listbox" aria-expanded="false">
      <span class="select-value"></span>
      <span class="select-arrow" aria-hidden="true"></span>
    </button>
    <div class="select-menu" role="listbox" hidden></div>
  `;

  select.insertAdjacentElement("afterend", wrapper);
  renderOptions(select, wrapper);

  const trigger = wrapper.querySelector(".select-trigger");
  const menu = wrapper.querySelector(".select-menu");

  trigger.addEventListener("click", () => {
    const willOpen = !wrapper.classList.contains("open");
    qsa(".custom-select.open").forEach(closeDropdown);
    wrapper.classList.toggle("open", willOpen);
    menu.toggleAttribute("hidden", !willOpen);
    trigger.setAttribute("aria-expanded", String(willOpen));
  });

  menu.addEventListener("click", (event) => {
    const option = event.target.closest("[data-value]");
    if (!option) return;
    select.value = option.dataset.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    renderOptions(select, wrapper);
    closeDropdown(wrapper);
  });

  select.addEventListener("change", () => renderOptions(select, wrapper));
  new MutationObserver(() => renderOptions(select, wrapper)).observe(select, { childList: true });
}

export function initCustomSelects() {
  qsa("select").forEach(enhanceSelect);

  document.addEventListener("click", (event) => {
    if (event.target.closest(".custom-select")) return;
    qsa(".custom-select.open").forEach(closeDropdown);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    qsa(".custom-select.open").forEach(closeDropdown);
  });
}
