export const unitsByCategory = {
  "이동": [
    { value: "steps", label: "걸음" },
    { value: "min", label: "분" },
    { value: "m", label: "m" },
    { value: "km", label: "km" },
    { value: "count", label: "횟수" },
  ],
  "식사": [
    { value: "count", label: "횟수" },
    { value: "kcal", label: "칼로리" },
    { value: "fullness", label: "포만감" },
    { value: "min", label: "분" },
    { value: "score", label: "점수" },
  ],
  "대화": [
    { value: "min", label: "분" },
    { value: "sec", label: "초" },
    { value: "count", label: "횟수" },
    { value: "messages", label: "메시지" },
    { value: "people", label: "사람" },
  ],
  "작업": [
    { value: "min", label: "분" },
    { value: "hours", label: "시간" },
    { value: "sessions", label: "세션" },
    { value: "focus", label: "집중도" },
    { value: "tasks", label: "작업수" },
  ],
  "휴식": [
    { value: "min", label: "분" },
    { value: "hours", label: "시간" },
    { value: "days", label: "일" },
    { value: "recovery", label: "회복감" },
    { value: "count", label: "횟수" },
  ],
  "상태": [
    { value: "score", label: "점수" },
    { value: "intensity", label: "강도" },
    { value: "energy", label: "활력" },
    { value: "fatigue", label: "피로도" },
  ],
};

export const inputMetaByCategory = {
  "이동": { label: "수치적 데이터", placeholder: "예: 7324" },
  "식사": { label: "섭취 데이터", placeholder: "예: 2" },
  "대화": { label: "대화 데이터", placeholder: "예: 18" },
  "작업": { label: "작업 데이터", placeholder: "예: 90" },
  "휴식": { label: "휴식 데이터", placeholder: "예: 45" },
  "상태": { label: "상태 데이터", placeholder: "예: 7" },
};

const listeners = new Set();
const ENTRY_STORAGE_KEY = "daily-graphic-entries";
const OUTPUT_STORAGE_KEY = "daily-graphic-outputs";
const META_STORAGE_KEY = "daily-graphic-meta";

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function saveEntries() {
  localStorage.setItem(ENTRY_STORAGE_KEY, JSON.stringify(state.entries));
}

function saveOutputs() {
  localStorage.setItem(OUTPUT_STORAGE_KEY, JSON.stringify(state.outputs));
}

function saveMeta() {
  localStorage.setItem(META_STORAGE_KEY, JSON.stringify(state.meta));
}

export const state = {
  entries: loadJson(ENTRY_STORAGE_KEY, []),
  outputs: loadJson(OUTPUT_STORAGE_KEY, []),
  meta: loadJson(META_STORAGE_KEY, { activeDateKey: getKoreaTodayKey() }),
  selectedCategory: "이동",
  selectedView: "record",
  calendarView: "month",
  focusedDateKey: getKoreaTodayKey(),
  selectedDateKey: getKoreaTodayKey(),
};

export function subscribe(listener) {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export function saveOutput(output) {
  state.outputs = state.outputs.filter((item) => item.dateKey !== output.dateKey).concat(output);
  state.entries = state.entries.filter((entry) => entry.dateKey !== output.dateKey);
  state.selectedDateKey = output.dateKey;
  state.focusedDateKey = output.dateKey;
  state.selectedView = "output";
  saveOutputs();
  saveEntries();
  notify();
}

export function setActiveDateKey(dateKey) {
  state.meta.activeDateKey = dateKey;
  saveMeta();
}

export function notify() {
  listeners.forEach((listener) => listener(state));
}

export function setCategory(category) {
  state.selectedCategory = category;
  notify();
}

export function addEntry(entry) {
  state.entries.push({
    ...entry,
    dateKey: getKoreaTodayKey(),
    createdAt: new Date().toISOString(),
  });
  saveEntries();
  notify();
}

export function resetEntries() {
  const todayKey = getKoreaTodayKey();
  state.entries = state.entries.filter((entry) => entry.dateKey !== todayKey);
  state.selectedCategory = "이동";
  saveEntries();
  notify();
}

export function setSelectedView(view) {
  state.selectedView = view;
  notify();
}

export function setCalendarView(view) {
  state.calendarView = view;
  notify();
}

export function setFocusedDate(dateKey) {
  state.focusedDateKey = dateKey;
  state.selectedDateKey = dateKey;
  notify();
}

export function getPrimaryCategory() {
  const todayEntries = getTodayEntries();
  if (!todayEntries.length) return "none";

  const counts = todayEntries.reduce((memo, entry) => {
    memo[entry.category] = (memo[entry.category] || 0) + 1;
    return memo;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export function getMoodSummary() {
  const latestMood = [...getTodayEntries()].reverse().find((entry) => entry.mood);
  return latestMood ? latestMood.mood : "optional";
}

export function getKoreaTodayKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function getTodayEntries() {
  const todayKey = getKoreaTodayKey();
  return state.entries.filter((entry) => entry.dateKey === todayKey);
}

export function getEntriesByDate(dateKey) {
  return state.entries.filter((entry) => entry.dateKey === dateKey);
}

export function getOutputDates() {
  return Array.from(new Set(state.outputs.map((output) => output.dateKey))).sort();
}

export function getOutputByDate(dateKey) {
  return state.outputs.find((output) => output.dateKey === dateKey) || null;
}
