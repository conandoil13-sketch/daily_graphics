const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date, amount) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

export function addYears(date, amount) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + amount);
  return next;
}

export function startOfWeek(date) {
  return addDays(date, -date.getDay());
}

export function getMonthMatrix(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => {
    const day = addDays(start, index);
    return {
      date: day,
      key: toDateKey(day),
      day: day.getDate(),
      inMonth: day.getMonth() === date.getMonth(),
    };
  });
}

export function getWeekDays(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(start, index);
    return {
      date: day,
      key: toDateKey(day),
      day: day.getDate(),
      inMonth: true,
    };
  });
}

export function getYearMonths(date) {
  return Array.from({ length: 12 }, (_, index) => new Date(date.getFullYear(), index, 1));
}

export function movePeriod(dateKey, view, direction) {
  const date = parseDateKey(dateKey);
  if (view === "year") return toDateKey(addYears(date, direction));
  if (view === "month") return toDateKey(addMonths(date, direction));
  if (view === "week") return toDateKey(addDays(date, direction * 7));
  return toDateKey(addDays(date, direction));
}

export function formatTitle(dateKey, view) {
  const date = parseDateKey(dateKey);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (view === "year") return `${year}년`;
  if (view === "month") return `${year}년 ${month}월`;
  if (view === "week") {
    const start = startOfWeek(date);
    const end = addDays(start, 6);
    return `${start.getMonth() + 1}.${start.getDate()} - ${end.getMonth() + 1}.${end.getDate()}`;
  }
  return `${year}년 ${month}월 ${day}일`;
}

export function formatKoreanDate(dateKey) {
  const date = parseDateKey(dateKey);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAY_LABELS[date.getDay()]}요일`;
}

export function getWeekdayLabels() {
  return WEEKDAY_LABELS;
}
