/*
 * Vanilla-JS replacement for Webflow's legacy IX1 `data-ix` triggers.
 * Recreates: fade-in-on-load, fade-in-on-load-2, fade-in-on-load-3
 * (staggered page-load fades) and fade-in-on-scroll (fires once when an
 * element scrolls into view). Pairs with css/interactions.css.
 */
(function () {
  "use strict";

  function reveal(el, delay) {
    window.setTimeout(function () {
      el.classList.add("ix-visible");
    }, delay || 0);
  }

  function initLoadTriggers() {
    document.querySelectorAll('[data-ix="fade-in-on-load"]').forEach(function (el) {
      reveal(el, 0);
    });
    document.querySelectorAll('[data-ix="fade-in-on-load-2"]').forEach(function (el) {
      reveal(el, 200);
    });
    document.querySelectorAll('[data-ix="fade-in-on-load-3"]').forEach(function (el) {
      reveal(el, 400);
    });
  }

  function initScrollTriggers() {
    var elements = document.querySelectorAll('[data-ix="fade-in-on-scroll"]');
    if (!elements.length) return;

    if (!("IntersectionObserver" in window)) {
      elements.forEach(function (el) {
        el.classList.add("ix-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("ix-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  function init() {
    initLoadTriggers();
    initScrollTriggers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
