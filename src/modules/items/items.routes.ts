import express, { type Request, type Response } from "express";
import itemsService from "./items.service.js";
import collectionsService from "../collections/collections.service.js";
import webhooksModule from "../webhooks/webhooks.js";

const router = express.Router();

/**
 * POST /api/collections/:id/items
 * Create a new item in a collection
 */
router.post("/:id/items", async (req: Request, res: Response): Promise<void> => {
  try {
    const collectionId = req.params.id;
    if (!collectionId) {
      res.status(400).json({ error: "Collection ID is required" });
      return;
    }

    const collection = await collectionsService.getCollectionById(collectionId);

    if (!collection) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }

    const addedItem = await itemsService.addItemToCollection(
      collectionId,
      req.body
    );

    try {
      await webhooksModule.onItemCreated(collectionId, addedItem);
    } catch (error) {
      console.error("Error calling webhook for item creation:", error);
    }

    res.json({ success: true, item: addedItem });
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ error: "Error creating item" });
  }
});

/**
 * PUT /api/collections/:collectionId/items/:itemId
 * Update an item in a collection
 */
router.put(
  "/:collectionId/items/:itemId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { collectionId, itemId } = req.params;

      if (!collectionId || !itemId) {
        res.status(400).json({ error: "Collection ID and Item ID are required" });
        return;
      }

      const collection = await collectionsService.getCollectionById(collectionId);

      if (!collection) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }

      const result = await itemsService.updateItemInCollection(
        collectionId,
        itemId,
        req.body
      );

      if (!result) {
        res.status(404).json({ error: "Item not found" });
        return;
      }

      try {
        await webhooksModule.onItemUpdated(collectionId, result);
      } catch (error) {
        console.error("Error calling webhook for item update:", error);
      }

      res.json({ success: true, item: result });
    } catch (error) {
      console.error("Error updating item:", error);
      res.status(500).json({ error: "Error updating item" });
    }
  }
);

/**
 * DELETE /api/collections/:collectionId/items/:itemId
 * Delete an item from a collection
 */
router.delete(
  "/:collectionId/items/:itemId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { collectionId, itemId } = req.params;

      if (!collectionId || !itemId) {
        res.status(400).json({ error: "Collection ID and Item ID are required" });
        return;
      }

      const success = await itemsService.deleteItemFromCollection(
        collectionId,
        itemId
      );

      if (success) {
        // Wait for webhook but handle errors silently
        try {
          await webhooksModule.onItemDeleted(collectionId, itemId);
        } catch (error) {
          console.error("Error calling webhook for item deletion:", error);
        }

        res.json({ success: true, message: "Item deleted successfully" });
      } else {
        res.status(404).json({ error: "Collection or item not found" });
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ error: "Error deleting item" });
    }
  }
);

export default router;
