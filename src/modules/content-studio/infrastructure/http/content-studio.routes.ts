import express, {type Request, type Response} from "express";
import {ContentModelService} from "../../application/services/ContentModelService.js";
import {ContentItemService} from "../../application/services/ContentItemService.js";
import {KnexContentModelRepository} from "../persistence/KnexContentModelRepository.js";
import {KnexContentItemRepository} from "../persistence/KnexContentItemRepository.js";
import {
  CreateContentModelDTO,
  UpdateContentModelDTO,
  CreateContentItemDTO,
  UpdateContentItemDTO,
  ChangeStatusDTO,
  RevertToRevisionDTO,
} from "../../application/dto/ContentDTOs.js";

/**
 * Auth-Protected Routes for Content Studio
 * For content authoring and management
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

// ===== Content Model Routes =====

/**
 * POST /api/content-studio/models
 * Create a new content model
 */
router.post("/models", async (req: Request, res: Response): Promise<void> => {
  try {
    const dto: CreateContentModelDTO = req.body;

    if (!dto.name || !dto.fields || dto.fields.length === 0) {
      res.status(400).json({error: "Name and fields are required"});
      return;
    }

    const model = await contentModelService.createContentModel(dto);
    res.status(201).json(model);
  } catch (error) {
    console.error("Error creating content model:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * PUT /api/content-studio/models/:id
 * Update a content model
 */
router.put(
  "/models/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({error: "Model ID is required"});
        return;
      }

      const dto: UpdateContentModelDTO = req.body;
      const model = await contentModelService.updateContentModel(id, dto);

      if (!model) {
        res.status(404).json({error: "Content model not found"});
        return;
      }

      res.json(model);
    } catch (error) {
      console.error("Error updating content model:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
);

/**
 * DELETE /api/content-studio/models/:id
 * Delete a content model
 */
router.delete(
  "/models/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({error: "Model ID is required"});
        return;
      }

      const result = await contentModelService.deleteContentModel(id);

      if (!result.success) {
        res.status(400).json({error: result.error});
        return;
      }

      res.json({success: true});
    } catch (error) {
      console.error("Error deleting content model:", error);
      res.status(500).json({error: "Internal server error"});
    }
  }
);

/**
 * POST /api/content-studio/models/:id/fields
 * Add a field to a content model
 */
router.post(
  "/models/:id/fields",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({error: "Model ID is required"});
        return;
      }

      const model = await contentModelService.addField(id, req.body);

      if (!model) {
        res.status(404).json({error: "Content model not found"});
        return;
      }

      res.json(model);
    } catch (error) {
      console.error("Error adding field:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
);

/**
 * DELETE /api/content-studio/models/:id/fields/:fieldName
 * Remove a field from a content model
 */
router.delete(
  "/models/:id/fields/:fieldName",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const fieldName = req.params.fieldName;

      if (!id || !fieldName) {
        res.status(400).json({error: "Model ID and field name are required"});
        return;
      }

      const model = await contentModelService.removeField(id, fieldName);

      if (!model) {
        res.status(404).json({error: "Content model not found"});
        return;
      }

      res.json(model);
    } catch (error) {
      console.error("Error removing field:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
);

// ===== Content Item Routes =====

/**
 * POST /api/content-studio/content
 * Create a new content item
 */
router.post("/content", async (req: Request, res: Response): Promise<void> => {
  try {
    const dto: CreateContentItemDTO = req.body;

    if (!dto.contentModelId || !dto.data || !dto.createdBy) {
      res
        .status(400)
        .json({error: "contentModelId, data, and createdBy are required"});
      return;
    }

    const result = await contentItemService.createContentItem(dto);

    if ("error" in result) {
      res.status(400).json({error: result.error});
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating content item:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * PUT /api/content-studio/content/:id
 * Update a content item
 */
router.put(
  "/content/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({error: "Content ID is required"});
        return;
      }

      const dto: UpdateContentItemDTO = req.body;

      if (!dto.data || !dto.updatedBy) {
        res.status(400).json({error: "data and updatedBy are required"});
        return;
      }

      const result = await contentItemService.updateContentItem(id, dto);

      if ("error" in result) {
        res.status(400).json({error: result.error});
        return;
      }

      res.json(result);
    } catch (error) {
      console.error("Error updating content item:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
);

/**
 * PUT /api/content-studio/content/:id/status
 * Change content item status
 */
router.put(
  "/content/:id/status",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({error: "Content ID is required"});
        return;
      }

      const dto: ChangeStatusDTO = req.body;

      if (!dto.status) {
        res.status(400).json({error: "status is required"});
        return;
      }

      const result = await contentItemService.changeContentItemStatus(id, dto);

      if ("error" in result) {
        res.status(400).json({error: result.error});
        return;
      }

      res.json(result);
    } catch (error) {
      console.error("Error changing status:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
);

/**
 * POST /api/content-studio/content/:id/revert
 * Revert content item to a previous revision
 */
router.post(
  "/content/:id/revert",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({error: "Content ID is required"});
        return;
      }

      const dto: RevertToRevisionDTO = req.body;

      if (!dto.revisionNumber || !dto.revertedBy) {
        res
          .status(400)
          .json({error: "revisionNumber and revertedBy are required"});
        return;
      }

      const result = await contentItemService.revertContentItem(id, dto);

      if ("error" in result) {
        res.status(400).json({error: result.error});
        return;
      }

      res.json(result);
    } catch (error) {
      console.error("Error reverting content item:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
);

/**
 * DELETE /api/content-studio/content/:id
 * Delete a content item
 */
router.delete(
  "/content/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({error: "Content ID is required"});
        return;
      }

      const result = await contentItemService.deleteContentItem(id);

      if (!result.success) {
        res.status(404).json({error: "Content item not found"});
        return;
      }

      res.json({success: true});
    } catch (error) {
      console.error("Error deleting content item:", error);
      res.status(500).json({error: "Internal server error"});
    }
  }
);

export default router;
