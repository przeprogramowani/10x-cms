// Legacy-style jQuery initialization
$(document).ready(function () {
  // Initialize Bootstrap tooltips
  $('[data-bs-toggle="tooltip"]').tooltip();

  // Add active class to current nav item
  $(".nav-link").each(function () {
    if ($(this).attr("href") === window.location.pathname) {
      $(this).addClass("active");
    } else {
      $(this).removeClass("active");
    }
  });

  // Create alert container at document root if it doesn't exist
  if ($("#globalAlertContainer").length === 0) {
    $("body").prepend(
      '<div id="globalAlertContainer" style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; width: 80%; max-width: 800px;"></div>'
    );
  }

  // Function to show global alerts
  window.showGlobalAlert = function (message, type) {
    var alertType = type || "success";
    var testId =
      alertType === "success"
        ? 'data-testid="notification-success"'
        : 'data-testid="notification-' + alertType + '"';
    var $alertContainer = $(
      '<div class="alert alert-' +
        alertType +
        ' alert-dismissible fade show text-dark" role="alert" ' +
        testId +
        "></div>"
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
  };

  // Collections page functionality
  if (window.location.pathname === "/collections") {
    initCollectionsPage();
  }

  // Collection detail page functionality
  if (window.location.pathname.match(/^\/collections\/[^\/]+$/)) {
    initCollectionDetailPage();
  }

  // Media library page functionality
  if (window.location.pathname === "/media") {
    initMediaPage();
  }

  // Webhook form submission
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
      showGlobalAlert("Please select a collection", "danger");
      return;
    }

    if (!data.url) {
      showGlobalAlert("Please enter a webhook URL", "danger");
      return;
    }

    if (events.length === 0) {
      showGlobalAlert("Please select at least one event", "danger");
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
        showGlobalAlert(
          xhr.responseJSON ? xhr.responseJSON.error : "Error creating webhook",
          "danger"
        );
      },
    });
  });

  // Delete webhook
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
          showGlobalAlert("Error deleting webhook", "danger");
        },
      });
    }
  });
});

function initCollectionsPage() {
  // Create collection modal
  var $modal = $("#createCollectionModal");
  var $form = $("#createCollectionForm");
  var $saveBtn = $("#saveCollectionBtn");
  var $addFieldBtn = $("#addFieldBtn");

  // Delete collection modal
  var $deleteModal = $("#deleteCollectionModal");
  var $confirmDeleteBtn = $("#confirmDeleteBtn");
  var collectionToDelete = null;

  // Check if modal should be automatically opened (from query parameter)
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("action") === "create") {
    setTimeout(function () {
      $modal.modal("show");
    }, 300);
  }

  // Show modal when create button is clicked
  $("#createCollectionBtn").on("click", function () {
    $modal.modal("show");
  });

  // Initialize sortable for schema fields
  $("#schemaFields").sortable({
    items: ".schema-field",
    handle: ".drag-handle",
    placeholder: "ui-sortable-placeholder",
    tolerance: "pointer",
    axis: "y",
    opacity: 0.8,
    cursor: "move",
    containment: "#schemaFields",
    helper: "clone",
    forcePlaceholderSize: true,
    start: function (e, ui) {
      // Fix helper width
      ui.helper.width($(this).width());
      ui.helper.find(".row").width("100%");

      // Fix placeholder height to match the item being dragged
      ui.placeholder.height(ui.item.outerHeight());
    },
  });

  // Add field button click handler
  $addFieldBtn.on("click", function () {
    var $newField = $(".schema-field").first().clone();
    $newField.find("input, select").val("");

    // Add dynamic test-ids
    var fieldIndex = $("#schemaFields .schema-field").length;
    $newField
      .find('input[name="fieldName[]"]')
      .attr("data-testid", "field-name-input-" + fieldIndex);
    $newField
      .find('select[name="fieldType[]"]')
      .attr("data-testid", "field-type-select-" + fieldIndex);

    $("#schemaFields").append($newField);

    // Initialize remove button for the new field
    $newField.find(".remove-field").on("click", function () {
      $(this).closest(".schema-field").remove();
    });

    // Refresh sortable to include the new field
    $("#schemaFields").sortable("refresh");
  });

  // Initialize remove buttons for existing fields
  $(".remove-field").on("click", function () {
    $(this).closest(".schema-field").remove();
  });

  // Save button click handler
  $saveBtn.on("click", function () {
    // Validate form
    if (!$form[0].checkValidity()) {
      $form[0].reportValidity();
      return;
    }

    // Collect form data
    var name = $("#collectionName").val();
    var fieldNames = [];
    var fieldTypes = [];

    $(".schema-field").each(function () {
      var fieldName = $(this).find('input[name="fieldName[]"]').val();
      var fieldType = $(this).find('select[name="fieldType[]"]').val();

      if (fieldName) {
        fieldNames.push(fieldName);
        fieldTypes.push(fieldType);
      }
    });

    // Send AJAX request to create collection
    $.ajax({
      url: "/api/collections",
      method: "POST",
      data: {
        name: name,
        fieldName: fieldNames,
        fieldType: fieldTypes,
      },
      success: function (response) {
        // Hide modal
        $modal.modal("hide");

        // Reset form
        $form[0].reset();

        // Remove any existing "no collections" message
        if ($("#collectionsContainer .alert").length > 0) {
          $("#collectionsContainer").empty();
        }

        // Create and add the new collection card to the DOM
        var collection = response.collection;
        var collectionHtml =
          '<div class="col-md-4 mb-4" data-testid="collection-card-' +
          collection.id +
          '">';
        collectionHtml += '<div class="card">';
        collectionHtml += '<div class="card-body">';
        // Add meta tag with collection ID
        collectionHtml += "<!-- @collectionId:" + collection.id + " -->";
        collectionHtml += '<h5 class="card-title">' + collection.name + "</h5>";
        collectionHtml +=
          '<p class="card-text">Items: ' +
          (collection.items ? collection.items.length : 0) +
          "</p>";
        collectionHtml += '<div class="d-flex justify-content-between">';
        collectionHtml +=
          '<a href="/collections/' +
          collection.id +
          '" class="btn btn-primary" data-testid="view-collection-button-' +
          collection.id +
          '">View Collection</a>';
        collectionHtml +=
          '<button class="btn btn-danger delete-collection-btn" data-id="' +
          collection.id +
          '" data-name="' +
          collection.name +
          '">Delete</button>';
        collectionHtml += "</div>";
        collectionHtml += "</div></div></div>";

        $("#collectionsContainer").append(collectionHtml);

        // Show success message
        showGlobalAlert("Collection created successfully!");

        // Initialize delete button for the new collection
        var $newDeleteBtn = $(
          "#collectionsContainer .delete-collection-btn"
        ).last();
        $newDeleteBtn.on("click", function () {
          var $btn = $(this);
          var collectionId = $btn.data("id");
          var collectionName = $btn.data("name");

          // Set collection to delete
          collectionToDelete = collectionId;

          // Update modal text and set collection ID in meta tag
          $("#deleteCollectionModal .modal-body").html(
            "<p>Are you sure you want to delete the collection <strong>" +
              collectionName +
              "</strong>?</p>" +
              "<p><strong>Warning:</strong> All items in this collection will be permanently deleted.</p>" +
              '<meta id="collection-id-to-delete" name="collection-id-to-delete" content="' +
              collectionId +
              '">'
          );

          // Show delete confirmation modal
          $deleteModal.modal("show");
        });
      },
      error: function (xhr) {
        showGlobalAlert(
          "Error creating collection: " + xhr.responseText,
          "danger"
        );
      },
    });
  });

  // Delete collection button click handler
  $(".delete-collection-btn").on("click", function () {
    var $btn = $(this);
    var collectionId = $btn.data("id");
    var collectionName = $btn.data("name");

    // Set collection to delete
    collectionToDelete = collectionId;

    // Update modal text and set collection ID in meta tag
    $("#deleteCollectionModal .modal-body").html(
      "<p>Are you sure you want to delete the collection <strong>" +
        collectionName +
        "</strong>?</p>" +
        "<p><strong>Warning:</strong> All items in this collection will be permanently deleted.</p>" +
        '<meta id="collection-id-to-delete" name="collection-id-to-delete" content="' +
        collectionId +
        '">'
    );

    // Show delete confirmation modal
    $deleteModal.modal("show");
  });

  // Confirm delete button click handler
  $confirmDeleteBtn.on("click", function () {
    // Get collection ID from meta tag
    var metaTag = $("#collection-id-to-delete");
    var collectionToDelete = metaTag.attr("content");

    if (!collectionToDelete) {
      // Try to get from the data attribute as fallback
      collectionToDelete = $(".delete-collection-btn").data("id");

      // Show error message if no collection ID is available
      if (!collectionToDelete) {
        alert("Error: No collection ID specified for deletion");
        $deleteModal.modal("hide");
        return;
      }
    }

    // Send AJAX request to delete collection
    $.ajax({
      url: "/api/collections/" + collectionToDelete,
      method: "DELETE",
      success: function (response) {
        // Hide modal
        $deleteModal.modal("hide");

        // Find and remove the collection card with the matching ID
        $(".card").each(function () {
          var cardHtml = $(this).html();
          var metaTagMatch = cardHtml.match(/<!-- @collectionId:([^>]+) -->/);

          if (metaTagMatch && metaTagMatch[1] === collectionToDelete) {
            // Remove the parent col-md-4 element that contains the card
            $(this).closest(".col-md-4").remove();
          }
        });

        // Show success message
        showGlobalAlert("Collection deleted successfully!");

        // If no collections left, show the "no collections" message
        if ($("#collectionsContainer .col-md-4").length === 0) {
          $("#collectionsContainer").html(
            '<div class="col-12"><p class="alert alert-info text-dark">No collections found. Create your first collection to get started.</p></div>'
          );
        }
      },
      error: function (xhr) {
        // Hide modal
        $deleteModal.modal("hide");

        // Show error
        showGlobalAlert(
          "Error deleting collection: " + xhr.responseText,
          "danger"
        );
      },
    });
  });

  // Extract collection IDs from meta tags for each collection card
  $(".card").each(function () {
    var cardHtml = $(this).html();
    var metaTagMatch = cardHtml.match(/<!-- @collectionId:([^>]+) -->/);

    if (metaTagMatch && metaTagMatch[1]) {
      var collectionId = metaTagMatch[1];
      $(this).attr("data-collection-id", collectionId);
    }
  });
}

function initCollectionDetailPage() {
  // Get collection ID from meta tag
  var collectionIdMeta = $('meta[name="collection-id"]').attr("content");
  var collectionId;

  // Extract collection ID from meta tag in HTML comments
  var htmlContent = $("body").html();
  var metaTagMatch = htmlContent.match(/<!-- @collectionId:([^>]+) -->/);

  if (metaTagMatch && metaTagMatch[1]) {
    collectionId = metaTagMatch[1];
  } else {
    // Fallback to URL if meta tag not found
    collectionId = window.location.pathname.split("/").pop();
  }

  // Media selector modal
  var $mediaSelectorModal = $("#mediaSelectorModal");
  var $mediaSelectorContainer = $("#mediaSelectorContainer");
  var currentMediaField = null;

  // Show/hide loading indicator functions
  function showLoader() {
    $("#fullPageLoader").removeClass("d-none");
  }

  function hideLoader() {
    $("#fullPageLoader").addClass("d-none");
  }

  // Add item button click handler
  $("#addItemBtn").on("click", function () {
    $("#itemModal").modal("show");
  });

  // Handle modal hide event to always reset form
  $("#itemModal").on("hidden.bs.modal", function () {
    // Reset the form
    $("#itemForm")[0].reset();

    // Reset modal title and button text/data
    $("#itemModal .modal-title").text("Add New Item");
    $("#saveItemBtn")
      .text("Add Item")
      .data("mode", "add")
      .removeData("item-id");

    // Clear any media previews
    $(".media-preview-container").empty();
  });

  // Media selector button click handler
  $(document).on("click", ".media-selector-btn", function () {
    currentMediaField = $(this).data("field");
    loadMediaItems();
    $mediaSelectorModal.modal("show");
  });

  // Media search input handler
  $("#mediaSearchInput").on("input", function () {
    var searchTerm = $(this).val().toLowerCase();

    $(".media-item-card").each(function () {
      var itemName = $(this).data("name").toLowerCase();
      var itemDesc = $(this).data("description").toLowerCase();

      if (
        itemName.indexOf(searchTerm) > -1 ||
        itemDesc.indexOf(searchTerm) > -1
      ) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  });

  // Load media items for selector
  function loadMediaItems() {
    $mediaSelectorContainer.html(
      '<div class="col-12 text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>'
    );

    $.ajax({
      url: "/api/media",
      method: "GET",
      success: function (response) {
        $mediaSelectorContainer.empty();

        if (!response.media || response.media.length === 0) {
          $mediaSelectorContainer.html(
            '<div class="col-12"><p class="alert alert-info text-dark">No images found. Please upload images in the Media Library first.</p></div>'
          );
          return;
        }

        // Display media items in a grid
        for (var i = 0; i < response.media.length; i++) {
          var item = response.media[i];
          var mediaHtml = '<div class="col-md-3 mb-3">';
          mediaHtml +=
            '<div class="card h-100 media-item-card" data-id="' +
            item.id +
            '" data-path="' +
            item.path +
            '" data-name="' +
            item.originalname +
            '" data-description="' +
            (item.description || "") +
            '">';
          mediaHtml +=
            '<img src="' +
            item.path +
            '" class="card-img-top" alt="' +
            item.originalname +
            '" style="height: 120px; object-fit: cover;">';
          mediaHtml += '<div class="card-body">';
          mediaHtml +=
            '<h6 class="card-title text-truncate">' +
            item.originalname +
            "</h6>";
          mediaHtml +=
            '<button type="button" class="btn btn-sm btn-primary select-media-btn" data-path="' +
            item.path +
            '">Select</button>';
          mediaHtml += "</div></div></div>";

          $mediaSelectorContainer.append(mediaHtml);
        }

        // Initialize select buttons
        $(".select-media-btn").on("click", function () {
          var mediaPath = $(this).data("path");
          selectMedia(mediaPath);
        });
      },
      error: function (xhr) {
        $mediaSelectorContainer.html(
          '<div class="col-12"><div class="alert alert-danger">Error loading media: ' +
            xhr.responseText +
            "</div></div>"
        );
      },
    });
  }

  // Select media item
  function selectMedia(mediaPath) {
    if (!currentMediaField) {
      return;
    }

    // Set the hidden input value
    $("#" + currentMediaField).val(mediaPath);

    // Update the display field
    $("#" + currentMediaField + "_display").val(mediaPath);

    // Update the preview
    var previewContainer = $("#" + currentMediaField + "_preview");
    previewContainer.html(
      '<img src="' +
        mediaPath +
        '" class="img-thumbnail" style="max-height: 100px;">'
    );

    // Close the modal
    $mediaSelectorModal.modal("hide");
  }

  // Save item button click handler
  $("#saveItemBtn").on("click", function () {
    // Validate form
    if (!$("#itemForm")[0].checkValidity()) {
      $("#itemForm")[0].reportValidity();
      return;
    }

    // Show loading indicator
    showLoader();

    // Collect form data
    var formData = {};

    $("#itemForm")
      .find("input, textarea, select")
      .each(function () {
        var field = $(this).attr("name");
        var value = $(this).val();

        if (field) {
          formData[field] = value;
        }
      });

    var mode = $(this).data("mode") || "add";
    var itemId = $(this).data("item-id");
    var url = "/api/collections/" + collectionId + "/items";
    var method = "POST";

    // If in edit mode, change URL and method
    if (mode === "edit" && itemId) {
      url += "/" + itemId;
      method = "PUT";
    }

    // Send AJAX request to add/update item
    $.ajax({
      url: url,
      method: method,
      data: formData,
      success: function (response) {
        // Hide loading indicator
        hideLoader();

        // Hide modal
        $("#itemModal").modal("hide");

        // Show success message
        showGlobalAlert(
          mode === "edit"
            ? "Item updated successfully!"
            : "Item added successfully!"
        );

        // Reset the form
        $("#itemForm")[0].reset();

        // Reset the modal title and button text
        $("#itemModal .modal-title").text("Add New Item");
        $("#saveItemBtn")
          .text("Add Item")
          .data("mode", "add")
          .removeData("item-id");

        // Clear any media previews
        $(".media-preview-container").empty();

        if (mode === "edit") {
          // Update the existing row
          var $row = $('tr[data-id="' + itemId + '"]');
          var item = response.item;

          // Parse the JSON data string
          var itemData = JSON.parse(item.data);

          // Clear the row
          $row.empty();

          // Add cells for each field in itemData
          for (var field in itemData) {
            var value = itemData[field] || "";

            // Check if this is a media field (assuming paths start with /uploads/ or /public/uploads/)
            if (
              value.startsWith("/uploads/") ||
              value.startsWith("/public/uploads/")
            ) {
              $row.append(
                '<td><img src="' +
                  value +
                  '" alt="Media" class="img-thumbnail" style="max-width: 50px; max-height: 50px;"></td>'
              );
            } else {
              $row.append("<td>" + value + "</td>");
            }
          }

          // Add action buttons
          var actionsHtml = "<td>";
          actionsHtml +=
            '<button class="btn btn-sm btn-primary edit-item-btn">Edit</button> ';
          actionsHtml +=
            '<button class="btn btn-sm btn-danger delete-item-btn">Delete</button>';
          actionsHtml += "</td>";
          $row.append(actionsHtml);

          // Reinitialize the buttons
          initializeRowButtons($row);
        } else {
          // Add the new item to the table without reloading the page
          if (response.item) {
            var item = response.item;

            // If there's a "no items" message, remove it
            if (
              $("#collectionItems .alert-info").length > 0 &&
              $("#collectionItems .alert-info").text().includes("No items")
            ) {
              // Create table structure if it doesn't exist
              var tableHtml =
                '<div class="table-responsive"><table class="table table-striped">';
              tableHtml += "<thead><tr>";

              // Add headers based on schema
              for (var field in item.data) {
                if (
                  field !== "id" &&
                  field !== "createdAt" &&
                  field !== "updatedAt"
                ) {
                  tableHtml += "<th>" + field + "</th>";
                }
              }

              tableHtml +=
                "<th>Actions</th></tr></thead><tbody></tbody></table></div>";
              $("#collectionItems").html(tableHtml);
            }

            // Create new row for the item
            var $tbody = $("tbody");
            var $newRow = $('<tr data-id="' + item.id + '"></tr>');

            // Add cells for each field
            for (var field in item.data) {
              if (
                field !== "id" &&
                field !== "createdAt" &&
                field !== "updatedAt"
              ) {
                var value = item.data[field] || "";

                // Check if this is a media field
                if (
                  value.startsWith("/uploads/") ||
                  value.startsWith("/public/uploads/")
                ) {
                  $newRow.append(
                    '<td><img src="' +
                      value +
                      '" alt="Media" class="img-thumbnail" style="max-width: 50px; max-height: 50px;"></td>'
                  );
                } else {
                  $newRow.append("<td>" + value + "</td>");
                }
              }
            }

            // Add action buttons
            var actionsHtml = "<td>";
            actionsHtml +=
              '<button class="btn btn-sm btn-primary edit-item-btn">Edit</button> ';
            actionsHtml +=
              '<button class="btn btn-sm btn-danger delete-item-btn">Delete</button>';
            actionsHtml += "</td>";
            $newRow.append(actionsHtml);

            // Add the row to the table
            $tbody.append($newRow);

            // Initialize the buttons for the new row
            $newRow.find(".edit-item-btn").on("click", function () {
              var $row = $(this).closest("tr");
              var itemId = $row.data("id");

              // Get the collection schema
              var schema = {};
              $("table thead th").each(function (index) {
                if (index < $("table thead th").length - 1) {
                  // Skip the Actions column
                  schema[$(this).text()] = "string"; // Default to string type
                }
              });

              // Get the current item values
              var itemData = {};
              $row.find("td").each(function (index) {
                if (index < $row.find("td").length - 1) {
                  // Skip the Actions column
                  var fieldName = $("table thead th").eq(index).text();

                  // Check if this is a media field
                  if ($(this).find("img").length > 0) {
                    itemData[fieldName] = $(this).find("img").attr("src");
                  } else {
                    var cellText = $(this).text();
                    // Try to parse JSON if it looks like a stringified object
                    if (cellText.startsWith("{") && cellText.endsWith("}")) {
                      try {
                        itemData[fieldName] = JSON.parse(cellText);
                      } catch (e) {
                        itemData[fieldName] = cellText;
                      }
                    } else {
                      itemData[fieldName] = cellText;
                    }
                  }
                }
              });

              // Reset the form
              $("#itemForm")[0].reset();

              // Fill the form with current values
              for (var field in itemData) {
                var $field = $("#" + field);

                if ($field.length > 0) {
                  // Regular input field
                  $field.val(itemData[field]);

                  // If it's a media field, update the preview and display
                  if (
                    $field.hasClass("media-field-input") ||
                    $("#" + field + "_display").length > 0
                  ) {
                    $("#" + field + "_display").val(itemData[field]);
                    $("#" + field + "_preview").html(
                      '<img src="' +
                        itemData[field] +
                        '" class="img-thumbnail" style="max-height: 100px;">'
                    );
                  }
                }
              }

              // Change the modal title and button text
              $("#itemModal .modal-title").text("Edit Item");
              $("#saveItemBtn")
                .text("Update Item")
                .data("mode", "edit")
                .data("item-id", itemId);

              // Show the modal
              $("#itemModal").modal("show");
            });

            $newRow.find(".delete-item-btn").on("click", function () {
              var $row = $(this).closest("tr");
              var itemId = $row.data("id");

              if (
                confirm(
                  "Are you sure you want to delete this item? This action cannot be undone."
                )
              ) {
                // Show loading indicator
                showLoader();

                // Send AJAX request to delete item
                $.ajax({
                  url: "/api/collections/" + collectionId + "/items/" + itemId,
                  method: "DELETE",
                  success: function (response) {
                    // Hide loading indicator
                    hideLoader();

                    // Show success message
                    showGlobalAlert("Item deleted successfully!");

                    // Remove the row from the table
                    $row.remove();

                    // Update item count if displayed
                    var $itemCount = $(".item-count");
                    if ($itemCount.length > 0) {
                      var currentCount = parseInt($itemCount.text(), 10);
                      $itemCount.text(Math.max(0, currentCount - 1));
                    }

                    // If no more items, show the "no items" message
                    if ($("tbody tr").length === 0) {
                      $(".table-responsive").replaceWith(
                        '<p class="alert alert-info text-dark">No items in this collection yet. Add your first item to get started.</p>'
                      );
                    }
                  },
                  error: function (xhr) {
                    // Hide loading indicator
                    hideLoader();
                    showGlobalAlert(
                      "Error deleting item: " + xhr.responseText,
                      "danger"
                    );
                  },
                });
              }
            });

            // Update item count if displayed
            var $itemCount = $(".item-count");
            if ($itemCount.length > 0) {
              var currentCount = parseInt($itemCount.text(), 10);
              $itemCount.text(currentCount + 1);
            }
          }
        }
      },
      error: function (xhr) {
        // Hide loading indicator
        hideLoader();
        showGlobalAlert(
          "Error " +
            (mode === "edit" ? "updating" : "adding") +
            " item: " +
            xhr.responseText,
          "danger"
        );
      },
    });
  });

  // Edit item button click handler
  $(".edit-item-btn").on("click", function () {
    var $row = $(this).closest("tr");
    var itemId = $row.data("id");

    // Get the collection schema
    var schema = {};
    $("table thead th").each(function (index) {
      if (index < $("table thead th").length - 1) {
        // Skip the Actions column
        schema[$(this).text()] = "string"; // Default to string type
      }
    });

    // Get the current item values
    var itemData = {};
    $row.find("td").each(function (index) {
      if (index < $row.find("td").length - 1) {
        // Skip the Actions column
        var fieldName = $("table thead th").eq(index).text();

        // Check if this is a media field
        if ($(this).find("img").length > 0) {
          itemData[fieldName] = $(this).find("img").attr("src");
        } else {
          var cellText = $(this).text();
          // Try to parse JSON if it looks like a stringified object
          if (cellText.startsWith("{") && cellText.endsWith("}")) {
            try {
              itemData[fieldName] = JSON.parse(cellText);
            } catch (e) {
              itemData[fieldName] = cellText;
            }
          } else {
            itemData[fieldName] = cellText;
          }
        }
      }
    });

    // Reset the form
    $("#itemForm")[0].reset();

    // Fill the form with current values
    for (var field in itemData) {
      var $field = $("#" + field);

      if ($field.length > 0) {
        // Regular input field
        $field.val(itemData[field]);

        // If it's a media field, update the preview and display
        if (
          $field.hasClass("media-field-input") ||
          $("#" + field + "_display").length > 0
        ) {
          $("#" + field + "_display").val(itemData[field]);
          $("#" + field + "_preview").html(
            '<img src="' +
              itemData[field] +
              '" class="img-thumbnail" style="max-height: 100px;">'
          );
        }
      }
    }

    // Change the modal title and button text
    $("#itemModal .modal-title").text("Edit Item");
    $("#saveItemBtn")
      .text("Update Item")
      .data("mode", "edit")
      .data("item-id", itemId);

    // Show the modal
    $("#itemModal").modal("show");
  });

  // Delete item button click handler
  $(".delete-item-btn").on("click", function () {
    var $row = $(this).closest("tr");
    var itemId = $row.data("id");

    if (
      confirm(
        "Are you sure you want to delete this item? This action cannot be undone."
      )
    ) {
      // Show loading indicator
      showLoader();

      // Send AJAX request to delete item
      $.ajax({
        url: "/api/collections/" + collectionId + "/items/" + itemId,
        method: "DELETE",
        success: function (response) {
          // Hide loading indicator
          hideLoader();

          // Show success message
          showGlobalAlert("Item deleted successfully!");

          // Remove the row from the table
          $row.remove();

          // Update item count if displayed
          var $itemCount = $(".item-count");
          if ($itemCount.length > 0) {
            var currentCount = parseInt($itemCount.text(), 10);
            $itemCount.text(Math.max(0, currentCount - 1));
          }

          // If no more items, show the "no items" message
          if ($("tbody tr").length === 0) {
            $(".table-responsive").replaceWith(
              '<p class="alert alert-info text-dark">No items in this collection yet. Add your first item to get started.</p>'
            );
          }
        },
        error: function (xhr) {
          // Hide loading indicator
          hideLoader();
          showGlobalAlert("Error deleting item: " + xhr.responseText, "danger");
        },
      });
    }
  });

  // Add this function inside initCollectionDetailPage
  function initializeRowButtons($row) {
    // Initialize edit button
    $row.find(".edit-item-btn").on("click", function () {
      var $row = $(this).closest("tr");
      var itemId = $row.data("id");

      // Get the collection schema
      var schema = {};
      $("table thead th").each(function (index) {
        if (index < $("table thead th").length - 1) {
          schema[$(this).text()] = "string"; // Default to string type
        }
      });

      // Get the current item values
      var itemData = {};
      $row.find("td").each(function (index) {
        if (index < $row.find("td").length - 1) {
          var fieldName = $("table thead th").eq(index).text();

          // Check if this is a media field
          if ($(this).find("img").length > 0) {
            itemData[fieldName] = $(this).find("img").attr("src");
          } else {
            var cellText = $(this).text();
            itemData[fieldName] = cellText;
          }
        }
      });

      // Reset and fill the form
      $("#itemForm")[0].reset();
      for (var field in itemData) {
        var $field = $("#" + field);
        if ($field.length > 0) {
          $field.val(itemData[field]);

          // Handle media field previews
          if (
            $field.hasClass("media-field-input") ||
            $("#" + field + "_display").length > 0
          ) {
            $("#" + field + "_display").val(itemData[field]);
            $("#" + field + "_preview").html(
              '<img src="' +
                itemData[field] +
                '" class="img-thumbnail" style="max-height: 100px;">'
            );
          }
        }
      }

      // Update modal for edit mode
      $("#itemModal .modal-title").text("Edit Item");
      $("#saveItemBtn")
        .text("Update Item")
        .data("mode", "edit")
        .data("item-id", itemId);

      // Show modal
      $("#itemModal").modal("show");
    });

    // Initialize delete button
    $row.find(".delete-item-btn").on("click", function () {
      var $row = $(this).closest("tr");
      var itemId = $row.data("id");

      if (
        confirm(
          "Are you sure you want to delete this item? This action cannot be undone."
        )
      ) {
        showLoader();
        $.ajax({
          url: "/api/collections/" + collectionId + "/items/" + itemId,
          method: "DELETE",
          success: function (response) {
            hideLoader();
            showGlobalAlert("Item deleted successfully!");
            $row.remove();

            // Update item count if displayed
            var $itemCount = $(".item-count");
            if ($itemCount.length > 0) {
              var currentCount = parseInt($itemCount.text(), 10);
              $itemCount.text(Math.max(0, currentCount - 1));
            }

            // Show "no items" message if table is empty
            if ($("tbody tr").length === 0) {
              $(".table-responsive").replaceWith(
                '<p class="alert alert-info text-dark">No items in this collection yet. Add your first item to get started.</p>'
              );
            }
          },
          error: function (xhr) {
            hideLoader();
            showGlobalAlert(
              "Error deleting item: " + xhr.responseText,
              "danger"
            );
          },
        });
      }
    });
  }
}

function initMediaPage() {
  // Upload image modal
  var $modal = $("#uploadImageModal");
  var $form = $("#uploadImageForm");
  var $saveBtn = $("#saveImageBtn");

  // Delete image modal
  var $deleteModal = $("#deleteImageModal");
  var $confirmDeleteBtn = $("#confirmDeleteImageBtn");

  // Preview image modal
  var $previewModal = $("#imagePreviewModal");
  var $previewImage = $("#previewImage");
  var $previewDescription = $("#previewDescription");
  var $copyUrlBtn = $("#copyImageUrlBtn");

  // Check if modal should be automatically opened (from query parameter)
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("action") === "upload") {
    setTimeout(function () {
      $modal.modal("show");
    }, 300);
  }

  // Show upload modal when button is clicked
  $("#uploadImageBtn").on("click", function () {
    $modal.modal("show");
  });

  // Save button click handler
  $saveBtn.on("click", function () {
    // Validate form
    if (!$form[0].checkValidity()) {
      $form[0].reportValidity();
      return;
    }

    // Create FormData object
    var formData = new FormData();
    var fileInput = document.getElementById("imageFile");
    var descriptionInput = document.getElementById("imageDescription");

    // Add file and description to FormData
    formData.append("image", fileInput.files[0]);
    formData.append("description", descriptionInput.value);

    // Send AJAX request to upload image
    $.ajax({
      url: "/api/media",
      method: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: function (response) {
        // Hide modal
        $modal.modal("hide");

        // Reset form
        $form[0].reset();

        // Show success message
        showGlobalAlert("Image uploaded successfully!");

        // Remove any existing "no images" message
        if ($("#mediaContainer .alert").length > 0) {
          $("#mediaContainer").empty();
        }

        // Create and add the new image card to the DOM
        var media = response.media;
        var mediaHtml = '<div class="col-md-3 mb-4">';
        mediaHtml += '<div class="card h-100">';
        mediaHtml +=
          '<img src="' +
          media.path +
          '" class="card-img-top" alt="' +
          media.originalname +
          '" style="height: 150px; object-fit: cover;">';
        mediaHtml += '<div class="card-body">';
        // Add meta tag with media ID
        mediaHtml += "<!-- @mediaId:" + media.id + " -->";
        mediaHtml +=
          '<h6 class="card-title text-truncate">' +
          media.originalname +
          "</h6>";
        mediaHtml +=
          '<p class="card-text small text-muted">' +
          (media.description || "No description") +
          "</p>";
        mediaHtml += '<div class="d-flex justify-content-between">';
        mediaHtml +=
          '<button class="btn btn-sm btn-primary preview-image-btn" data-id="' +
          media.id +
          '" data-path="' +
          media.path +
          '" data-name="' +
          media.originalname +
          '" data-description="' +
          (media.description || "") +
          '">Preview</button>';
        mediaHtml +=
          '<button class="btn btn-sm btn-danger delete-image-btn" data-id="' +
          media.id +
          '">Delete</button>';
        mediaHtml += "</div>";
        mediaHtml += "</div></div></div>";

        $("#mediaContainer").append(mediaHtml);

        // Initialize buttons for the new media item
        initMediaItemButtons();
      },
      error: function (xhr) {
        showGlobalAlert("Error uploading image: " + xhr.responseText, "danger");
      },
    });
  });

  // Initialize buttons for all media items
  initMediaItemButtons();

  function initMediaItemButtons() {
    // Preview button click handler
    $(".preview-image-btn")
      .off("click")
      .on("click", function () {
        var $btn = $(this);
        var path = $btn.data("path");
        var name = $btn.data("name");
        var description = $btn.data("description");

        // Set preview image and description
        $previewImage.attr("src", path);
        $previewImage.attr("alt", name);
        $previewDescription.text(description || "No description");

        // Set copy URL button data
        $copyUrlBtn.data("url", window.location.origin + path);

        // Show preview modal
        $previewModal.modal("show");
      });

    // Delete button click handler
    $(".delete-image-btn")
      .off("click")
      .on("click", function () {
        var $btn = $(this);
        var mediaId = $btn.data("id");

        // Set media to delete
        $("#image-id-to-delete").attr("content", mediaId);

        // Show delete confirmation modal
        $deleteModal.modal("show");
      });
  }

  // Confirm delete button click handler
  $confirmDeleteBtn.on("click", function () {
    // Get media ID from meta tag
    var metaTag = $("#image-id-to-delete");
    var mediaId = metaTag.attr("content");

    if (!mediaId) {
      alert("Error: No media ID specified for deletion");
      $deleteModal.modal("hide");
      return;
    }

    // Send AJAX request to delete media
    $.ajax({
      url: "/api/media/" + mediaId,
      method: "DELETE",
      success: function (response) {
        // Hide modal
        $deleteModal.modal("hide");

        // Show success message
        showGlobalAlert("Image deleted successfully!");

        // Find and remove the media card with the matching ID
        $(".card").each(function () {
          var cardHtml = $(this).html();
          var metaTagMatch = cardHtml.match(/<!-- @mediaId:([^>]+) -->/);

          if (metaTagMatch && metaTagMatch[1] === mediaId) {
            // Remove the parent col-md-3 element that contains the card
            $(this).closest(".col-md-3").remove();
          }
        });

        // If no more media items, show "no images" message
        if ($("#mediaContainer .col-md-3").length === 0) {
          $("#mediaContainer").html(
            '<div class="col-12"><p class="alert text-dark">No images found. Upload your first image to get started.</p></div>'
          );
        }
      },
      error: function (xhr) {
        showGlobalAlert("Error deleting image: " + xhr.responseText, "danger");
        $deleteModal.modal("hide");
      },
    });
  });

  // Copy URL button click handler
  $copyUrlBtn.on("click", function () {
    var url = $(this).data("url");

    // Create temporary textarea to copy URL
    var tempTextarea = document.createElement("textarea");
    tempTextarea.value = url;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    document.execCommand("copy");
    document.body.removeChild(tempTextarea);

    // Change button text temporarily
    var $btn = $(this);
    var originalText = $btn.text();
    $btn.text("URL Copied!");

    // Reset button text after 2 seconds
    setTimeout(function () {
      $btn.text(originalText);
    }, 2000);
  });
}
