import express, { type Request, type Response } from "express";
import collectionsService from "../collections/collections.service.js";

const router = express.Router();

/**
 * GET /api/collections/:id/items
 * Public API: Get collection items
 */
router.get("/:id/items", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "Collection ID is required" });
      return;
    }

    const collection = await collectionsService.getCollectionById(id);
    if (!collection) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }
    res.json(collection.items);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/collections/:collectionId/items/:itemId
 * Public API: Get single item
 */
router.get(
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

      const item = collection.items?.find((item) => item.id === itemId);

      if (!item) {
        res.status(404).json({ error: "Item not found" });
        return;
      }

      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
