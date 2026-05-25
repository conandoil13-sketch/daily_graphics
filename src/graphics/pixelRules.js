const GRID_SIZE = 100;
const TOTAL = GRID_SIZE * GRID_SIZE;
const INK = "#111111";
const PAPER = "#f7f7f4";
const MID = "#6b6b66";
const SOFT = "#c9c9c2";
const KEY_HSL = { h: 90, s: 72, l: 67 };
const KEY_STRONG_HSL = { h: 109, s: 73, l: 56 };

const MOOD_RANGES = {
  "기쁨": [{ h: [35, 85], s: [45, 85], l: [55, 88] }],
  "슬픔": [{ h: [205, 245], s: [24, 58], l: [24, 58] }],
  "분노": [{ h: [350, 380], s: [62, 94], l: [34, 64] }],
  "불안": [
    { h: [330, 380], s: [45, 90], l: [35, 70] },
    { h: [250, 290], s: [45, 82], l: [35, 68] },
  ],
  "평온": [{ h: [170, 230], s: [18, 50], l: [42, 82] }],
  "설렘": [
    { h: [330, 360], s: [48, 86], l: [58, 86] },
    { h: [18, 48], s: [52, 88], l: [58, 84] },
  ],
  "피곤": [
    { h: [35, 70], s: [8, 30], l: [28, 62] },
    { h: [210, 250], s: [8, 26], l: [30, 58] },
  ],
  "집중": [
    { h: [185, 220], s: [30, 62], l: [26, 54] },
    { h: [125, 165], s: [24, 52], l: [28, 56] },
  ],
  "혼란": [
    { h: [20, 70], s: [35, 80], l: [35, 78] },
    { h: [170, 225], s: [35, 74], l: [35, 76] },
    { h: [285, 340], s: [35, 78], l: [35, 74] },
  ],
  "만족": [{ h: [58, 118], s: [32, 68], l: [46, 78] }],
  "외로움": [{ h: [200, 235], s: [10, 34], l: [32, 66] }],
  "무감각": [{ h: [0, 360], s: [0, 12], l: [25, 78] }],
  "차분함": [{ h: [170, 230], s: [18, 50], l: [42, 82] }],
  "피곤함": [
    { h: [35, 70], s: [8, 30], l: [28, 62] },
    { h: [210, 250], s: [8, 26], l: [30, 58] },
  ],
  "복잡함": [
    { h: [20, 70], s: [35, 80], l: [35, 78] },
    { h: [170, 225], s: [35, 74], l: [35, 76] },
    { h: [285, 340], s: [35, 78], l: [35, 74] },
  ],
};

const DEFAULT_RANGES = [
  { h: [190, 250], s: [20, 52], l: [36, 78] },
  { h: [25, 65], s: [20, 55], l: [42, 82] },
  { h: [105, 155], s: [18, 48], l: [36, 76] },
];

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed) {
  let state = hashString(seed) || 1;
  return function rng() {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeHue(hue) {
  return ((hue % 360) + 360) % 360;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hslToHex(h, s, l) {
  const hue = normalizeHue(h) / 360;
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;
  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const channel = (t) => {
    let next = t;
    if (next < 0) next += 1;
    if (next > 1) next -= 1;
    if (next < 1 / 6) return p + (q - p) * 6 * next;
    if (next < 1 / 2) return q;
    if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
    return p;
  };
  const rgb = sat === 0 ? [light, light, light] : [channel(hue + 1 / 3), channel(hue), channel(hue - 1 / 3)];
  return `#${rgb.map((value) => Math.round(value * 255).toString(16).padStart(2, "0")).join("")}`;
}

function pickRange(mood, rng) {
  const ranges = MOOD_RANGES[mood] || DEFAULT_RANGES;
  return ranges[Math.floor(rng() * ranges.length)];
}

function numberSignature(value) {
  const raw = String(value || "0").replace(/\D/g, "") || "0";
  const digits = raw.split("").map(Number);
  return {
    raw,
    sum: digits.reduce((total, digit) => total + digit, 0),
    lastTwo: Number(raw.slice(-2)),
    length: raw.length,
  };
}

function unitNudge(unit, seed = "") {
  const hash = hashString(`${unit || "unitless"}|${seed}`);
  return {
    position: (hash % 5) - 2,
    color: ((hash >>> 3) % 7) - 3,
  };
}

function colorForEntry(entry, dateKey, role) {
  const sig = numberSignature(entry.value);
  const rng = createRng(`${dateKey}|color|${entry.category}|${entry.value}|${entry.mood || "neutral"}|${role}`);
  const nudge = unitNudge(entry.unit, role);
  const range = pickRange(entry.mood, rng);
  const roleBias = {
    line: { s: 8, l: -18 },
    mass: { s: 4, l: 6 },
    accent: { s: 14, l: -2 },
    structure: { s: -8, l: -12 },
    pale: { s: -16, l: 18 },
    state: { s: 18, l: -8 },
  }[role] || { s: 0, l: 0 };

  const hSpan = range.h[1] - range.h[0];
  const sSpan = range.s[1] - range.s[0];
  const lSpan = range.l[1] - range.l[0];
  let hue = range.h[0] + hSpan * ((sig.lastTwo + nudge.color + rng() * 17) % 100) / 100;
  let saturation = range.s[0] + sSpan * ((sig.sum + nudge.color + rng() * 11) % 30) / 30 + roleBias.s;
  let lightness = range.l[0] + lSpan * ((sig.length + Math.abs(nudge.color) + rng() * 5) % 8) / 8 + roleBias.l;

  if (role === "accent" || role === "state") {
    const key = role === "state" ? KEY_STRONG_HSL : KEY_HSL;
    const amount = role === "state" ? 0.18 : 0.12;
    hue = hue * (1 - amount) + key.h * amount;
    saturation = saturation * (1 - amount) + key.s * amount;
    lightness = lightness * (1 - amount) + key.l * amount;
  }

  return hslToHex(hue, saturation, lightness);
}

function emptyGrid() {
  return Array.from({ length: TOTAL }, (_, index) => ({
    x: index % GRID_SIZE,
    y: Math.floor(index / GRID_SIZE),
    active: false,
    color: PAPER,
  }));
}

function cloneGrid(grid) {
  return grid.map((cell) => ({ ...cell }));
}

function write(grid, x, y, color = INK) {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
  grid[y * GRID_SIZE + x] = { x, y, active: true, color };
}

function distancePointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const denom = dx * dx + dy * dy;
  if (!denom) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / denom));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function fillLine(grid, start, end, thickness, color = INK) {
  return grid.map((cell) => {
    const dist = distancePointToSegment(cell.x + 0.5, cell.y + 0.5, start.x, start.y, end.x, end.y);
    return dist <= thickness / 2 ? { ...cell, active: true, color } : cell;
  });
}

function fillCircle(grid, cx, cy, radius, color = INK) {
  return grid.map((cell) => {
    const dx = cell.x - cx;
    const dy = cell.y - cy;
    return dx * dx + dy * dy <= radius * radius ? { ...cell, active: true, color } : cell;
  });
}

function fillPolygon(grid, points, color = INK) {
  function inside(x, y) {
    let hit = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
      const a = points[i];
      const b = points[j];
      const cross = a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / ((b.y - a.y) || 0.00001) + a.x;
      if (cross) hit = !hit;
    }
    return hit;
  }

  return grid.map((cell) => (inside(cell.x + 0.5, cell.y + 0.5) ? { ...cell, active: true, color } : cell));
}

function applyModuloMesh(grid, gap, color = INK) {
  return grid.map((cell) => (cell.x % gap === 0 || cell.y % gap === 0 ? { ...cell, active: true, color } : cell));
}

function applyStepSampler(grid, step, color = INK) {
  return grid.map((cell, index) => (index % step === 0 ? { ...cell, active: true, color } : cell));
}

function applyVectorDrift(grid, direction) {
  const next = emptyGrid();
  if (direction === "DOWN" || direction === "UP") {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const active = grid.filter((cell) => cell.x === x && cell.active);
      active.forEach((cell, index) => {
        const y = direction === "DOWN" ? GRID_SIZE - 1 - index : index;
        write(next, x, y, cell.color);
      });
    }
  } else {
    for (let y = 0; y < GRID_SIZE; y += 1) {
      const active = grid.filter((cell) => cell.y === y && cell.active);
      active.forEach((cell, index) => {
        const x = direction === "RIGHT" ? GRID_SIZE - 1 - index : index;
        write(next, x, y, cell.color);
      });
    }
  }
  return next;
}

function applyFlowDistort(grid, strength, frequency) {
  const next = emptyGrid();
  grid.forEach((cell) => {
    if (!cell.active) return;
    const x = Math.round((cell.x + Math.sin(cell.y * frequency) * strength + GRID_SIZE) % GRID_SIZE);
    const y = Math.round((cell.y + Math.cos(cell.x * frequency) * strength + GRID_SIZE) % GRID_SIZE);
    write(next, x, y, cell.color);
  });
  return next;
}

function applyMirror(grid, axis) {
  const next = cloneGrid(grid);
  grid.forEach((cell) => {
    if (!cell.active) return;
    const x = axis === "vertical" ? GRID_SIZE - 1 - cell.x : cell.x;
    const y = axis === "horizontal" ? GRID_SIZE - 1 - cell.y : cell.y;
    write(next, x, y, cell.color);
  });
  return next;
}

function applyFrameCut(grid, cx, cy, radius, invert = false) {
  return grid.map((cell) => {
    const inside = Math.hypot(cell.x - cx, cell.y - cy) <= radius;
    const keep = invert ? !inside : inside;
    return keep ? cell : { ...cell, active: false, color: PAPER };
  });
}

function digitsFromValue(value) {
  const raw = String(value || "0").replace(/\D/g, "") || "0";
  return {
    raw,
    number: Number(raw),
    lastTwo: Number(raw.slice(-2)),
    length: raw.length,
  };
}

function mapLastTwo(lastTwo, min = 6, max = 93) {
  return Math.round(min + (lastTwo / 99) * (max - min));
}

function mapWithUnit(lastTwo, unit, seed, min = 6, max = 93) {
  return Math.max(3, Math.min(96, mapLastTwo(lastTwo, min, max) + unitNudge(unit, seed).position));
}

function layerCount(length) {
  return Math.max(1, Math.min(5, Math.ceil(length / 2)));
}

function randomPoint(rng, margin = 8) {
  return {
    x: Math.round(margin + rng() * (GRID_SIZE - margin * 2)),
    y: Math.round(margin + rng() * (GRID_SIZE - margin * 2)),
  };
}

function applyMovement(grid, entry, rng, color) {
  const digits = digitsFromValue(entry.value);
  let next = grid;
  const layers = layerCount(digits.length);
  const anchor = mapWithUnit(digits.lastTwo, entry.unit, "movement");
  for (let layer = 0; layer < layers; layer += 1) {
    const offset = Math.round((rng() - 0.5) * 16);
    const thickness = 1 + Math.floor(rng() * 3);
    const vertical = rng() > 0.5;
    const p = Math.max(3, Math.min(96, anchor + offset));
    next = vertical
      ? fillLine(next, { x: p, y: 0 }, { x: p, y: GRID_SIZE }, thickness, color)
      : fillLine(next, { x: 0, y: p }, { x: GRID_SIZE, y: p }, thickness, color);
  }
  return next;
}

function applyMeal(grid, entry, rng, color, secondaryColor) {
  const digits = digitsFromValue(entry.value);
  const center = {
    x: mapWithUnit(digits.lastTwo, entry.unit, "meal-x"),
    y: mapWithUnit((digits.number + 37) % 100, entry.unit, "meal-y"),
  };
  const radius = 6 + Math.min(18, digits.length * 3 + Math.floor(rng() * 5));
  let next = fillCircle(grid, center.x, center.y, radius, color);
  if (digits.length > 2) {
    const points = Array.from({ length: 4 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 4 + rng() * 0.45;
      const r = radius + 6 + rng() * 8;
      return {
        x: Math.round(center.x + Math.cos(angle) * r),
        y: Math.round(center.y + Math.sin(angle) * r),
      };
    });
    next = fillPolygon(next, points, secondaryColor);
  }
  return next;
}

function applyConversation(grid, entry, rng, color) {
  const digits = digitsFromValue(entry.value);
  const start = randomPoint(rng, 10);
  const end = {
    x: mapWithUnit(digits.lastTwo, entry.unit, "conversation-x"),
    y: mapWithUnit((digits.number * 7) % 100, entry.unit, "conversation-y"),
  };
  let next = fillLine(grid, start, end, 1 + layerCount(digits.length), color);
  next = applyMirror(next, rng() > 0.5 ? "vertical" : "horizontal");
  return next;
}

function applyWork(grid, entry, rng, color, secondaryColor) {
  const digits = digitsFromValue(entry.value);
  const gap = Math.max(6, Math.min(20, 7 + (digits.lastTwo % 12) + unitNudge(entry.unit, "work-gap").position));
  let next = applyModuloMesh(grid, gap, color);
  if (digits.length > 2) next = applyStepSampler(next, 9 + Math.floor(rng() * 14), secondaryColor);
  return applyVectorDrift(next, ["UP", "DOWN", "LEFT", "RIGHT"][Math.floor(rng() * 4)]);
}

function applyRest(grid, entry, rng, color) {
  const digits = digitsFromValue(entry.value);
  const cx = mapWithUnit(digits.lastTwo, entry.unit, "rest-x");
  const cy = mapWithUnit((digits.number + 53) % 100, entry.unit, "rest-y");
  const radius = 18 + Math.min(22, digits.length * 4);
  const base = grid.some((cell) => cell.active) ? grid : fillCircle(grid, cx, cy, radius, color);
  return applyFrameCut(base, cx, cy, radius, rng() > 0.45);
}

function applyState(grid, entry, rng, color) {
  const digits = digitsFromValue(entry.value);
  const strength = 1 + Math.min(9, Math.max(1, digits.number || 1)) + unitNudge(entry.unit, "state-strength").position * 0.15;
  const distorted = applyFlowDistort(grid, strength, 0.08 + rng() * 0.16);
  const step = Math.max(13, 34 - strength * 2);
  return distorted.map((cell, index) => {
    if (cell.active) return cell;
    return index % step === 0 && rng() > 0.42 ? { ...cell, active: true, color } : cell;
  });
}

function applyMood(grid, mood, rng) {
  if (!mood) return grid;
  if (mood === "평온" || mood === "차분함") return applyMirror(grid, "vertical");
  if (mood === "슬픔") return applyVectorDrift(applyFrameCut(grid, 50, 58, 42, false), "DOWN");
  if (mood === "분노") return applyFlowDistort(applyStepSampler(grid, 11 + Math.floor(rng() * 5), MID), 4, 0.32);
  if (mood === "기쁨") return applyMirror(applyMirror(grid, "vertical"), "horizontal");
  if (mood === "설렘") return applyStepSampler(applyMirror(grid, rng() > 0.5 ? "vertical" : "horizontal"), 19 + Math.floor(rng() * 10), SOFT);
  if (mood === "피곤" || mood === "피곤함") return applyVectorDrift(grid, "DOWN");
  if (mood === "집중") return applyVectorDrift(grid, rng() > 0.5 ? "UP" : "RIGHT");
  if (mood === "불안") return applyFlowDistort(grid, 7, 0.21);
  if (mood === "혼란" || mood === "복잡함") return applyStepSampler(grid, 17 + Math.floor(rng() * 8), MID);
  if (mood === "만족") return applyMirror(grid, "horizontal");
  if (mood === "외로움") return applyFrameCut(grid, 50, 50, 36, false);
  if (mood === "무감각") return grid.map((cell) => (cell.active ? { ...cell, color: MID } : cell));
  return grid;
}

export function generateGrid(entries, dateKey) {
  let grid = emptyGrid();
  entries.forEach((entry, index) => {
    const rng = createRng(`${dateKey}|${index}|${entry.category}|${entry.value}|${entry.mood || ""}`);
    const primaryColor = colorForEntry(entry, dateKey, {
      "이동": "line",
      "식사": "mass",
      "대화": "accent",
      "작업": "structure",
      "휴식": "pale",
      "상태": "state",
    }[entry.category]);
    const secondaryColor = colorForEntry(entry, dateKey, "accent");
    if (entry.category === "이동") grid = applyMovement(grid, entry, rng, primaryColor);
    else if (entry.category === "식사") grid = applyMeal(grid, entry, rng, primaryColor, secondaryColor);
    else if (entry.category === "대화") grid = applyConversation(grid, entry, rng, primaryColor);
    else if (entry.category === "작업") grid = applyWork(grid, entry, rng, primaryColor, secondaryColor);
    else if (entry.category === "휴식") grid = applyRest(grid, entry, rng, primaryColor);
    else if (entry.category === "상태") grid = applyState(grid, entry, rng, primaryColor);
    grid = applyMood(grid, entry.mood, rng);
  });
  return grid;
}

export function renderGridToCanvas(grid, canvas, size = 1000) {
  const ctx = canvas.getContext("2d");
  const pixel = size / GRID_SIZE;
  canvas.width = size;
  canvas.height = size;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, size, size);
  grid.forEach((cell) => {
    if (!cell.active) return;
    ctx.fillStyle = cell.color;
    ctx.fillRect(cell.x * pixel, cell.y * pixel, pixel, pixel);
  });
}

export function compactGrid(grid) {
  return grid.filter((cell) => cell.active).map(({ x, y, color }) => [x, y, color]);
}

export function expandGrid(compactCells) {
  const grid = emptyGrid();
  compactCells.forEach(([x, y, color]) => write(grid, x, y, color));
  return grid;
}
