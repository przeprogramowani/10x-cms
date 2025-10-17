/**
 * Main Application Entry Point
 * Initializes all modules based on the current page
 */
(function () {
  "use strict";

  /**
   * Initialize the application
   */
  function initApp() {
    // Initialize core modules
    initCore();

    // Initialize page-specific modules based on URL
    var pathname = window.location.pathname;

    if (pathname === "/collections") {
      initCollectionsPage();
    } else if (pathname.match(/^\/collections\/[^\/]+$/)) {
      initCollectionDetailPage();
    } else if (pathname === "/media") {
      initMediaPage();
    } else if (pathname === "/webhooks") {
      initWebhooksPage();
    }
  }

  /**
   * Initialize core functionality
   */
  function initCore() {
    // Initialize alerts system
    if (window.AlertSystem) {
      window.AlertSystem.init();
    }

    // Initialize navigation
    if (window.Navigation) {
      window.Navigation.initTooltips();
      window.Navigation.init();
    }
  }

  /**
   * Initialize collections page
   */
  function initCollectionsPage() {
    if (window.CollectionsModule) {
      window.CollectionsModule.init();
    }
  }

  /**
   * Initialize collection detail page
   */
  function initCollectionDetailPage() {
    if (window.ItemsModule) {
      window.ItemsModule.init();
    }
  }

  /**
   * Initialize media page
   */
  function initMediaPage() {
    if (window.MediaModule) {
      window.MediaModule.init();
    }
  }

  /**
   * Initialize webhooks page
   */
  function initWebhooksPage() {
    if (window.WebhooksModule) {
      window.WebhooksModule.init();
    }
  }

  // Initialize when DOM is ready
  $(document).ready(function () {
    initApp();
  });
})();
