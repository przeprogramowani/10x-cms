import express from "express";
import collectionsService from "./collections.service.js";

const router = express.Router();

/**
 * POST /api/collections
 * Create a new collection with custom schema
 */
router.post("/", async (req, res) => {
  try {
    const {name, fieldName, fieldType} = req.body;
    const schema = {};

    if (fieldName && fieldType) {
      fieldName.forEach((field, i) => {
        schema[field] = fieldType[i];
      });
    }

    const collection = await collectionsService.createCollection(name, schema);
    res.json({success: true, collection});
  } catch (error) {
    console.error("Error creating collection:", error);
    res.status(500).json({error: "Error creating collection"});
  }
});

/**
 * DELETE /api/collections/:id
 * Delete a collection and all its items
 */
router.delete("/:id", async (req, res) => {
  try {
    const {id: collectionId} = req.params;

    if (!collectionId) {
      return res.status(400).json({error: "Collection ID is required"});
    }

    const success = await collectionsService.deleteCollection(collectionId);

    if (success) {
      res.json({success: true, message: "Collection deleted successfully"});
    } else {
      res.status(404).json({error: "Collection not found"});
    }
  } catch (error) {
    console.error("Error deleting collection:", error);
    res.status(500).json({error: "Error deleting collection"});
  }
});

export default router;
