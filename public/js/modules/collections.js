/**
 * Collections Module
 * Handles collections page functionality - creating and deleting collections
 */
(function (window) {
  "use strict";

  var $modal, $form, $saveBtn, $addFieldBtn;
  var $deleteModal, $confirmDeleteBtn;
  var collectionToDelete = null;

  /**
   * Initialize collections page
   */
  function init() {
    cacheElements();
    checkAutoOpen();
    initCreateCollection();
    initDeleteCollection();
    extractCollectionIds();
  }

  /**
   * Cache DOM elements
   */
  function cacheElements() {
    $modal = $("#createCollectionModal");
    $form = $("#createCollectionForm");
    $saveBtn = $("#saveCollectionBtn");
    $addFieldBtn = $("#addFieldBtn");
    $deleteModal = $("#deleteCollectionModal");
    $confirmDeleteBtn = $("#confirmDeleteBtn");
  }

  /**
   * Check if modal should auto-open
   */
  function checkAutoOpen() {
    if (window.Utils.shouldAutoOpenModal("create")) {
      setTimeout(function () {
        $modal.modal("show");
      }, 300);
    }
  }

  /**
   * Initialize collection creation functionality
   */
  function initCreateCollection() {
    // Show modal when create button is clicked
    $("#createCollectionBtn").on("click", function () {
      $modal.modal("show");
    });

    // Initialize sortable for schema fields
    initSortableFields();

    // Add field button handler
    $addFieldBtn.on("click", handleAddField);

    // Initialize remove buttons
    $(".remove-field").on("click", handleRemoveField);

    // Save button handler
    $saveBtn.on("click", handleSaveCollection);
  }

  /**
   * Initialize sortable fields
   */
  function initSortableFields() {
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
        ui.helper.width($(this).width());
        ui.helper.find(".row").width("100%");
        ui.placeholder.height(ui.item.outerHeight());
      },
    });
  }

  /**
   * Handle adding a new field
   */
  function handleAddField() {
    var $newField = $(".schema-field").first().clone();
    $newField.find("input, select").val("");
    $("#schemaFields").append($newField);

    $newField.find(".remove-field").on("click", handleRemoveField);
    $("#schemaFields").sortable("refresh");
  }

  /**
   * Handle removing a field
   */
  function handleRemoveField() {
    $(this).closest(".schema-field").remove();
  }

  /**
   * Handle saving a collection
   */
  function handleSaveCollection() {
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

    // Send AJAX request
    $.ajax({
      url: "/api/collections",
      method: "POST",
      data: {
        name: name,
        fieldName: fieldNames,
        fieldType: fieldTypes,
      },
      success: function (response) {
        handleCreateSuccess(response);
      },
      error: function (xhr) {
        window.showGlobalAlert(
          "Error creating collection: " + xhr.responseText,
          "danger"
        );
      },
    });
  }

  /**
   * Handle successful collection creation
   */
  function handleCreateSuccess(response) {
    $modal.modal("hide");
    $form[0].reset();

    // Remove "no collections" message
    if ($("#collectionsContainer .alert").length > 0) {
      $("#collectionsContainer").empty();
    }

    // Create and add new collection card
    var collection = response.collection;
    var collectionHtml = buildCollectionCard(collection);
    $("#collectionsContainer").append(collectionHtml);

    window.showGlobalAlert("Collection created successfully!");

    // Initialize delete button
    var $newDeleteBtn = $(
      "#collectionsContainer .delete-collection-btn"
    ).last();
    $newDeleteBtn.on("click", function () {
      showDeleteConfirmation($(this));
    });
  }

  /**
   * Build HTML for a collection card
   */
  function buildCollectionCard(collection) {
    var html = '<div class="col-md-4 mb-4">';
    html += '<div class="card"><div class="card-body">';
    html += "<!-- @collectionId:" + collection.id + " -->";
    html += '<h5 class="card-title">' + collection.name + "</h5>";
    html +=
      '<p class="card-text">Items: ' +
      (collection.items ? collection.items.length : 0) +
      "</p>";
    html += '<div class="d-flex justify-content-between">';
    html +=
      '<a href="/collections/' +
      collection.id +
      '" class="btn btn-primary">View Collection</a>';
    html +=
      '<button class="btn btn-danger delete-collection-btn" data-id="' +
      collection.id +
      '" data-name="' +
      collection.name +
      '">Delete</button>';
    html += "</div></div></div></div>";
    return html;
  }

  /**
   * Initialize delete collection functionality
   */
  function initDeleteCollection() {
    $(".delete-collection-btn").on("click", function () {
      showDeleteConfirmation($(this));
    });

    $confirmDeleteBtn.on("click", handleConfirmDelete);
  }

  /**
   * Show delete confirmation modal
   */
  function showDeleteConfirmation($btn) {
    var collectionId = $btn.data("id");
    var collectionName = $btn.data("name");

    collectionToDelete = collectionId;

    $("#deleteCollectionModal .modal-body").html(
      "<p>Are you sure you want to delete the collection <strong>" +
        collectionName +
        "</strong>?</p>" +
        "<p><strong>Warning:</strong> All items in this collection will be permanently deleted.</p>" +
        '<meta id="collection-id-to-delete" name="collection-id-to-delete" content="' +
        collectionId +
        '">'
    );

    $deleteModal.modal("show");
  }

  /**
   * Handle confirm delete
   */
  function handleConfirmDelete() {
    var metaTag = $("#collection-id-to-delete");
    var collectionId = metaTag.attr("content");

    if (!collectionId) {
      collectionId = $(".delete-collection-btn").data("id");
      if (!collectionId) {
        alert("Error: No collection ID specified for deletion");
        $deleteModal.modal("hide");
        return;
      }
    }

    $.ajax({
      url: "/api/collections/" + collectionId,
      method: "DELETE",
      success: function () {
        handleDeleteSuccess(collectionId);
      },
      error: function (xhr) {
        $deleteModal.modal("hide");
        window.showGlobalAlert(
          "Error deleting collection: " + xhr.responseText,
          "danger"
        );
      },
    });
  }

  /**
   * Handle successful deletion
   */
  function handleDeleteSuccess(collectionId) {
    $deleteModal.modal("hide");

    // Find and remove the collection card
    $(".card").each(function () {
      var cardHtml = $(this).html();
      var metaTagMatch = cardHtml.match(/<!-- @collectionId:([^>]+) -->/);

      if (metaTagMatch && metaTagMatch[1] === collectionId) {
        $(this).closest(".col-md-4").remove();
      }
    });

    window.showGlobalAlert("Collection deleted successfully!");

    // Show "no collections" message if empty
    if ($("#collectionsContainer .col-md-4").length === 0) {
      $("#collectionsContainer").html(
        '<div class="col-12"><p class="alert alert-info text-dark">No collections found. Create your first collection to get started.</p></div>'
      );
    }
  }

  /**
   * Extract collection IDs from meta tags
   */
  function extractCollectionIds() {
    $(".card").each(function () {
      var cardHtml = $(this).html();
      var metaTagMatch = cardHtml.match(/<!-- @collectionId:([^>]+) -->/);

      if (metaTagMatch && metaTagMatch[1]) {
        $(this).attr("data-collection-id", metaTagMatch[1]);
      }
    });
  }

  // Export to window
  window.CollectionsModule = {
    init: init,
  };
})(window);
