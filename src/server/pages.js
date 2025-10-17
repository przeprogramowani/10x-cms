import templating from "./templating.js";
import storageModule from "./storage.js";
import mediaModule from "./media.js";

/**
 * Renders a simple page using the templating system
 */
const renderSimplePage = (req, res) => {
  const pageName = req.path === "/" ? "home" : req.path.substring(1);
  const content = templating.renderPage(pageName, req);

  if (!content) {
    return res.status(500).send("Error loading template");
  }

  res.send(content);
};

/**
 * Renders the webhooks page with list of webhooks and collections dropdown
 */
const renderWebhooksPage = async (req, res) => {
  try {
    let webhooksListHtml = "";
    const collections = await storageModule.getCollections();
    let collectionsDropdownHtml = "";

    if (collections.length === 0) {
      collectionsDropdownHtml =
        '<option value="">No collections available</option>';
    } else {
      collectionsDropdownHtml =
        '<option value="">Select collection...</option>';
      for (const collection of collections) {
        collectionsDropdownHtml += `<option value="${collection.id}">${collection.name}</option>`;
      }

      let hasWebhooks = false;
      for (const collection of collections) {
        const webhooks = await storageModule.getWebhooks(collection.id);

        if (webhooks.length > 0) {
          hasWebhooks = true;
          webhooksListHtml += '<div class="mb-4">';
          webhooksListHtml += `<h6 class="mb-3">${collection.name}</h6>`;

          for (const webhook of webhooks) {
            webhooksListHtml += `
              <div class="card mb-2">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <p class="mb-1"><strong>URL:</strong> ${webhook.url}</p>
                      <p class="mb-0"><small class="text-muted">Events: ${webhook.events.join(", ")}</small></p>
                    </div>
                    <button class="btn btn-danger btn-sm delete-webhook" data-id="${webhook.id}">Delete</button>
                  </div>
                </div>
              </div>`;
          }

          webhooksListHtml += "</div>";
        }
      }

      if (!hasWebhooks) {
        webhooksListHtml =
          "<p class='alert alert-info text-dark'>No webhooks configured yet.</p>";
      }
    }

    const content = templating.renderPage("webhooks", req, {
      webhooksListHtml,
      collectionsDropdownHtml,
    });

    if (!content) {
      return res.status(500).send("Error loading template");
    }

    res.send(content);
  } catch (error) {
    console.error("Error loading webhooks page:", error);
    res.status(500).send("Error loading webhooks");
  }
};

/**
 * Renders the collections list page with all collections and their item counts
 */
const renderCollectionsPage = async (req, res) => {
  try {
    const collections = await storageModule.getCollections();
    let collectionsHtml = "";

    if (collections.length === 0) {
      collectionsHtml =
        '<div class="col-12"><p class="alert alert-info text-dark">No collections found. Create your first collection to get started.</p></div>';
    } else {
      for (const collection of collections) {
        // Get collection with items using the storage module
        const collectionWithItems = await storageModule.getCollectionById(
          collection.id
        );
        const itemsCount = collectionWithItems.items
          ? collectionWithItems.items.length
          : 0;

        collectionsHtml += `
          <div class="col-md-4 mb-4">
            <div class="card">
              <div class="card-body">
                <!-- @collectionId:${collection.id} -->
                <h5 class="card-title">${collection.name}</h5>
                <p class="card-text">Items: ${itemsCount}</p>
                <div class="d-flex justify-content-between">
                  <a href="/collections/${collection.id}" class="btn btn-primary">View Collection</a>
                  <button class="btn btn-danger delete-collection-btn" data-id="${collection.id}" data-name="${collection.name}">Delete</button>
                </div>
              </div>
            </div>
          </div>`;
      }
    }

    const content = templating.renderPage("collections", req, {
      collectionsHtml,
    });

    if (!content) {
      return res.status(500).send("Error loading template");
    }

    res.send(content);
  } catch (error) {
    console.error("Error loading collections page:", error);
    res.status(500).send("Error loading collections");
  }
};

/**
 * Renders a single collection page with its items and form fields
 */
const renderCollectionPage = async (req, res) => {
  try {
    const collectionId = req.params.id;
    const collection = await storageModule.getCollectionById(collectionId);

    if (!collection) {
      return res.status(404).send("Collection not found");
    }

    let itemsHtml = "";
    let formFieldsHtml = "";

    // Only iterate over actual schema fields, not system fields
    let schema = collection.schema;
    if (typeof schema === "string") {
      try {
        schema = JSON.parse(schema);
      } catch (e) {
        console.error("Error parsing schema:", e);
        schema = {};
      }
    }

    for (const field in schema) {
      const fieldType = schema[field];
      let inputType = "text";

      if (fieldType === "number") {
        inputType = "number";
      } else if (fieldType === "date") {
        inputType = "date";
      }

      formFieldsHtml += '<div class="mb-3">';
      formFieldsHtml += `<label for="${field}" class="form-label">${field}</label>`;

      if (fieldType === "text") {
        formFieldsHtml += `<textarea class="form-control" id="${field}" name="${field}" rows="3"></textarea>`;
      } else if (fieldType === "media") {
        formFieldsHtml += `
          <div class="input-group">
            <input type="hidden" id="${field}" name="${field}" class="media-field-input">
            <input type="text" class="form-control media-field-display" id="${field}_display" readonly placeholder="No image selected">
            <button type="button" class="btn btn-primary media-selector-btn" data-field="${field}">Select Image</button>
          </div>
          <div class="mt-2 media-preview-container" id="${field}_preview"></div>`;
      } else {
        formFieldsHtml += `<input type="${inputType}" class="form-control" id="${field}" name="${field}">`;
      }

      formFieldsHtml += "</div>";
    }

    if (!collection.items || collection.items.length === 0) {
      itemsHtml =
        '<p class="alert alert-info text-dark">No items in this collection yet. Add your first item to get started.</p>';
    } else {
      itemsHtml =
        '<div class="table-responsive"><table class="table table-striped">';
      itemsHtml += "<thead><tr>";

      // Only show schema fields in table headers
      for (const field in schema) {
        itemsHtml += `<th>${field}</th>`;
      }
      itemsHtml += "<th>Actions</th></tr></thead>";

      itemsHtml += "<tbody>";
      for (const item of collection.items) {
        itemsHtml += `<tr data-id="${item.id}">`;

        // Only show schema fields in table cells
        for (const field in schema) {
          const fieldType = schema[field];
          let fieldValue = "";

          // Handle item.data which is stored as JSON in the database
          if (item.data) {
            // If item.data is a string (from JSON), parse it
            if (typeof item.data === "string") {
              try {
                const parsedData = JSON.parse(item.data);
                fieldValue = parsedData[field] || "";
              } catch (e) {
                console.error("Error parsing item data:", e);
              }
            } else {
              // If item.data is already an object
              fieldValue = item.data[field] || "";
            }
          }

          // Convert fieldValue to string for display
          fieldValue = String(fieldValue || "");

          if (fieldType === "media" && fieldValue) {
            itemsHtml += `<td><img src="${fieldValue}" alt="Media" class="img-thumbnail" style="max-width: 50px; max-height: 50px;"></td>`;
          } else {
            itemsHtml += `<td>${fieldValue}</td>`;
          }
        }

        itemsHtml += `
          <td>
            <button class="btn btn-sm btn-primary edit-item-btn">Edit</button>
            <button class="btn btn-sm btn-danger delete-item-btn">Delete</button>
          </td>
        </tr>`;
      }

      itemsHtml += "</tbody></table></div>";
    }

    const variables = {
      collectionName: collection.name,
      itemsHtml,
      formFieldsHtml,
      collectionId: collection.id,
    };

    const content = templating.renderPage("collection", req, variables);

    if (!content) {
      return res.status(500).send("Error loading template");
    }

    res.send(content);
  } catch (error) {
    console.error("Error loading collection page:", error);
    res.status(500).send("Error loading collection");
  }
};

/**
 * Renders the media library page with all uploaded images
 */
const renderMediaPage = (req, res) => {
  const mediaItems = mediaModule.getAllMedia();
  let mediaHtml = "";

  if (mediaItems.length === 0) {
    mediaHtml =
      '<div class="col-12"><p class="alert alert-info text-dark">No images found. Upload your first image to get started.</p></div>';
  } else {
    mediaItems.forEach((item) => {
      mediaHtml += `
        <div class="col-md-3 mb-4">
          <div class="card h-100">
            <img src="${item.path}" class="card-img-top" alt="${item.originalname}" style="height: 150px; object-fit: cover;">
            <div class="card-body">
              <!-- @mediaId:${item.id} -->
              <h6 class="card-title text-truncate">${item.originalname}</h6>
              <p class="card-text small text-muted">${item.description || "No description"}</p>
              <div class="d-flex justify-content-between">
                <button class="btn btn-sm btn-primary preview-image-btn"
                  data-id="${item.id}"
                  data-path="${item.path}"
                  data-name="${item.originalname}"
                  data-description="${item.description || ""}">Preview</button>
                <button class="btn btn-sm btn-danger delete-image-btn" data-id="${item.id}">Delete</button>
              </div>
            </div>
          </div>
        </div>`;
    });
  }

  const variables = {
    mediaHtml,
  };

  const content = templating.renderPage("media", req, variables);

  if (!content) {
    return res.status(500).send("Error loading template");
  }

  res.send(content);
};

export default {
  renderSimplePage,
  renderWebhooksPage,
  renderCollectionsPage,
  renderCollectionPage,
  renderMediaPage,
};
