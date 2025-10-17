import { type Request, type Response } from "express";
import collectionsService from "./collections.service.js";
import templatingService from "../templating/templating.service.js";

/**
 * Renders the collections list page with all collections and their item counts
 */
const renderCollectionsPage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const collections = await collectionsService.getCollections();
    let collectionsHtml = "";

    if (collections.length === 0) {
      collectionsHtml =
        '<div class="col-12"><p class="alert alert-info text-dark">No collections found. Create your first collection to get started.</p></div>';
    } else {
      for (const collection of collections) {
        // Get collection with items using the service
        const collectionWithItems = await collectionsService.getCollectionById(
          collection.id
        );
        const itemsCount = collectionWithItems?.items
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

    const content = templatingService.renderPage("collections", req, {
      collectionsHtml,
    });

    if (!content) {
      res.status(500).send("Error loading template");
      return;
    }

    res.send(content);
  } catch (error) {
    console.error("Error loading collections page:", error);
    res.status(500).send("Error loading collections");
  }
};

export default {
  renderCollectionsPage,
};
