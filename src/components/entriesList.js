import { qs } from "../dom.js?v=12";
import { getTodayEntries, subscribe } from "../state.js?v=12";

function entryTemplate(entry, index) {
  return `
    <article class="entry-card">
      <div>
        <strong>${entry.category}</strong>
        <span>${entry.value} ${entry.unit}${entry.mood ? ` / ${entry.mood}` : ""}</span>
      </div>
      <div class="entry-index">${String(index + 1).padStart(2, "0")}</div>
    </article>
  `;
}

export function initEntriesList() {
  const entriesNode = qs("#entries");
  const emptyStateLabel = qs("#empty-state-label");

  subscribe(() => {
    const entries = getTodayEntries();

    if (!entries.length) {
      entriesNode.innerHTML = '<p class="empty-state">행위, 수치, 선택 감정을 입력하면 이곳에 쌓입니다.</p>';
      emptyStateLabel.textContent = "대기 중";
      return;
    }

    entriesNode.innerHTML = entries
      .map((entry, index) => entryTemplate(entry, index))
      .reverse()
      .join("");
    emptyStateLabel.textContent = "기록됨";
  });
}
