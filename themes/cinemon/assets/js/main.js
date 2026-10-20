import { initAnimations } from "./animations.js";
import { initGalleries } from "./galleries.js";

(function () {
  "use strict";

  /* Native dialog lightboxes */
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-dialog-open]");
    if (opener) {
      e.preventDefault();
      document.getElementById(opener.getAttribute("data-dialog-open"))?.showModal();
      return;
    }
    if (e.target.closest("[data-dialog-close]")) {
      e.target.closest("dialog")?.close();
      return;
    }
    // Click on the backdrop closes
    if (e.target.tagName === "DIALOG") {
      const r = e.target.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        e.target.close();
      }
    }
  });

  initGalleries();
  initAnimations();
})();
