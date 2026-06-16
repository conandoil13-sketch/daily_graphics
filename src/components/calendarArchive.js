import { qs, qsa } from "../dom.js?v=12";
import {
  getKoreaTodayKey,
  getOutputByDate,
  getOutputDates,
  setCalendarView,
  setFocusedDate,
  state,
  subscribe,
} from "../state.js?v=12";
import {
  formatKoreanDate,
  formatTitle,
  getMonthMatrix,
  getWeekDays,
  getWeekdayLabels,
  getYearMonths,
  movePeriod,
  parseDateKey,
  toDateKey,
} from "../calendarModel.js?v=12";
import { downloadOutput, renderOutputToCanvas } from "../outputService.js?v=12";

function outputCount(dateKey) {
  return getOutputByDate(dateKey) ? 1 : 0;
}

function entryCount(dateKey) {
  return getOutputByDate(dateKey)?.entryCount || 0;
}

function weekdayHeader() {
  return getWeekdayLabels()
    .map((label, index) => {
      const weekendClass = index === 0 ? "sunday" : index === 6 ? "saturday" : "";
      return `<div class="calendar-weekday ${weekendClass}">${label}</div>`;
    })
    .join("");
}

function renderDayCell(day, todayKey, selectedKey) {
  const count = outputCount(day.key);
  const weekendClass = day.date.getDay() === 0 ? "sunday" : day.date.getDay() === 6 ? "saturday" : "";
  return `
    <button class="calendar-cell ${weekendClass} ${day.inMonth ? "" : "muted"} ${day.key === todayKey ? "today" : ""} ${day.key === selectedKey ? "selected" : ""}" type="button" data-date="${day.key}">
      <span class="calendar-day">${day.day}</span>
      ${count ? `<span class="output-dot"></span><span class="output-count">${count}</span>` : ""}
    </button>
  `;
}

function renderMonth(todayKey, selectedKey) {
  const days = getMonthMatrix(parseDateKey(state.focusedDateKey));
  return `<div class="calendar-grid month">${weekdayHeader()}${days.map((day) => renderDayCell(day, todayKey, selectedKey)).join("")}</div>`;
}

function renderWeek(todayKey, selectedKey) {
  const days = getWeekDays(parseDateKey(state.focusedDateKey));
  return `<div class="calendar-grid week">${weekdayHeader()}${days.map((day) => renderDayCell(day, todayKey, selectedKey)).join("")}</div>`;
}

function renderYear(todayKey, selectedKey) {
  const months = getYearMonths(parseDateKey(state.focusedDateKey));
  return `
    <div class="calendar-grid year">
      ${months
        .map((month) => {
          const key = toDateKey(month);
          const monthPrefix = key.slice(0, 7);
          const count = getOutputDates().filter((dateKey) => dateKey.startsWith(monthPrefix)).length;
          return `
            <button class="month-cell ${key.slice(0, 7) === todayKey.slice(0, 7) ? "today" : ""} ${key.slice(0, 7) === selectedKey.slice(0, 7) ? "selected" : ""}" type="button" data-date="${key}">
              <strong>${month.getMonth() + 1}월</strong>
              <span>${count} days</span>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderDay(selectedKey) {
  const output = getOutputByDate(selectedKey);
  return `
    <div class="calendar-grid">
      <div class="day-panel">
        <strong>${formatKoreanDate(selectedKey)}</strong>
        <p>${output ? `${output.entryCount}개의 기록이 "${output.name}" 그래픽으로 완결되었습니다.` : "아직 저장된 출력이 없습니다."}</p>
      </div>
    </div>
  `;
}

function renderDetail(selectedKey) {
  const output = getOutputByDate(selectedKey);
  if (!output) {
    return '<p class="empty-state">이 날짜에는 아직 출력된 그래픽이 없습니다.</p>';
  }

  const categories = output.categories.join(" · ");
  return `
    <article class="output-record">
      <div class="output-thumb" aria-hidden="true">
        <canvas class="output-canvas" width="100" height="100" data-output-canvas="${selectedKey}"></canvas>
      </div>
      <div>
        <strong>${output.name || "Daily output"}</strong>
        <span>${output.entryCount} entries / ${categories}</span>
      </div>
      <button class="download-action" type="button" data-download-output="${selectedKey}">PNG 저장</button>
    </article>
  `;
}

function renderOutputCanvases(selectedKey) {
  const output = getOutputByDate(selectedKey);
  if (!output) return;
  qsa("[data-output-canvas]").forEach((canvas) => renderOutputToCanvas(output, canvas, 100));
}

export function initCalendarArchive() {
  const body = qs("#calendar-body");
  const title = qs("#calendar-title");
  const subtitle = qs("#calendar-subtitle");
  const selectedTitle = qs("#selected-output-title");
  const selectedCount = qs("#selected-output-count");
  const selectedDetail = qs("#selected-output-detail");
  const downloadModal = qs("#download-modal");
  const downloadCancelButton = qs("#download-cancel-button");
  const downloadModeButtons = qsa("[data-download-mode]");
  const viewButtons = qsa("[data-calendar-view]");
  const prevButton = qs("[data-calendar-prev]");
  const nextButton = qs("[data-calendar-next]");
  let pendingDownloadOutput = null;

  function closeDownloadModal() {
    downloadModal.classList.add("hidden");
    pendingDownloadOutput = null;
  }

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => setCalendarView(button.dataset.calendarView));
  });

  prevButton.addEventListener("click", () => setFocusedDate(movePeriod(state.focusedDateKey, state.calendarView, -1)));
  nextButton.addEventListener("click", () => setFocusedDate(movePeriod(state.focusedDateKey, state.calendarView, 1)));

  body.addEventListener("click", (event) => {
    const target = event.target.closest("[data-date]");
    if (target) setFocusedDate(target.dataset.date);
  });

  selectedDetail.addEventListener("click", (event) => {
    const target = event.target.closest("[data-download-output]");
    if (!target) return;
    const output = getOutputByDate(target.dataset.downloadOutput);
    if (!output) return;
    pendingDownloadOutput = output;
    downloadModal.classList.remove("hidden");
  });

  downloadCancelButton.addEventListener("click", closeDownloadModal);
  downloadModal.addEventListener("click", (event) => {
    if (event.target === downloadModal) closeDownloadModal();
  });
  downloadModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!pendingDownloadOutput) return;
      downloadOutput(pendingDownloadOutput, button.dataset.downloadMode);
      closeDownloadModal();
    });
  });

  subscribe(({ calendarView, focusedDateKey, selectedDateKey }) => {
    const todayKey = getKoreaTodayKey();

    title.textContent = formatTitle(focusedDateKey, calendarView);
    subtitle.textContent = "대한민국 기준";
    viewButtons.forEach((button) => button.classList.toggle("active", button.dataset.calendarView === calendarView));

    if (calendarView === "year") body.innerHTML = renderYear(todayKey, selectedDateKey);
    else if (calendarView === "week") body.innerHTML = renderWeek(todayKey, selectedDateKey);
    else if (calendarView === "day") body.innerHTML = renderDay(selectedDateKey);
    else body.innerHTML = renderMonth(todayKey, selectedDateKey);

    const count = outputCount(selectedDateKey);
    selectedTitle.textContent = formatKoreanDate(selectedDateKey);
    selectedCount.textContent = `${count} output${count === 1 ? "" : "s"} / ${entryCount(selectedDateKey)} entries`;
    selectedDetail.innerHTML = renderDetail(selectedDateKey);
    renderOutputCanvases(selectedDateKey);
  });
}
