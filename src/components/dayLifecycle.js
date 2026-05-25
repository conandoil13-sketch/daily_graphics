import { createOutput } from "../outputService.js?v=8";
import {
  getEntriesByDate,
  getKoreaTodayKey,
  saveOutput,
  setActiveDateKey,
  state,
} from "../state.js?v=8";

function finalizeDate(dateKey, name) {
  const entries = getEntriesByDate(dateKey);
  const output = createOutput(entries, dateKey, name);
  if (!output) return false;
  saveOutput(output);
  return true;
}

function finalizeStaleDates() {
  const todayKey = getKoreaTodayKey();
  const entryDates = Array.from(new Set(state.entries.map((entry) => entry.dateKey)));
  entryDates.filter((dateKey) => dateKey !== todayKey).forEach(finalizeDate);
  setActiveDateKey(todayKey);
}

export function finishToday(name) {
  return finalizeDate(getKoreaTodayKey(), name);
}

export function initDayLifecycle() {
  finalizeStaleDates();

  setInterval(() => {
    const todayKey = getKoreaTodayKey();
    if (state.meta.activeDateKey !== todayKey) {
      finalizeDate(state.meta.activeDateKey);
      finalizeStaleDates();
    }
  }, 60000);
}
