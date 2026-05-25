import { compactGrid, expandGrid, generateGrid, renderGridToCanvas } from "./graphics/pixelRules.js?v=6";

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

export function downloadOutput(output) {
  const canvas = document.createElement("canvas");
  renderOutputToCanvas(output, canvas, 1000);
  const link = document.createElement("a");
  const safeName = (output.name || `daily-output-${output.dateKey}`).replace(/[^\w가-힣.-]+/g, "-");
  link.download = `${safeName}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
