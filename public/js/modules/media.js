/**
 * Media Module
 * Handles media library page - uploading, previewing, and deleting media
 */
(function (window) {
  "use strict";

  var $modal, $form, $saveBtn;
  var $deleteModal, $confirmDeleteBtn;
  var $previewModal, $previewImage, $previewDescription, $copyUrlBtn;

  /**
   * Initialize media page
   */
  function init() {
    cacheElements();
    checkAutoOpen();
    initUploadImage();
    initMediaItemButtons();
    initDeleteImage();
    initCopyUrl();
  }

  /**
   * Cache DOM elements
   */
  function cacheElements() {
    $modal = $("#uploadImageModal");
    $form = $("#uploadImageForm");
    $saveBtn = $("#saveImageBtn");
    $deleteModal = $("#deleteImageModal");
    $confirmDeleteBtn = $("#confirmDeleteImageBtn");
    $previewModal = $("#imagePreviewModal");
    $previewImage = $("#previewImage");
    $previewDescription = $("#previewDescription");
    $copyUrlBtn = $("#copyImageUrlBtn");
  }

  /**
   * Check if modal should auto-open
   */
  function checkAutoOpen() {
    if (window.Utils.shouldAutoOpenModal("upload")) {
      setTimeout(function () {
        $modal.modal("show");
      }, 300);
    }
  }

  /**
   * Initialize upload image functionality
   */
  function initUploadImage() {
    $("#uploadImageBtn").on("click", function () {
      $modal.modal("show");
    });

    $saveBtn.on("click", handleUploadImage);
  }

  /**
   * Handle image upload
   */
  function handleUploadImage() {
    if (!$form[0].checkValidity()) {
      $form[0].reportValidity();
      return;
    }

    var formData = new FormData();
    var fileInput = document.getElementById("imageFile");
    var descriptionInput = document.getElementById("imageDescription");

    formData.append("image", fileInput.files[0]);
    formData.append("description", descriptionInput.value);

    $.ajax({
      url: "/api/media",
      method: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: function (response) {
        handleUploadSuccess(response);
      },
      error: function (xhr) {
        window.showGlobalAlert(
          "Error uploading image: " + xhr.responseText,
          "danger"
        );
      },
    });
  }

  /**
   * Handle upload success
   */
  function handleUploadSuccess(response) {
    $modal.modal("hide");
    $form[0].reset();

    window.showGlobalAlert("Image uploaded successfully!");

    // Remove "no images" message
    if ($("#mediaContainer .alert").length > 0) {
      $("#mediaContainer").empty();
    }

    // Add new image card
    var media = response.media;
    var mediaHtml = buildMediaCard(media);
    $("#mediaContainer").append(mediaHtml);

    initMediaItemButtons();
  }

  /**
   * Build media card HTML
   */
  function buildMediaCard(media) {
    var html = '<div class="col-md-3 mb-4">';
    html += '<div class="card h-100">';
    html +=
      '<img src="' +
      media.path +
      '" class="card-img-top" alt="' +
      media.originalname +
      '" style="height: 150px; object-fit: cover;">';
    html += '<div class="card-body">';
    html += "<!-- @mediaId:" + media.id + " -->";
    html +=
      '<h6 class="card-title text-truncate">' + media.originalname + "</h6>";
    html +=
      '<p class="card-text small text-muted">' +
      (media.description || "No description") +
      "</p>";
    html += '<div class="d-flex justify-content-between">';
    html +=
      '<button class="btn btn-sm btn-primary preview-image-btn" data-id="' +
      media.id +
      '" data-path="' +
      media.path +
      '" data-name="' +
      media.originalname +
      '" data-description="' +
      (media.description || "") +
      '">Preview</button>';
    html +=
      '<button class="btn btn-sm btn-danger delete-image-btn" data-id="' +
      media.id +
      '">Delete</button>';
    html += "</div></div></div></div>";
    return html;
  }

  /**
   * Initialize media item buttons
   */
  function initMediaItemButtons() {
    $(".preview-image-btn").off("click").on("click", handlePreviewClick);

    $(".delete-image-btn").off("click").on("click", handleDeleteImageClick);
  }

  /**
   * Handle preview button click
   */
  function handlePreviewClick() {
    var $btn = $(this);
    var path = $btn.data("path");
    var name = $btn.data("name");
    var description = $btn.data("description");

    $previewImage.attr("src", path);
    $previewImage.attr("alt", name);
    $previewDescription.text(description || "No description");

    $copyUrlBtn.data("url", window.location.origin + path);

    $previewModal.modal("show");
  }

  /**
   * Handle delete image button click
   */
  function handleDeleteImageClick() {
    var $btn = $(this);
    var mediaId = $btn.data("id");

    $("#image-id-to-delete").attr("content", mediaId);
    $deleteModal.modal("show");
  }

  /**
   * Initialize delete image functionality
   */
  function initDeleteImage() {
    $confirmDeleteBtn.on("click", handleConfirmDelete);
  }

  /**
   * Handle confirm delete
   */
  function handleConfirmDelete() {
    var metaTag = $("#image-id-to-delete");
    var mediaId = metaTag.attr("content");

    if (!mediaId) {
      alert("Error: No media ID specified for deletion");
      $deleteModal.modal("hide");
      return;
    }

    $.ajax({
      url: "/api/media/" + mediaId,
      method: "DELETE",
      success: function () {
        handleDeleteSuccess(mediaId);
      },
      error: function (xhr) {
        window.showGlobalAlert(
          "Error deleting image: " + xhr.responseText,
          "danger"
        );
        $deleteModal.modal("hide");
      },
    });
  }

  /**
   * Handle delete success
   */
  function handleDeleteSuccess(mediaId) {
    $deleteModal.modal("hide");
    window.showGlobalAlert("Image deleted successfully!");

    // Find and remove the media card
    $(".card").each(function () {
      var cardHtml = $(this).html();
      var metaTagMatch = cardHtml.match(/<!-- @mediaId:([^>]+) -->/);

      if (metaTagMatch && metaTagMatch[1] === mediaId) {
        $(this).closest(".col-md-3").remove();
      }
    });

    // Show "no images" message if empty
    if ($("#mediaContainer .col-md-3").length === 0) {
      $("#mediaContainer").html(
        '<div class="col-12"><p class="alert text-dark">No images found. Upload your first image to get started.</p></div>'
      );
    }
  }

  /**
   * Initialize copy URL functionality
   */
  function initCopyUrl() {
    $copyUrlBtn.on("click", handleCopyUrl);
  }

  /**
   * Handle copy URL
   */
  function handleCopyUrl() {
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

    setTimeout(function () {
      $btn.text(originalText);
    }, 2000);
  }

  // Export to window
  window.MediaModule = {
    init: init,
  };
})(window);
