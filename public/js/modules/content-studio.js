/**
 * Content Studio Client-Side JavaScript
 * Handles UI interactions, dynamic form generation, and API calls
 */

(function () {
  "use strict";

  // State
  let selectedModelId = null;
  let selectedModelName = null;
  let selectedModel = null;
  let editingContentId = null;
  let fieldCounter = 0;

  // Initialize
  document.addEventListener("DOMContentLoaded", function () {
    initializeEventListeners();
    addInitialField(); // Add one field by default to the create model form
  });

  function initializeEventListeners() {
    // Create Model Button
    const createModelBtn = document.getElementById("createModelBtn");
    if (createModelBtn) {
      createModelBtn.addEventListener("click", openCreateModelModal);
    }

    // Add Field Button
    const addFieldBtn = document.getElementById("addFieldBtn");
    if (addFieldBtn) {
      addFieldBtn.addEventListener("click", addFieldToForm);
    }

    // Save Model Button
    const saveModelBtn = document.getElementById("saveModelBtn");
    if (saveModelBtn) {
      saveModelBtn.addEventListener("click", saveContentModel);
    }

    // Create Content Button
    const createContentBtn = document.getElementById("createContentBtn");
    if (createContentBtn) {
      createContentBtn.addEventListener("click", openCreateContentModal);
    }

    // Save Content Button
    const saveContentBtn = document.getElementById("saveContentBtn");
    if (saveContentBtn) {
      saveContentBtn.addEventListener("click", saveContent);
    }

    // Content Model List - Event delegation
    const modelsList = document.getElementById("contentModelsList");
    if (modelsList) {
      modelsList.addEventListener("click", function (e) {
        const modelItem = e.target.closest(".content-model-item");
        if (modelItem && !e.target.closest(".delete-model-btn")) {
          e.preventDefault();
          const modelId = modelItem.dataset.modelId;
          const modelName = modelItem.dataset.modelName;
          selectContentModel(modelId, modelName);
        }

        // Delete model button
        const deleteBtn = e.target.closest(".delete-model-btn");
        if (deleteBtn) {
          e.preventDefault();
          e.stopPropagation();
          const modelId = deleteBtn.dataset.modelId;
          const modelName = deleteBtn.dataset.modelName;
          deleteContentModel(modelId, modelName);
        }
      });
    }

    // Content Items List - Event delegation (will be set up dynamically)
    const contentItemsContainer = document.getElementById(
      "contentItemsContainer"
    );
    if (contentItemsContainer) {
      contentItemsContainer.addEventListener("click", function (e) {
        // Edit content button
        const editBtn = e.target.closest(".edit-content-btn");
        if (editBtn) {
          e.preventDefault();
          const contentId = editBtn.dataset.contentId;
          openEditContentModal(contentId);
        }

        // Delete content button
        const deleteBtn = e.target.closest(".delete-content-btn");
        if (deleteBtn) {
          e.preventDefault();
          const contentId = deleteBtn.dataset.contentId;
          deleteContentItem(contentId);
        }

        // Change status button
        const statusBtn = e.target.closest(".status-btn");
        if (statusBtn) {
          e.preventDefault();
          const contentId = statusBtn.dataset.contentId;
          const newStatus = statusBtn.dataset.status;
          changeContentStatus(contentId, newStatus);
        }

        // View revisions button
        const revisionsBtn = e.target.closest(".revisions-btn");
        if (revisionsBtn) {
          e.preventDefault();
          const contentId = revisionsBtn.dataset.contentId;
          viewRevisions(contentId);
        }
      });
    }
  }

  // ===== Content Model Functions =====

  function openCreateModelModal() {
    document.getElementById("modelName").value = "";
    document.getElementById("modelDescription").value = "";
    document.getElementById("fieldsContainer").innerHTML = "";
    fieldCounter = 0;
    addInitialField();

    const modal = new bootstrap.Modal(
      document.getElementById("createModelModal")
    );
    modal.show();
  }

  function addInitialField() {
    addFieldToForm();
  }

  function addFieldToForm() {
    const container = document.getElementById("fieldsContainer");
    const fieldId = fieldCounter++;

    const fieldHtml = `
      <div class="card mb-2 field-card" data-field-id="${fieldId}">
        <div class="card-body">
          <div class="row">
            <div class="col-md-4">
              <label class="form-label">Field Name</label>
              <input type="text" class="form-control field-name" placeholder="e.g., title" required>
            </div>
            <div class="col-md-3">
              <label class="form-label">Type</label>
              <select class="form-select field-type">
                <option value="string">String</option>
                <option value="text">Text</option>
                <option value="richtext">Rich Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Required</label>
              <div class="form-check form-switch mt-2">
                <input class="form-check-input field-required" type="checkbox">
              </div>
            </div>
            <div class="col-md-2">
              <label class="form-label">&nbsp;</label>
              <button type="button" class="btn btn-sm btn-danger w-100 remove-field-btn">Remove</button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", fieldHtml);

    // Add remove button listener
    const lastCard = container.lastElementChild;
    const removeBtn = lastCard.querySelector(".remove-field-btn");
    removeBtn.addEventListener("click", function () {
      lastCard.remove();
    });
  }

  async function saveContentModel() {
    const name = document.getElementById("modelName").value.trim();
    const description = document
      .getElementById("modelDescription")
      .value.trim();

    if (!name) {
      showAlert("danger", "Please enter a model name");
      return;
    }

    // Collect fields
    const fieldCards = document.querySelectorAll(".field-card");
    const fields = [];

    for (const card of fieldCards) {
      const fieldName = card.querySelector(".field-name").value.trim();
      const fieldType = card.querySelector(".field-type").value;
      const required = card.querySelector(".field-required").checked;

      if (!fieldName) {
        showAlert("danger", "All fields must have a name");
        return;
      }

      fields.push({
        fieldName,
        fieldType,
        required,
      });
    }

    if (fields.length === 0) {
      showAlert("danger", "Please add at least one field");
      return;
    }

    try {
      const response = await fetch("/api/content-studio/models", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({name, description, fields}),
      });

      if (response.ok) {
        showAlert("success", "Content model created successfully");
        bootstrap.Modal.getInstance(
          document.getElementById("createModelModal")
        ).hide();
        setTimeout(() => location.reload(), 1000);
      } else {
        const error = await response.json();
        showAlert("danger", error.error || "Failed to create content model");
      }
    } catch (error) {
      console.error("Error creating model:", error);
      showAlert("danger", "Network error");
    }
  }

  async function deleteContentModel(modelId, modelName) {
    if (
      !confirm(
        `Are you sure you want to delete "${modelName}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/content-studio/models/${modelId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showAlert("success", "Content model deleted successfully");
        setTimeout(() => location.reload(), 1000);
      } else {
        const error = await response.json();
        showAlert("danger", error.error || "Failed to delete content model");
      }
    } catch (error) {
      console.error("Error deleting model:", error);
      showAlert("danger", "Network error");
    }
  }

  async function selectContentModel(modelId, modelName) {
    selectedModelId = modelId;
    selectedModelName = modelName;

    // Update UI
    document.getElementById("contentItemsTitle").textContent = modelName;
    document.getElementById("createContentBtn").style.display = "block";

    // Highlight selected model
    document.querySelectorAll(".content-model-item").forEach((item) => {
      item.classList.remove("active");
    });
    document
      .querySelector(`[data-model-id="${modelId}"]`)
      .classList.add("active");

    // Load model details
    try {
      const response = await fetch(`/api/content-studio/models/${modelId}`);
      selectedModel = await response.json();
    } catch (error) {
      console.error("Error loading model:", error);
    }

    // Load content items
    loadContentItems(modelId);
  }

  async function loadContentItems(modelId) {
    const container = document.getElementById("contentItemsContainer");

    try {
      const response = await fetch(
        `/api/content-studio/models/${modelId}/content`
      );
      const items = await response.json();

      if (items.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info">
            <p class="mb-0">No content items yet. Click "New Content" to create one.</p>
          </div>
        `;
        return;
      }

      let html = '<div class="list-group">';
      for (const item of items) {
        const statusBadge = getStatusBadge(item.status);
        const previewData = getPreviewData(item.currentData);

        html += `
          <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <h6 class="mb-1">${previewData}</h6>
                <small class="text-muted">
                  Updated: ${new Date(item.updatedAt).toLocaleString()} by ${
          item.updatedBy
        }
                </small>
                <div class="mt-1">
                  ${statusBadge}
                  <span class="badge bg-secondary">${
                    item.revisionCount
                  } revisions</span>
                </div>
              </div>
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary edit-content-btn"
                        data-content-id="${item.id}">Edit</button>
                <button class="btn btn-sm btn-outline-secondary revisions-btn"
                        data-content-id="${item.id}">History</button>
                <button class="btn btn-sm btn-outline-danger delete-content-btn"
                        data-content-id="${item.id}">Delete</button>
              </div>
            </div>
            <div class="mt-2">
              ${getStatusButtons(item.id, item.status)}
            </div>
          </div>
        `;
      }
      html += "</div>";

      container.innerHTML = html;
    } catch (error) {
      console.error("Error loading content items:", error);
      container.innerHTML =
        '<div class="alert alert-danger">Error loading content items</div>';
    }
  }

  function getStatusBadge(status) {
    const badges = {
      DRAFT: '<span class="badge bg-secondary">Draft</span>',
      READY_FOR_REVIEW:
        '<span class="badge bg-warning">Ready for Review</span>',
      PUBLISHED: '<span class="badge bg-success">Published</span>',
      ARCHIVED: '<span class="badge bg-dark">Archived</span>',
    };
    return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
  }

  function getStatusButtons(contentId, currentStatus) {
    const buttons = [];

    if (currentStatus === "DRAFT") {
      buttons.push(
        `<button class="btn btn-sm btn-warning status-btn" data-content-id="${contentId}" data-status="READY_FOR_REVIEW">Ready for Review</button>`
      );
      buttons.push(
        `<button class="btn btn-sm btn-success status-btn" data-content-id="${contentId}" data-status="PUBLISHED">Publish</button>`
      );
    } else if (currentStatus === "READY_FOR_REVIEW") {
      buttons.push(
        `<button class="btn btn-sm btn-secondary status-btn" data-content-id="${contentId}" data-status="DRAFT">Back to Draft</button>`
      );
      buttons.push(
        `<button class="btn btn-sm btn-success status-btn" data-content-id="${contentId}" data-status="PUBLISHED">Publish</button>`
      );
    } else if (currentStatus === "PUBLISHED") {
      buttons.push(
        `<button class="btn btn-sm btn-dark status-btn" data-content-id="${contentId}" data-status="ARCHIVED">Archive</button>`
      );
    } else if (currentStatus === "ARCHIVED") {
      buttons.push(
        `<button class="btn btn-sm btn-secondary status-btn" data-content-id="${contentId}" data-status="DRAFT">Restore to Draft</button>`
      );
    }

    return buttons.join(" ");
  }

  function getPreviewData(data) {
    // Get first few fields for preview
    const values = Object.values(data)
      .filter((v) => v)
      .slice(0, 2);
    return values.join(" - ") || "No data";
  }

  // ===== Content Item Functions =====

  function openCreateContentModal() {
    if (!selectedModel) {
      showAlert("danger", "Please select a content model first");
      return;
    }

    editingContentId = null;
    document.getElementById(
      "contentModalTitle"
    ).textContent = `Create ${selectedModelName}`;

    generateContentForm(selectedModel.fields, {});

    const modal = new bootstrap.Modal(document.getElementById("contentModal"));
    modal.show();
  }

  async function openEditContentModal(contentId) {
    try {
      const response = await fetch(`/api/content-studio/content/${contentId}`);
      const content = await response.json();

      editingContentId = contentId;
      document.getElementById(
        "contentModalTitle"
      ).textContent = `Edit ${selectedModelName}`;

      generateContentForm(selectedModel.fields, content.currentData);

      const modal = new bootstrap.Modal(
        document.getElementById("contentModal")
      );
      modal.show();
    } catch (error) {
      console.error("Error loading content:", error);
      showAlert("danger", "Failed to load content");
    }
  }

  function generateContentForm(fields, data) {
    const container = document.getElementById("contentFieldsContainer");
    let html = "";

    for (const field of fields) {
      const value = data[field.fieldName] || "";
      const required = field.required ? "required" : "";

      html += `<div class="mb-3">`;
      html += `<label class="form-label">${field.fieldName}${
        field.required ? " *" : ""
      }</label>`;

      switch (field.fieldType) {
        case "string":
          html += `<input type="text" class="form-control content-field" data-field-name="${field.fieldName}" value="${value}" ${required}>`;
          break;
        case "text":
        case "richtext":
          html += `<textarea class="form-control content-field" data-field-name="${field.fieldName}" rows="4" ${required}>${value}</textarea>`;
          break;
        case "number":
          html += `<input type="number" class="form-control content-field" data-field-name="${field.fieldName}" value="${value}" ${required}>`;
          break;
        case "date":
          html += `<input type="date" class="form-control content-field" data-field-name="${field.fieldName}" value="${value}" ${required}>`;
          break;
        case "boolean":
          const checked = value ? "checked" : "";
          html += `<div class="form-check form-switch">`;
          html += `<input type="checkbox" class="form-check-input content-field" data-field-name="${field.fieldName}" ${checked}>`;
          html += `</div>`;
          break;
      }

      html += `</div>`;
    }

    container.innerHTML = html;
  }

  async function saveContent() {
    // Collect form data
    const data = {};
    const fieldInputs = document.querySelectorAll(".content-field");

    for (const input of fieldInputs) {
      const fieldName = input.dataset.fieldName;
      let value;

      if (input.type === "checkbox") {
        value = input.checked;
      } else if (input.type === "number") {
        value = input.value ? parseFloat(input.value) : undefined;
      } else {
        value = input.value || undefined;
      }

      data[fieldName] = value;
    }

    const username = "admin"; // In real app, get from session

    try {
      let response;

      if (editingContentId) {
        // Update
        response = await fetch(
          `/api/content-studio/content/${editingContentId}`,
          {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
              data,
              updatedBy: username,
              comment: "Updated content",
            }),
          }
        );
      } else {
        // Create
        response = await fetch("/api/content-studio/content", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            contentModelId: selectedModelId,
            data,
            createdBy: username,
          }),
        });
      }

      if (response.ok) {
        showAlert(
          "success",
          editingContentId ? "Content updated" : "Content created"
        );
        bootstrap.Modal.getInstance(
          document.getElementById("contentModal")
        ).hide();
        loadContentItems(selectedModelId);
      } else {
        const error = await response.json();
        showAlert("danger", error.error || "Failed to save content");
      }
    } catch (error) {
      console.error("Error saving content:", error);
      showAlert("danger", "Network error");
    }
  }

  async function deleteContentItem(contentId) {
    if (!confirm("Are you sure you want to delete this content item?")) {
      return;
    }

    try {
      const response = await fetch(`/api/content-studio/content/${contentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showAlert("success", "Content deleted");
        loadContentItems(selectedModelId);
      } else {
        showAlert("danger", "Failed to delete content");
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      showAlert("danger", "Network error");
    }
  }

  async function changeContentStatus(contentId, newStatus) {
    try {
      const response = await fetch(
        `/api/content-studio/content/${contentId}/status`,
        {
          method: "PUT",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({status: newStatus}),
        }
      );

      if (response.ok) {
        showAlert("success", "Status changed");
        loadContentItems(selectedModelId);
      } else {
        const error = await response.json();
        showAlert("danger", error.error || "Failed to change status");
      }
    } catch (error) {
      console.error("Error changing status:", error);
      showAlert("danger", "Network error");
    }
  }

  async function viewRevisions(contentId) {
    try {
      const response = await fetch(
        `/api/content-studio/content/${contentId}/revisions`
      );
      const revisions = await response.json();

      const container = document.getElementById("revisionsContainer");
      let html = '<div class="list-group">';

      for (const revision of revisions.reverse()) {
        html += `
          <div class="list-group-item">
            <div class="d-flex justify-content-between">
              <h6>Revision ${revision.revisionNumber}</h6>
              <small class="text-muted">${new Date(
                revision.createdAt
              ).toLocaleString()}</small>
            </div>
            <p class="mb-1"><strong>By:</strong> ${revision.createdBy}</p>
            ${
              revision.comment
                ? `<p class="mb-1"><em>${revision.comment}</em></p>`
                : ""
            }
            <details>
              <summary>View Data</summary>
              <pre class="mt-2">${JSON.stringify(
                revision.contentData,
                null,
                2
              )}</pre>
            </details>
          </div>
        `;
      }

      html += "</div>";
      container.innerHTML = html;

      const modal = new bootstrap.Modal(
        document.getElementById("revisionsModal")
      );
      modal.show();
    } catch (error) {
      console.error("Error loading revisions:", error);
      showAlert("danger", "Failed to load revisions");
    }
  }

  // ===== Helper Functions =====

  function showAlert(type, message) {
    // Use the global alert system (message first, then type)
    if (window.showGlobalAlert) {
      window.showGlobalAlert(message, type);
    } else if (window.AlertSystem && window.AlertSystem.show) {
      window.AlertSystem.show(message, type);
    } else {
      console.error("Alert system not available:", message);
    }
  }
})();
