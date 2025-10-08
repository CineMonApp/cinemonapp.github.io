/* Description: Custom JS file - Vanilla JavaScript */

(function () {
  "use strict";

  /* Navbar is now always fixed with consistent styling - no scroll handling needed */

  // Smooth scrolling for page-scroll links
  document.addEventListener("click", function (e) {
    if (e.target.matches("a.page-scroll") || e.target.closest("a.page-scroll")) {
      const anchor = e.target.closest("a.page-scroll") || e.target;
      const href = anchor.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  });

  // Offcanvas menu toggle
  document.addEventListener("click", function (e) {
    if (
      e.target.matches('[data-toggle="offcanvas"]') ||
      e.target.closest('[data-toggle="offcanvas"]') ||
      (e.target.matches(".navbar-nav li a:not(.dropdown-toggle)") &&
        window.innerWidth < 992)
    ) {
      const offcanvas = document.querySelector(".offcanvas-collapse");
      if (offcanvas) {
        offcanvas.classList.toggle("open");
      }
    }
  });

  // Dropdown hover in desktop mode
  function toggleDropdown(e) {
    const dropdown = e.target.closest(".dropdown");
    if (!dropdown) return;

    const menu = dropdown.querySelector(".dropdown-menu");
    const toggle = dropdown.querySelector('[data-toggle="dropdown"]');

    setTimeout(
      function () {
        const shouldOpen = e.type !== "click" && dropdown.matches(":hover");
        if (menu) {
          menu.classList.toggle("show", shouldOpen);
        }
        dropdown.classList.toggle("show", shouldOpen);
        if (toggle) {
          toggle.setAttribute("aria-expanded", shouldOpen);
        }
      },
      e.type === "mouseleave" ? 300 : 0,
    );
  }

  document.body.addEventListener("mouseenter", function (e) {
    if (e.target.closest(".dropdown")) toggleDropdown(e);
  }, true);

  document.body.addEventListener("mouseleave", function (e) {
    if (e.target.closest(".dropdown")) toggleDropdown(e);
  }, true);

  document.body.addEventListener("click", function (e) {
    if (e.target.matches(".dropdown-menu a")) {
      toggleDropdown(e);
    }
  });

  /* Card Slider - Swiper */
  if (typeof Swiper !== "undefined") {
    var cardSlider = new Swiper(".card-slider", {
      autoplay: {
        delay: 15000,
        disableOnInteraction: false,
      },
      loop: true,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      slidesPerView: 3,
      spaceBetween: 70,
      breakpoints: {
        767: {
          slidesPerView: 1,
        },
        991: {
          slidesPerView: 2,
          spaceBetween: 40,
        },
      },
    });

    /* Text Slider - Swiper */
    var textSlider = new Swiper(".text-slider", {
      autoplay: {
        delay: 15000,
        disableOnInteraction: false,
      },
      loop: true,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
    });
  }

  /* Details Lightbox - Native Dialog */
  document.addEventListener("click", function (e) {
    const trigger = e.target.closest("[data-dialog-open]");
    if (trigger) {
      e.preventDefault();
      const dialogId = trigger.getAttribute("data-dialog-open");
      const dialog = document.getElementById(dialogId);
      if (dialog) {
        dialog.showModal();
      }
    }

    const closeBtn = e.target.closest("[data-dialog-close]");
    if (closeBtn) {
      const dialog = closeBtn.closest("dialog");
      if (dialog) {
        dialog.close();
      }
    }
  });

  // Close dialog when clicking on backdrop
  document.addEventListener("click", function (e) {
    if (e.target.tagName === "DIALOG") {
      const rect = e.target.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        e.target.close();
      }
    }
  });

  // Close dialog on Escape key (native behavior, but keeping for consistency)
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll("dialog[open]").forEach(function (dialog) {
        dialog.close();
      });
    }
  });

  /* Move Form Fields Label When User Types */
  document.addEventListener("keyup", function (e) {
    if (e.target.matches("input, textarea")) {
      if (e.target.value !== "") {
        e.target.classList.add("notEmpty");
      } else {
        e.target.classList.remove("notEmpty");
      }
    }
  });

  /* Back To Top Button */
  const backToTop = document.createElement("a");
  backToTop.href = "#body";
  backToTop.className = "back-to-top page-scroll";
  backToTop.textContent = "Back to Top";
  document.body.prepend(backToTop);

  const amountScrolled = 700;
  let backToTopVisible = false;

  window.addEventListener("scroll", function () {
    if (window.pageYOffset > amountScrolled) {
      if (!backToTopVisible) {
        backToTop.style.display = "block";
        setTimeout(() => (backToTop.style.opacity = "1"), 10);
        backToTopVisible = true;
      }
    } else {
      if (backToTopVisible) {
        backToTop.style.opacity = "0";
        setTimeout(() => (backToTop.style.display = "none"), 500);
        backToTopVisible = false;
      }
    }
  });

  /* Removes Long Focus On Buttons */
  document.addEventListener("mouseup", function (e) {
    if (e.target.matches(".button, a, button")) {
      e.target.blur();
    }
  });
})();
