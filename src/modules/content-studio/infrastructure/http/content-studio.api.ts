import express, {type Request, type Response} from "express";
import {ContentModelService} from "../../application/services/ContentModelService.js";
import {ContentItemService} from "../../application/services/ContentItemService.js";
import {KnexContentModelRepository} from "../persistence/KnexContentModelRepository.js";
import {KnexContentItemRepository} from "../persistence/KnexContentItemRepository.js";

/**
 * Public API Routes for Content Studio
 * No authentication required - for consuming published content
 */

const router = express.Router();

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
 * GET /api/content-studio/models
 * Get all content models
 */
router.get("/models", async (_req: Request, res: Response): Promise<void> => {
  try {
    const models = await contentModelService.getAllContentModels();
    res.json(models);
  } catch (error) {
    console.error("Error fetching content models:", error);
    res.status(500).json({error: "Internal server error"});
  }
});

/**
 * GET /api/content-studio/models/:id
 * Get a single content model by ID
 */
router.get(
  "/models/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({error: "Model ID is required"});
        return;
      }

      const model = await contentModelService.getContentModelById(id);

      if (!model) {
        res.status(404).json({error: "Content model not found"});
        return;
      }

      res.json(model);
    } catch (error) {
      console.error("Error fetching content model:", error);
      res.status(500).json({error: "Internal server error"});
    }
  }
);

/**
 * GET /api/content-studio/content
 * Get all published content items
 */
router.get("/content", async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await contentItemService.getContentItemsByStatus("PUBLISHED");
    res.json(items);
  } catch (error) {
    console.error("Error fetching content items:", error);
    res.status(500).json({error: "Internal server error"});
  }
});

/**
 * GET /api/content-studio/content/:id
 * Get a single content item by ID
 */
router.get(
  "/content/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({error: "Content ID is required"});
        return;
      }

      const item = await contentItemService.getContentItemById(id);

      if (!item) {
        res.status(404).json({error: "Content item not found"});
        return;
      }

      res.json(item);
    } catch (error) {
      console.error("Error fetching content item:", error);
      res.status(500).json({error: "Internal server error"});
    }
  }
);

/**
 * GET /api/content-studio/content/:id/revisions
 * Get revision history for a content item
 */
router.get(
  "/content/:id/revisions",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({error: "Content ID is required"});
        return;
      }

      const revisions = await contentItemService.getContentItemRevisions(id);

      if (!revisions) {
        res.status(404).json({error: "Content item not found"});
        return;
      }

      res.json(revisions);
    } catch (error) {
      console.error("Error fetching revisions:", error);
      res.status(500).json({error: "Internal server error"});
    }
  }
);

/**
 * GET /api/content-studio/models/:modelId/content
 * Get all content items for a specific model
 */
router.get(
  "/models/:modelId/content",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const modelId = req.params.modelId;
      if (!modelId) {
        res.status(400).json({error: "Model ID is required"});
        return;
      }

      const items = await contentItemService.getContentItemsByModel(modelId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching content items:", error);
      res.status(500).json({error: "Internal server error"});
    }
  }
);

export default router;
