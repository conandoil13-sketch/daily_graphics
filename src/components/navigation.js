import { qsa } from "../dom.js?v=12";
import { setSelectedView, subscribe } from "../state.js?v=12";

const titles = {
  record: "오늘의 기록",
  output: "출력",
  profile: "내정보",
};

export function initNavigation() {
  const tabs = qsa("[data-tab]");
  const views = qsa("[data-view]");
  const headerTitle = document.querySelector(".app-header h1");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setSelectedView(tab.dataset.tab));
  });

  subscribe(({ selectedView }) => {
    tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === selectedView));
    views.forEach((view) => view.classList.toggle("active", view.dataset.view === selectedView));
    headerTitle.textContent = titles[selectedView] || titles.record;
  });
}
