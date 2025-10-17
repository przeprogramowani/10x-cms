import express from "express";
import collectionsService from "../collections/collections.service.js";

const router = express.Router();

/**
 * GET /api/collections/:id/items
 * Public API: Get collection items
 */
router.get("/:id/items", async (req, res) => {
  try {
    const collection = await collectionsService.getCollectionById(req.params.id);
    if (!collection) {
      return res.status(404).json({error: "Collection not found"});
    }
    res.json(collection.items);
  } catch (error) {
    res.status(500).json({error: "Internal server error"});
  }
});

/**
 * GET /api/collections/:collectionId/items/:itemId
 * Public API: Get single item
 */
router.get("/:collectionId/items/:itemId", async (req, res) => {
  try {
    const {collectionId, itemId} = req.params;
    const collection = await collectionsService.getCollectionById(collectionId);

    if (!collection) {
      return res.status(404).json({error: "Collection not found"});
    }

    const item = collection.items.find((item) => item.id === itemId);

    if (!item) {
      return res.status(404).json({error: "Item not found"});
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({error: "Internal server error"});
  }
});

export default router;
