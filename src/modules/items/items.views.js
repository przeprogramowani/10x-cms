import collectionsService from "../collections/collections.service.js";
import templatingService from "../templating/templating.service.js";

/**
 * Renders a single collection page with its items and form fields
 */
const renderCollectionPage = async (req, res) => {
  try {
    const collectionId = req.params.id;
    const collection = await collectionsService.getCollectionById(collectionId);

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

    const content = templatingService.renderPage("collection", req, variables);

    if (!content) {
      return res.status(500).send("Error loading template");
    }

    res.send(content);
  } catch (error) {
    console.error("Error loading collection page:", error);
    res.status(500).send("Error loading collection");
  }
};

export default {
  renderCollectionPage,
};
