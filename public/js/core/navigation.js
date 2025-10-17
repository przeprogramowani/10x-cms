/**
 * Navigation Module
 * Handles navigation highlighting and related UI updates
 */
(function (window) {
  "use strict";

  /**
   * Initialize navigation - highlight active nav items
   */
  function initNavigation() {
    $(".nav-link").each(function () {
      if ($(this).attr("href") === window.location.pathname) {
        $(this).addClass("active");
      } else {
        $(this).removeClass("active");
      }
    });
  }

  /**
   * Initialize Bootstrap tooltips
   */
  function initTooltips() {
    $('[data-bs-toggle="tooltip"]').tooltip();
  }

  // Export to window
  window.Navigation = {
    init: initNavigation,
    initTooltips: initTooltips,
  };
})(window);
