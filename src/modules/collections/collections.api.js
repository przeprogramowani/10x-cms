import express from "express";
import collectionsService from "./collections.service.js";

const router = express.Router();

/**
 * GET /api/collections
 * Public API: Get all collections
 */
router.get("/", async (req, res) => {
  try {
    const collections = await collectionsService.getCollections();
    res.json(collections);
  } catch (error) {
    res.status(500).json({error: "Internal server error"});
  }
});

/**
 * GET /api/collections/:id
 * Public API: Get single collection
 */
router.get("/:id", async (req, res) => {
  try {
    const collection = await collectionsService.getCollectionById(req.params.id);
    if (!collection) {
      return res.status(404).json({error: "Collection not found"});
    }
    res.json(collection);
  } catch (error) {
    res.status(500).json({error: "Internal server error"});
  }
});

export default router;
