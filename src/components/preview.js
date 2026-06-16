import { qs } from "../dom.js?v=12";
import { generateGrid, renderGridToCanvas } from "../graphics/pixelRules.js?v=12";
import { getRenderSeed } from "../seed.js?v=12";
import { getKoreaTodayKey, getTodayEntries, subscribe } from "../state.js?v=12";

export function initPreview() {
  const previewCount = qs(".preview-mark strong");
  const canvas = qs("#preview-canvas");

  subscribe(() => {
    const entries = getTodayEntries();
    previewCount.textContent = String(entries.length).padStart(2, "0");
    renderGridToCanvas(generateGrid(entries, getRenderSeed(getKoreaTodayKey())), canvas);
  });
}
