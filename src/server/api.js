import express from "express";
import storageModule from "./storage.js";

const router = express.Router();

// Get all collections
router.get("/collections", async (req, res) => {
  try {
    const collections = await storageModule.getCollections();
    res.json(collections);
  } catch (error) {
    res.status(500).json({error: "Internal server error"});
  }
});

// Get single collection
router.get("/collections/:id", async (req, res) => {
  try {
    const collection = await storageModule.getCollectionById(req.params.id);
    if (!collection) {
      return res.status(404).json({error: "Collection not found"});
    }
    res.json(collection);
  } catch (error) {
    res.status(500).json({error: "Internal server error"});
  }
});

// Get collection items
router.get("/collections/:id/items", async (req, res) => {
  try {
    const collection = await storageModule.getCollectionById(req.params.id);
    if (!collection) {
      return res.status(404).json({error: "Collection not found"});
    }
    res.json(collection.items);
  } catch (error) {
    res.status(500).json({error: "Internal server error"});
  }
});

// Get single item
router.get("/collections/:collectionId/items/:itemId", async (req, res) => {
  try {
    const {collectionId, itemId} = req.params;
    const collection = await storageModule.getCollectionById(collectionId);

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
