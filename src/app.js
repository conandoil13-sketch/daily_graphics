import { initCalendarArchive } from "./components/calendarArchive.js?v=12";
import { initCategorySelector } from "./components/categorySelector.js?v=12";
import { initComposer } from "./components/composer.js?v=12";
import { initCustomSelects } from "./components/customSelect.js?v=12";
import { initDayLifecycle } from "./components/dayLifecycle.js?v=12";
import { initEntriesList } from "./components/entriesList.js?v=12";
import { initNavigation } from "./components/navigation.js?v=12";
import { initProfile } from "./components/profile.js?v=12";
import { initPreview } from "./components/preview.js?v=12";

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
