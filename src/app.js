import { initCalendarArchive } from "./components/calendarArchive.js?v=8";
import { initCategorySelector } from "./components/categorySelector.js?v=8";
import { initComposer } from "./components/composer.js?v=8";
import { initCustomSelects } from "./components/customSelect.js?v=8";
import { initDayLifecycle } from "./components/dayLifecycle.js?v=8";
import { initEntriesList } from "./components/entriesList.js?v=8";
import { initNavigation } from "./components/navigation.js?v=8";
import { initProfile } from "./components/profile.js?v=8";
import { initPreview } from "./components/preview.js?v=8";

initNavigation();
initDayLifecycle();
initCategorySelector();
initCustomSelects();
initComposer();
initEntriesList();
initPreview();
initCalendarArchive();
initProfile();

const splashLogo = document.querySelector(".splash-logo");
const splashImage = document.querySelector(".splash-logo img");

if (splashLogo && splashImage?.dataset.logoSrc) {
  fetch(splashImage.dataset.logoSrc, { method: "HEAD" })
    .then((response) => {
      if (!response.ok) return;
      splashImage.src = splashImage.dataset.logoSrc;
      splashLogo.classList.add("has-logo");
    })
    .catch(() => {});
}

window.setTimeout(() => {
  document.querySelector("#splash-screen")?.classList.add("loaded");
}, 1180);
