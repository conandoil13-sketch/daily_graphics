import { compactGrid, expandGrid, generateGrid, renderGridToCanvas } from "./graphics/pixelRules.js?v=11";

export function createOutput(entries, dateKey, name) {
  if (!entries.length) return null;
  const grid = generateGrid(entries, dateKey);
  const categories = Array.from(new Set(entries.map((entry) => entry.category)));
  return {
    dateKey,
    name: name || `${dateKey.replaceAll("-", ".")} output`,
    createdAt: new Date().toISOString(),
    entryCount: entries.length,
    categories,
    grid: compactGrid(grid),
  };
}

export function renderOutputToCanvas(output, canvas, size = 1000) {
  renderGridToCanvas(expandGrid(output.grid), canvas, size);
}

function drawTile(ctx, source, x, y, size, rotation = 0) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(source, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function renderDownloadCanvas(output, mode) {
  const canvas = document.createElement("canvas");
  const size = 1000;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const source = document.createElement("canvas");
  renderOutputToCanvas(output, source, size);

  if (mode === "tile-2" || mode === "rotate-2") {
    const tile = size / 2;
    [0, 1, 2, 3].forEach((index) => {
      const x = (index % 2) * tile;
      const y = Math.floor(index / 2) * tile;
      drawTile(ctx, source, x, y, tile, mode === "rotate-2" ? index * 90 : 0);
    });
    return canvas;
  }

  if (mode === "tile-4" || mode === "rotate-4") {
    const tile = size / 4;
    Array.from({ length: 16 }, (_, index) => {
      const x = (index % 4) * tile;
      const y = Math.floor(index / 4) * tile;
      const rotation = mode === "rotate-4" ? ((index % 4) * 90 + Math.floor(index / 4) * 90) % 360 : 0;
      drawTile(ctx, source, x, y, tile, rotation);
    });
    return canvas;
  }

  ctx.drawImage(source, 0, 0);
  return canvas;
}

export function downloadOutput(output, mode = "single") {
  const canvas = renderDownloadCanvas(output, mode);
  const link = document.createElement("a");
  const safeName = (output.name || `daily-output-${output.dateKey}`).replace(/[^\w가-힣.-]+/g, "-");
  const suffix = mode === "single" ? "" : `-${mode}`;
  link.download = `${safeName}${suffix}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
