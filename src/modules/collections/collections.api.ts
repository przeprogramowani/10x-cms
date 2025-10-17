import express, { type Request, type Response } from "express";
import collectionsService from "./collections.service.js";

const router = express.Router();

/**
 * GET /api/collections
 * Public API: Get all collections
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const collections = await collectionsService.getCollections();
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/collections/:id
 * Public API: Get single collection
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
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
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
