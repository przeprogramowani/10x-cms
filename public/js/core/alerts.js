/**
 * Alert System Module
 * Handles displaying global alerts and notifications
 */
(function (window) {
  "use strict";

  /**
   * Initialize the alert system
   */
  function initAlerts() {
    // Create alert container if it doesn't exist
    if ($("#globalAlertContainer").length === 0) {
      $("body").prepend(
        '<div id="globalAlertContainer" style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; width: 80%; max-width: 800px;"></div>'
      );
    }
  }

  /**
   * Show a global alert message
   * @param {string} message - The message to display
   * @param {string} type - The alert type (success, danger, warning, info)
   */
  function showAlert(message, type) {
    var $alertContainer = $(
      '<div class="alert alert-' +
        (type || "success") +
        ' alert-dismissible fade show text-dark" role="alert"></div>'
    );
    $alertContainer.text(message);
    $alertContainer.append(
      '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'
    );

    $("#globalAlertContainer").append($alertContainer);

    // Auto-remove after 5 seconds
    setTimeout(function () {
      $alertContainer.alert("close");
    }, 5000);
  }

  // Export to window
  window.AlertSystem = {
    init: initAlerts,
    show: showAlert,
  };

  // Backward compatibility - keep the global function
  window.showGlobalAlert = showAlert;
})(window);
