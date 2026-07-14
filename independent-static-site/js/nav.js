/*
 * Vanilla-JS replacement for Webflow's nav (.w-nav) and dropdown (.w-dropdown)
 * runtime controllers. Drives the exact same CSS hooks webflow.css already
 * styles (`data-nav-menu-open`, `.w--open`) so no CSS changes were needed.
 */
(function () {
  "use strict";

  function initNavs() {
    var navs = document.querySelectorAll(".w-nav");
    navs.forEach(function (nav) {
      var menu = nav.querySelector(".w-nav-menu");
      var button = nav.querySelector(".w-nav-button");
      if (!menu || !button) return;

      var noScroll = nav.getAttribute("data-no-scroll") === "1";

      button.setAttribute("role", button.getAttribute("role") || "button");
      button.setAttribute("aria-label", button.getAttribute("aria-label") || "Menu");
      button.setAttribute("aria-expanded", "false");
      if (!button.hasAttribute("tabindex")) button.setAttribute("tabindex", "0");

      function isOpen() {
        return menu.hasAttribute("data-nav-menu-open");
      }

      function open() {
        menu.setAttribute("data-nav-menu-open", "");
        button.classList.add("w--open");
        button.setAttribute("aria-expanded", "true");
        if (noScroll) document.body.style.overflow = "hidden";
      }

      function close() {
        menu.removeAttribute("data-nav-menu-open");
        button.classList.remove("w--open");
        button.setAttribute("aria-expanded", "false");
        if (noScroll) document.body.style.overflow = "";
      }

      function toggle() {
        if (isOpen()) close();
        else open();
      }

      button.addEventListener("click", function (e) {
        e.preventDefault();
        toggle();
      });
      button.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });

      // Close the mobile menu when a nav link is activated.
      menu.querySelectorAll(".w-nav-link").forEach(function (link) {
        link.addEventListener("click", close);
      });

      // Close on outside click.
      document.addEventListener("click", function (e) {
        if (isOpen() && !nav.contains(e.target)) close();
      });

      // Close on Escape.
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && isOpen()) close();
      });

      // Auto-close if the viewport grows past the collapse breakpoint,
      // matching Webflow's own behavior.
      var collapseBreakpoints = { medium: 991, small: 767, tiny: 479, all: Infinity };
      var collapse = nav.getAttribute("data-collapse") || "medium";
      var breakpoint = collapseBreakpoints[collapse] || 991;
      window.addEventListener("resize", function () {
        if (isOpen() && window.innerWidth > breakpoint) close();
      });
    });
  }

  function initDropdowns() {
    var dropdowns = document.querySelectorAll(".w-dropdown");
    dropdowns.forEach(function (dropdown) {
      var toggle = dropdown.querySelector(".w-dropdown-toggle");
      var list = dropdown.querySelector(".w-dropdown-list");
      if (!toggle || !list) return;

      var hover = dropdown.getAttribute("data-hover") === "true";
      var delay = parseInt(dropdown.getAttribute("data-delay") || "0", 10);
      var closeTimer = null;

      toggle.setAttribute("role", toggle.getAttribute("role") || "button");
      toggle.setAttribute("aria-expanded", "false");
      if (!toggle.hasAttribute("tabindex")) toggle.setAttribute("tabindex", "0");

      function isOpen() {
        return list.classList.contains("w--open");
      }

      function open() {
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
        list.classList.add("w--open");
        toggle.setAttribute("aria-expanded", "true");
      }

      function close() {
        list.classList.remove("w--open");
        toggle.setAttribute("aria-expanded", "false");
      }

      function scheduleClose() {
        closeTimer = setTimeout(close, delay);
      }

      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        if (isOpen()) close();
        else open();
      });
      toggle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (isOpen()) close();
          else open();
        }
      });

      if (hover) {
        dropdown.addEventListener("mouseenter", open);
        dropdown.addEventListener("mouseleave", scheduleClose);
      }

      document.addEventListener("click", function (e) {
        if (isOpen() && !dropdown.contains(e.target)) close();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && isOpen()) close();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initNavs();
      initDropdowns();
    });
  } else {
    initNavs();
    initDropdowns();
  }
})();
