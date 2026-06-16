const GRID_SIZE = 100;
const TOTAL = GRID_SIZE * GRID_SIZE;
const INK = "#111111";
const PAPER = "#f7f7f4";
const MID = "#6b6b66";
const SOFT = "#c9c9c2";
const KEY_HSL = { h: 90, s: 72, l: 67 };
const KEY_STRONG_HSL = { h: 109, s: 73, l: 56 };

const MOOD_RANGES = {
  "기쁨": [{ h: [48, 64], s: [54, 88], l: [58, 88] }],
  "슬픔": [{ h: [232, 268], s: [28, 58], l: [24, 58] }],
  "분노": [{ h: [350, 380], s: [62, 94], l: [34, 64] }],
  "불안": [{ h: [270, 318], s: [46, 86], l: [34, 68] }],
  "평온": [{ h: [166, 196], s: [20, 52], l: [44, 82] }],
  "설렘": [
    { h: [342, 360], s: [52, 88], l: [58, 86] },
    { h: [0, 18], s: [54, 90], l: [58, 84] },
  ],
  "피곤": [
    { h: [28, 42], s: [6, 18], l: [30, 62] },
    { h: [210, 238], s: [12, 30], l: [30, 58] },
  ],
  "집중": [{ h: [198, 228], s: [34, 66], l: [24, 54] }],
  "혼란": [
    { h: [345, 390], s: [35, 80], l: [35, 78] },
    { h: [170, 225], s: [35, 74], l: [35, 76] },
    { h: [285, 340], s: [35, 78], l: [35, 74] },
  ],
  "만족": [{ h: [26, 46], s: [42, 76], l: [48, 80] }],
  "외로움": [{ h: [214, 242], s: [12, 36], l: [32, 66] }],
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
  { h: [195, 250], s: [26, 58], l: [34, 76] },
  { h: [50, 70], s: [34, 70], l: [46, 82] },
  { h: [335, 380], s: [30, 66], l: [38, 76] },
  { h: [72, 118], s: [20, 46], l: [38, 76] },
  { h: [270, 320], s: [28, 62], l: [36, 74] },
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
    const amount = role === "state" ? 0.12 : 0.08;
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

function fillDiamond(grid, cx, cy, radius, color = INK) {
  return grid.map((cell) => {
    return Math.abs(cell.x - cx) + Math.abs(cell.y - cy) <= radius ? { ...cell, active: true, color } : cell;
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

function driftBandOffset(cell, direction, maxShift, bands) {
  const axis = direction === "LEFT" || direction === "RIGHT" ? cell.x : cell.y;
  const ratio = axis / (GRID_SIZE - 1);
  const band = Math.min(bands - 1, Math.floor(ratio * bands));
  const bandRatio = bands <= 1 ? 1 : band / (bands - 1);
  const eased = bandRatio * bandRatio * (3 - 2 * bandRatio);
  return Math.round(eased * maxShift);
}

function nearestOpenCell(grid, x, y, maxRadius = 2) {
  for (let radius = 1; radius <= maxRadius; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
        if (!grid[ny * GRID_SIZE + nx].active) return { x: nx, y: ny };
      }
    }
  }
  return null;
}

function writeDriftedCell(next, x, y, cell) {
  const targetX = clamp(Math.round(x), 0, GRID_SIZE - 1);
  const targetY = clamp(Math.round(y), 0, GRID_SIZE - 1);
  const target = next[targetY * GRID_SIZE + targetX];
  if (!target.active) {
    write(next, targetX, targetY, cell.color);
    return;
  }

  const open = nearestOpenCell(next, targetX, targetY);
  if (open) write(next, open.x, open.y, cell.color);
}

function applyGradientDrift(grid, direction, maxShift = 4, bands = 8) {
  const next = emptyGrid();
  const sign = direction === "LEFT" || direction === "UP" ? -1 : 1;
  const active = grid.filter((cell) => cell.active);
  const sorted = active.sort((a, b) => {
    if (direction === "RIGHT") return b.x - a.x;
    if (direction === "LEFT") return a.x - b.x;
    if (direction === "DOWN") return b.y - a.y;
    return a.y - b.y;
  });

  sorted.forEach((cell) => {
    const shift = driftBandOffset(cell, direction, maxShift, bands) * sign;
    const x = direction === "LEFT" || direction === "RIGHT" ? cell.x + shift : cell.x;
    const y = direction === "UP" || direction === "DOWN" ? cell.y + shift : cell.y;
    writeDriftedCell(next, x, y, cell);
  });

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

function applyQuadrantReplication(grid, quadrantIndex) {
  const half = GRID_SIZE / 2;
  const sourceOffsetX = (quadrantIndex % 2) * half;
  const sourceOffsetY = quadrantIndex >= 2 ? half : 0;
  const next = emptyGrid();

  for (let localY = 0; localY < half; localY += 1) {
    for (let localX = 0; localX < half; localX += 1) {
      const source = grid[(sourceOffsetY + localY) * GRID_SIZE + (sourceOffsetX + localX)];
      if (!source.active) continue;
      for (let quadrant = 0; quadrant < 4; quadrant += 1) {
        const x = (quadrant % 2) * half + localX;
        const y = (quadrant >= 2 ? half : 0) + localY;
        write(next, x, y, source.color);
      }
    }
  }

  return next;
}

function applyRadialSymmetry(grid, segments) {
  const next = emptyGrid();
  const center = (GRID_SIZE - 1) / 2;
  grid.forEach((cell) => {
    if (!cell.active) return;
    const dx = cell.x - center;
    const dy = cell.y - center;
    for (let step = 0; step < segments; step += 1) {
      const angle = (Math.PI * 2 * step) / segments;
      const x = Math.round(center + dx * Math.cos(angle) - dy * Math.sin(angle));
      const y = Math.round(center + dx * Math.sin(angle) + dy * Math.cos(angle));
      write(next, x, y, cell.color);
    }
  });
  return next;
}

function joySegmentCount(entry, rng) {
  const digits = numberSignature(entry?.value);
  const complexity = digits.length + Math.min(4, Math.floor(digits.sum / 10)) + (digits.raw.length > 1 ? 1 : 0);
  let index = complexity <= 3 ? 0 : complexity <= 5 ? 1 : complexity <= 8 ? 2 : 3;
  const seedNudge = rng();
  if (seedNudge > 0.92 && index < 3) index += 1;
  if (seedNudge < 0.08 && index > 0) index -= 1;
  return [4, 6, 8, 12][index];
}

function activeCountInQuadrant(grid, quadrantIndex) {
  const half = GRID_SIZE / 2;
  const sourceOffsetX = (quadrantIndex % 2) * half;
  const sourceOffsetY = quadrantIndex >= 2 ? half : 0;
  let count = 0;

  for (let localY = 0; localY < half; localY += 1) {
    for (let localX = 0; localX < half; localX += 1) {
      if (grid[(sourceOffsetY + localY) * GRID_SIZE + (sourceOffsetX + localX)].active) count += 1;
    }
  }

  return count;
}

function pickRestQuadrant(grid, preferredIndex) {
  const preferredCount = activeCountInQuadrant(grid, preferredIndex);
  if (preferredCount > 0) return preferredIndex;

  return [0, 1, 2, 3].reduce((best, current) => {
    return activeCountInQuadrant(grid, current) > activeCountInQuadrant(grid, best) ? current : best;
  }, preferredIndex);
}

function activeCount(grid) {
  return grid.reduce((count, cell) => count + (cell.active ? 1 : 0), 0);
}

function applyFrameCut(grid, cx, cy, radius, invert = false) {
  return grid.map((cell) => {
    const inside = Math.hypot(cell.x - cx, cell.y - cy) <= radius;
    const keep = invert ? !inside : inside;
    return keep ? cell : { ...cell, active: false, color: PAPER };
  });
}

function fillSquare(grid, cx, cy, radius, color = INK) {
  return grid.map((cell) => {
    return Math.abs(cell.x - cx) <= radius && Math.abs(cell.y - cy) <= radius ? { ...cell, active: true, color } : cell;
  });
}

function applyRestCrop(grid, shape, cx, cy, radius) {
  const bandWidth = Math.max(10, Math.round(radius * 1.25));
  return grid.map((cell) => {
    let inside = false;
    if (shape === "circle") inside = Math.hypot(cell.x - cx, cell.y - cy) <= radius;
    else if (shape === "diamond") inside = Math.abs(cell.x - cx) + Math.abs(cell.y - cy) <= radius;
    else if (shape === "square") inside = Math.abs(cell.x - cx) <= radius && Math.abs(cell.y - cy) <= radius;
    else if (shape === "band-horizontal") inside = Math.abs(cell.y - cy) <= bandWidth;
    else inside = Math.abs(cell.x - cx) <= bandWidth;
    return inside ? cell : { ...cell, active: false, color: PAPER };
  });
}

function fillRestBase(grid, shape, cx, cy, radius, color) {
  if (shape === "diamond") return fillDiamond(grid, cx, cy, radius, color);
  if (shape === "square") return fillSquare(grid, cx, cy, Math.max(8, Math.round(radius * 0.72)), color);
  if (shape === "band-horizontal") return fillLine(grid, { x: 0, y: cy }, { x: GRID_SIZE, y: cy }, Math.max(8, radius), color);
  if (shape === "band-vertical") return fillLine(grid, { x: cx, y: 0 }, { x: cx, y: GRID_SIZE }, Math.max(8, radius), color);
  return fillCircle(grid, cx, cy, radius, color);
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
  return applyGradientDrift(next, ["UP", "DOWN", "LEFT", "RIGHT"][Math.floor(rng() * 4)], 3 + Math.floor(rng() * 3), 8);
}

function applyRest(grid, entry, rng, color, dateKey) {
  const digits = digitsFromValue(entry.value);
  const dateRng = createRng(`${dateKey}|rest|${entry.category}`);
  const mode = dateRng() < 0.6 ? "echo" : "crop";
  const preferredQuadrant = Math.floor(dateRng() * 4);
  const cropShapes = ["circle", "diamond", "square", "band-horizontal", "band-vertical"];
  const cropShape = cropShapes[Math.floor(dateRng() * cropShapes.length)];
  const half = GRID_SIZE / 2;
  const offsetX = (preferredQuadrant % 2) * half;
  const offsetY = preferredQuadrant >= 2 ? half : 0;
  const radius = mode === "echo" ? 7 + Math.min(13, digits.length * 3) : 18 + Math.min(20, digits.length * 4);
  const localX = mapWithUnit(digits.lastTwo, entry.unit, "rest-x", mode === "echo" ? 10 : 18, mode === "echo" ? 39 : 82);
  const localY = mapWithUnit((digits.number + 53) % 100, entry.unit, "rest-y", mode === "echo" ? 10 : 18, mode === "echo" ? 39 : 82);
  const cx = mode === "echo" ? offsetX + localX : localX;
  const cy = mode === "echo" ? offsetY + localY : localY;
  const hasBase = grid.some((cell) => cell.active);
  const base = hasBase ? grid : fillRestBase(grid, cropShape, cx, cy, radius, color);

  if (mode === "echo") return applyQuadrantReplication(base, pickRestQuadrant(base, preferredQuadrant));

  const cropped = applyRestCrop(base, cropShape, cx, cy, radius);
  const croppedCount = activeCount(cropped);
  if (!croppedCount) return base;
  if (hasBase && croppedCount < activeCount(base) * 0.18) return applyStepSampler(base, 31 + Math.floor(rng() * 8), color);
  return cropped;
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

function applyMood(grid, entry, rng) {
  const mood = entry.mood;
  if (!mood) return grid;
  if (mood === "평온" || mood === "차분함") return applyMirror(grid, "vertical");
  if (mood === "슬픔") return applyGradientDrift(applyFrameCut(grid, 50, 58, 42, false), "DOWN", 4, 10);
  if (mood === "분노") return applyFlowDistort(applyStepSampler(grid, 18 + Math.floor(rng() * 7), MID), 4, 0.32);
  if (mood === "기쁨") return applyRadialSymmetry(grid, joySegmentCount(entry, rng));
  if (mood === "설렘") return applyStepSampler(applyMirror(grid, rng() > 0.5 ? "vertical" : "horizontal"), 28 + Math.floor(rng() * 12), SOFT);
  if (mood === "피곤" || mood === "피곤함") return applyGradientDrift(grid, "DOWN", 3, 8);
  if (mood === "집중") return applyGradientDrift(grid, rng() > 0.5 ? "UP" : "RIGHT", 4, 9);
  if (mood === "불안") return applyFlowDistort(grid, 7, 0.21);
  if (mood === "혼란" || mood === "복잡함") return applyStepSampler(grid, 24 + Math.floor(rng() * 10), MID);
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
    else if (entry.category === "휴식") grid = applyRest(grid, entry, rng, primaryColor, dateKey);
    else if (entry.category === "상태") grid = applyState(grid, entry, rng, primaryColor);
    grid = applyMood(grid, entry, rng);
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
