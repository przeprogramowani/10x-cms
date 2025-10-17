import express, { type Request, type Response } from "express";
import collectionsService from "./collections.service.js";
import type { CollectionSchema } from "../types.js";

const router = express.Router();

/**
 * POST /api/collections
 * Create a new collection with custom schema
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, fieldName, fieldType } = req.body;
    const schema: CollectionSchema = {};

    if (fieldName && fieldType) {
      (fieldName as string[]).forEach((field: string, i: number) => {
        schema[field] = (fieldType as string[])[i] as
          | "string"
          | "text"
          | "number"
          | "date"
          | "media";
      });
    }

    const collection = await collectionsService.createCollection(name, schema);
    res.json({ success: true, collection });
  } catch (error) {
    console.error("Error creating collection:", error);
    res.status(500).json({ error: "Error creating collection" });
  }
});

/**
 * DELETE /api/collections/:id
 * Delete a collection and all its items
 */
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: collectionId } = req.params;

    if (!collectionId) {
      res.status(400).json({ error: "Collection ID is required" });
      return;
    }

    const success = await collectionsService.deleteCollection(collectionId);

    if (success) {
      res.json({ success: true, message: "Collection deleted successfully" });
    } else {
      res.status(404).json({ error: "Collection not found" });
    }
  } catch (error) {
    console.error("Error deleting collection:", error);
    res.status(500).json({ error: "Error deleting collection" });
  }
});

export default router;
