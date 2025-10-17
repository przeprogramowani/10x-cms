/**
 * Webhooks Module
 * Handles webhook creation and deletion
 */
(function (window) {
  "use strict";

  /**
   * Initialize webhooks page functionality
   */
  function init() {
    initWebhookForm();
    initDeleteWebhook();
  }

  /**
   * Initialize webhook form submission
   */
  function initWebhookForm() {
    $("#webhookForm").on("submit", function (e) {
      e.preventDefault();

      var events = [];
      if ($("#event_create").is(":checked")) events.push("create");
      if ($("#event_update").is(":checked")) events.push("update");
      if ($("#event_delete").is(":checked")) events.push("delete");

      var data = {
        collection: $("#collection").val(),
        url: $("#url").val(),
        events: events,
      };

      // Validate form
      if (!data.collection) {
        window.showGlobalAlert("Please select a collection", "danger");
        return;
      }

      if (!data.url) {
        window.showGlobalAlert("Please enter a webhook URL", "danger");
        return;
      }

      if (events.length === 0) {
        window.showGlobalAlert("Please select at least one event", "danger");
        return;
      }

      $.ajax({
        url: "/api/webhooks",
        method: "POST",
        data: data,
        success: function () {
          window.location.reload();
        },
        error: function (xhr) {
          window.showGlobalAlert(
            xhr.responseJSON
              ? xhr.responseJSON.error
              : "Error creating webhook",
            "danger"
          );
        },
      });
    });
  }

  /**
   * Initialize delete webhook handler
   */
  function initDeleteWebhook() {
    $(document).on("click", ".delete-webhook", function () {
      var webhookId = $(this).data("id");

      if (confirm("Are you sure you want to delete this webhook?")) {
        $.ajax({
          url: "/api/webhooks/" + webhookId,
          method: "DELETE",
          success: function () {
            window.location.reload();
          },
          error: function () {
            window.showGlobalAlert("Error deleting webhook", "danger");
          },
        });
      }
    });
  }

  // Export to window
  window.WebhooksModule = {
    init: init,
  };
})(window);
