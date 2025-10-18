import {type Request, type Response} from "express";
import {ContentModelService} from "../../application/services/ContentModelService.js";
import {ContentItemService} from "../../application/services/ContentItemService.js";
import {KnexContentModelRepository} from "../persistence/KnexContentModelRepository.js";
import {KnexContentItemRepository} from "../persistence/KnexContentItemRepository.js";
import templatingService from "../../../templating/templating.service.js";

/**
 * View rendering for Content Studio pages
 */

// Initialize repositories and services
const contentModelRepository = new KnexContentModelRepository();
const contentItemRepository = new KnexContentItemRepository();
const contentModelService = new ContentModelService(
  contentModelRepository,
  contentItemRepository
);
const contentItemService = new ContentItemService(
  contentItemRepository,
  contentModelRepository
);

/**
 * Renders the main Content Studio page
 * Two-column layout: Content Models on the left, Content Items on the right
 */
const renderContentStudioPage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get all content models
    const models = await contentModelService.getAllContentModels();

    // Build HTML for content models list
    let modelsHtml = "";
    if (models.length === 0) {
      modelsHtml = `
        <div class="alert alert-info">
          <p class="mb-0">No content models yet. Create your first content model to get started.</p>
        </div>
      `;
    } else {
      modelsHtml = '<div class="list-group" id="contentModelsList">';
      for (const model of models) {
        const itemCount = await contentItemService.getContentItemCountByModel(
          model.id
        );
        modelsHtml += `
          <a href="#" class="list-group-item list-group-item-action content-model-item"
             data-model-id="${model.id}"
             data-model-name="${model.name}">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="mb-1">${model.name}</h6>
                <small class="text-muted">${itemCount} items</small>
              </div>
              <div>
                <button class="btn btn-sm btn-outline-danger delete-model-btn"
                        data-model-id="${model.id}"
                        data-model-name="${model.name}">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </a>
        `;
      }
      modelsHtml += "</div>";
    }

    // Render the page
    const content = templatingService.renderPage("content-studio", req, {
      modelsHtml,
    });

    if (!content) {
      res.status(500).send("Error loading template");
      return;
    }

    res.send(content);
  } catch (error) {
    console.error("Error loading content studio page:", error);
    res.status(500).send("Error loading content studio");
  }
};

export default {
  renderContentStudioPage,
};
