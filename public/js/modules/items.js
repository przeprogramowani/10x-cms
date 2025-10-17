/**
 * Items Module
 * Handles collection detail page - managing items (CRUD operations)
 */
(function (window) {
  "use strict";

  var collectionId;
  var $mediaSelectorModal, $mediaSelectorContainer;
  var currentMediaField = null;

  /**
   * Initialize collection detail page
   */
  function init() {
    collectionId = window.Utils.getCollectionIdFromMeta();
    cacheElements();
    initItemModal();
    initMediaSelector();
    initSaveItem();
    initEditItem();
    initDeleteItem();
  }

  /**
   * Cache DOM elements
   */
  function cacheElements() {
    $mediaSelectorModal = $("#mediaSelectorModal");
    $mediaSelectorContainer = $("#mediaSelectorContainer");
  }

  /**
   * Initialize item modal
   */
  function initItemModal() {
    $("#addItemBtn").on("click", function () {
      $("#itemModal").modal("show");
    });

    $("#itemModal").on("hidden.bs.modal", function () {
      resetItemForm();
    });
  }

  /**
   * Reset item form
   */
  function resetItemForm() {
    $("#itemForm")[0].reset();
    $("#itemModal .modal-title").text("Add New Item");
    $("#saveItemBtn")
      .text("Add Item")
      .data("mode", "add")
      .removeData("item-id");
    $(".media-preview-container").empty();
  }

  /**
   * Initialize media selector
   */
  function initMediaSelector() {
    $(document).on("click", ".media-selector-btn", function () {
      currentMediaField = $(this).data("field");
      loadMediaItems();
      $mediaSelectorModal.modal("show");
    });

    $("#mediaSearchInput").on("input", handleMediaSearch);
  }

  /**
   * Handle media search
   */
  function handleMediaSearch() {
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
  }

  /**
   * Load media items for selector
   */
  function loadMediaItems() {
    $mediaSelectorContainer.html(
      '<div class="col-12 text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>'
    );

    $.ajax({
      url: "/api/media",
      method: "GET",
      success: function (response) {
        renderMediaItems(response);
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

  /**
   * Render media items
   */
  function renderMediaItems(response) {
    $mediaSelectorContainer.empty();

    if (!response.media || response.media.length === 0) {
      $mediaSelectorContainer.html(
        '<div class="col-12"><p class="alert alert-info text-dark">No images found. Please upload images in the Media Library first.</p></div>'
      );
      return;
    }

    for (var i = 0; i < response.media.length; i++) {
      var item = response.media[i];
      var mediaHtml = buildMediaItemCard(item);
      $mediaSelectorContainer.append(mediaHtml);
    }

    $(".select-media-btn").on("click", function () {
      selectMedia($(this).data("path"));
    });
  }

  /**
   * Build media item card HTML
   */
  function buildMediaItemCard(item) {
    var html = '<div class="col-md-3 mb-3">';
    html +=
      '<div class="card h-100 media-item-card" data-id="' +
      item.id +
      '" data-path="' +
      item.path +
      '" data-name="' +
      item.originalname +
      '" data-description="' +
      (item.description || "") +
      '">';
    html +=
      '<img src="' +
      item.path +
      '" class="card-img-top" alt="' +
      item.originalname +
      '" style="height: 120px; object-fit: cover;">';
    html += '<div class="card-body">';
    html +=
      '<h6 class="card-title text-truncate">' + item.originalname + "</h6>";
    html +=
      '<button type="button" class="btn btn-sm btn-primary select-media-btn" data-path="' +
      item.path +
      '">Select</button>';
    html += "</div></div></div>";
    return html;
  }

  /**
   * Select media item
   */
  function selectMedia(mediaPath) {
    if (!currentMediaField) return;

    $("#" + currentMediaField).val(mediaPath);
    $("#" + currentMediaField + "_display").val(mediaPath);

    var previewContainer = $("#" + currentMediaField + "_preview");
    previewContainer.html(
      '<img src="' +
        mediaPath +
        '" class="img-thumbnail" style="max-height: 100px;">'
    );

    $mediaSelectorModal.modal("hide");
  }

  /**
   * Initialize save item functionality
   */
  function initSaveItem() {
    $("#saveItemBtn").on("click", function () {
      if (!$("#itemForm")[0].checkValidity()) {
        $("#itemForm")[0].reportValidity();
        return;
      }

      window.Utils.toggleLoader(true);

      var formData = collectFormData();
      var mode = $(this).data("mode") || "add";
      var itemId = $(this).data("item-id");

      saveItem(formData, mode, itemId);
    });
  }

  /**
   * Collect form data
   */
  function collectFormData() {
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
    return formData;
  }

  /**
   * Save item (create or update)
   */
  function saveItem(formData, mode, itemId) {
    var url = "/api/collections/" + collectionId + "/items";
    var method = "POST";

    if (mode === "edit" && itemId) {
      url += "/" + itemId;
      method = "PUT";
    }

    $.ajax({
      url: url,
      method: method,
      data: formData,
      success: function (response) {
        handleSaveSuccess(response, mode, itemId);
      },
      error: function (xhr) {
        window.Utils.toggleLoader(false);
        window.showGlobalAlert(
          "Error " +
            (mode === "edit" ? "updating" : "adding") +
            " item: " +
            xhr.responseText,
          "danger"
        );
      },
    });
  }

  /**
   * Handle save success
   */
  function handleSaveSuccess(response, mode, itemId) {
    window.Utils.toggleLoader(false);
    $("#itemModal").modal("hide");

    window.showGlobalAlert(
      mode === "edit"
        ? "Item updated successfully!"
        : "Item added successfully!"
    );

    resetItemForm();

    if (mode === "edit") {
      updateExistingRow(itemId, response.item);
    } else {
      addNewRow(response.item);
    }
  }

  /**
   * Update existing row after edit
   */
  function updateExistingRow(itemId, item) {
    var $row = $('tr[data-id="' + itemId + '"]');
    var itemData = window.Utils.parseItemData(item.data);

    $row.empty();

    var headers = window.Utils.getTableHeaders($("table"));

    for (var i = 0; i < headers.length; i++) {
      var field = headers[i];
      var value = itemData[field] || "";
      $row.append(buildTableCell(value));
    }

    $row.append(buildActionButtons());
    initializeRowButtons($row);
  }

  /**
   * Add new row after creation
   */
  function addNewRow(item) {
    if (!item) return;

    // Create table if it doesn't exist
    if (
      $("#collectionItems .alert-info").length > 0 &&
      $("#collectionItems .alert-info").text().indexOf("No items") > -1
    ) {
      createItemsTable(item.data);
    }

    var $tbody = $("tbody");
    var $newRow = $('<tr data-id="' + item.id + '"></tr>');

    for (var field in item.data) {
      if (field !== "id" && field !== "createdAt" && field !== "updatedAt") {
        var value = item.data[field] || "";
        $newRow.append(buildTableCell(value));
      }
    }

    $newRow.append(buildActionButtons());
    $tbody.append($newRow);

    initializeRowButtons($newRow);
    updateItemCount(1);
  }

  /**
   * Create items table
   */
  function createItemsTable(data) {
    var tableHtml =
      '<div class="table-responsive"><table class="table table-striped">';
    tableHtml += "<thead><tr>";

    for (var field in data) {
      if (field !== "id" && field !== "createdAt" && field !== "updatedAt") {
        tableHtml += "<th>" + field + "</th>";
      }
    }

    tableHtml += "<th>Actions</th></tr></thead><tbody></tbody></table></div>";
    $("#collectionItems").html(tableHtml);
  }

  /**
   * Build table cell HTML
   */
  function buildTableCell(value) {
    var valueStr = String(value || "");

    if (window.Utils.isMediaPath(valueStr)) {
      return (
        '<td><img src="' +
        valueStr +
        '" alt="Media" class="img-thumbnail" style="max-width: 50px; max-height: 50px;"></td>'
      );
    }

    return "<td>" + valueStr + "</td>";
  }

  /**
   * Build action buttons HTML
   */
  function buildActionButtons() {
    return (
      "<td>" +
      '<button class="btn btn-sm btn-primary edit-item-btn">Edit</button> ' +
      '<button class="btn btn-sm btn-danger delete-item-btn">Delete</button>' +
      "</td>"
    );
  }

  /**
   * Update item count
   */
  function updateItemCount(delta) {
    var $itemCount = $(".item-count");
    if ($itemCount.length > 0) {
      var currentCount = parseInt($itemCount.text(), 10);
      $itemCount.text(Math.max(0, currentCount + delta));
    }
  }

  /**
   * Initialize edit item functionality
   */
  function initEditItem() {
    $(".edit-item-btn").on("click", function () {
      handleEditClick($(this));
    });
  }

  /**
   * Handle edit button click
   */
  function handleEditClick($btn) {
    var $row = $btn.closest("tr");
    var itemId = $row.data("id");
    var itemData = extractRowData($row);

    fillFormWithData(itemData);

    $("#itemModal .modal-title").text("Edit Item");
    $("#saveItemBtn")
      .text("Update Item")
      .data("mode", "edit")
      .data("item-id", itemId);

    $("#itemModal").modal("show");
  }

  /**
   * Extract data from table row
   */
  function extractRowData($row) {
    var itemData = {};

    $row.find("td").each(function (index) {
      var $cell = $(this);
      if (index < $row.find("td").length - 1) {
        var fieldName = $("table thead th").eq(index).text();

        if ($cell.find("img").length > 0) {
          itemData[fieldName] = $cell.find("img").attr("src");
        } else {
          itemData[fieldName] = $cell.text();
        }
      }
    });

    return itemData;
  }

  /**
   * Fill form with data
   */
  function fillFormWithData(itemData) {
    $("#itemForm")[0].reset();

    for (var field in itemData) {
      var $field = $("#" + field);

      if ($field.length > 0) {
        $field.val(itemData[field]);

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
  }

  /**
   * Initialize delete item functionality
   */
  function initDeleteItem() {
    $(".delete-item-btn").on("click", function () {
      handleDeleteClick($(this));
    });
  }

  /**
   * Handle delete button click
   */
  function handleDeleteClick($btn) {
    var $row = $btn.closest("tr");
    var itemId = $row.data("id");

    if (
      !confirm(
        "Are you sure you want to delete this item? This action cannot be undone."
      )
    ) {
      return;
    }

    window.Utils.toggleLoader(true);

    $.ajax({
      url: "/api/collections/" + collectionId + "/items/" + itemId,
      method: "DELETE",
      success: function () {
        handleDeleteSuccess($row);
      },
      error: function (xhr) {
        window.Utils.toggleLoader(false);
        window.showGlobalAlert(
          "Error deleting item: " + xhr.responseText,
          "danger"
        );
      },
    });
  }

  /**
   * Handle delete success
   */
  function handleDeleteSuccess($row) {
    window.Utils.toggleLoader(false);
    window.showGlobalAlert("Item deleted successfully!");

    $row.remove();
    updateItemCount(-1);

    if ($("tbody tr").length === 0) {
      $(".table-responsive").replaceWith(
        '<p class="alert alert-info text-dark">No items in this collection yet. Add your first item to get started.</p>'
      );
    }
  }

  /**
   * Initialize row buttons
   */
  function initializeRowButtons($row) {
    $row.find(".edit-item-btn").on("click", function () {
      handleEditClick($(this));
    });

    $row.find(".delete-item-btn").on("click", function () {
      handleDeleteClick($(this));
    });
  }

  // Export to window
  window.ItemsModule = {
    init: init,
  };
})(window);
