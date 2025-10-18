import {ContentItem} from "../../domain/aggregates/ContentItem.js";
import {ContentItemId} from "../../domain/value-objects/ContentItemId.js";
import {ContentModelId} from "../../domain/value-objects/ContentModelId.js";
import {ContentStatus} from "../../domain/value-objects/ContentStatus.js";
import {IContentItemRepository} from "../../domain/repositories/IContentItemRepository.js";
import {IContentModelRepository} from "../../domain/repositories/IContentModelRepository.js";
import {
  CreateContentItemDTO,
  UpdateContentItemDTO,
  ChangeStatusDTO,
  ContentItemDTO,
  RevisionDTO,
  RevertToRevisionDTO,
  ContentItemWithModelDTO,
} from "../dto/ContentDTOs.js";

/**
 * Application Service: ContentItemService
 * Orchestrates use cases for Content Item management
 * Transaction boundary and coordination layer
 */
export class ContentItemService {
  constructor(
    private readonly contentItemRepository: IContentItemRepository,
    private readonly contentModelRepository: IContentModelRepository
  ) {}

  /**
   * Create a new content item
   */
  async createContentItem(
    dto: CreateContentItemDTO
  ): Promise<ContentItemDTO | {error: string}> {
    const contentModelId = ContentModelId.fromString(dto.contentModelId);

    // Validate that the content model exists
    const contentModel = await this.contentModelRepository.findById(
      contentModelId
    );

    if (!contentModel) {
      return {error: "Content model not found"};
    }

    // Validate content data against model
    const validation = contentModel.validateContentData(dto.data);
    if (!validation.valid) {
      return {error: validation.errors.join("; ")};
    }

    // Create domain aggregate
    const contentItem = ContentItem.create(
      contentModelId,
      dto.data,
      dto.createdBy,
      dto.metadata
    );

    // Persist
    await this.contentItemRepository.save(contentItem);

    // Return DTO
    return this.mapToDTO(contentItem);
  }

  /**
   * Update a content item
   */
  async updateContentItem(
    id: string,
    dto: UpdateContentItemDTO
  ): Promise<ContentItemDTO | {error: string}> {
    const contentItemId = ContentItemId.fromString(id);
    const contentItem = await this.contentItemRepository.findById(
      contentItemId
    );

    if (!contentItem) {
      return {error: "Content item not found"};
    }

    // Validate content data against model
    const contentModel = await this.contentModelRepository.findById(
      contentItem.contentModelId
    );

    if (!contentModel) {
      return {error: "Content model not found"};
    }

    const validation = contentModel.validateContentData(dto.data);
    if (!validation.valid) {
      return {error: validation.errors.join("; ")};
    }

    // Update content (creates new revision)
    contentItem.updateContent(dto.data, dto.updatedBy, dto.comment);

    // Persist
    await this.contentItemRepository.save(contentItem);

    return this.mapToDTO(contentItem);
  }

  /**
   * Get a content item by ID
   */
  async getContentItemById(id: string): Promise<ContentItemDTO | null> {
    const contentItemId = ContentItemId.fromString(id);
    const contentItem = await this.contentItemRepository.findById(
      contentItemId
    );

    if (!contentItem) {
      return null;
    }

    return this.mapToDTO(contentItem);
  }

  /**
   * Get a content item with its model information
   */
  async getContentItemWithModel(
    id: string
  ): Promise<ContentItemWithModelDTO | null> {
    const contentItemId = ContentItemId.fromString(id);
    const contentItem = await this.contentItemRepository.findById(
      contentItemId
    );

    if (!contentItem) {
      return null;
    }

    const contentModel = await this.contentModelRepository.findById(
      contentItem.contentModelId
    );

    if (!contentModel) {
      return null;
    }

    return {
      ...this.mapToDTO(contentItem),
      contentModel: {
        id: contentModel.id.toString(),
        name: contentModel.name,
        description: contentModel.description,
        fields: contentModel.fields.map((f) => f.toObject()),
        createdAt: contentModel.createdAt.toISOString(),
        updatedAt: contentModel.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Get all content items for a specific model
   */
  async getContentItemsByModel(modelId: string): Promise<ContentItemDTO[]> {
    const contentModelId = ContentModelId.fromString(modelId);
    const items = await this.contentItemRepository.findByModelId(
      contentModelId
    );

    return items.map((item) => this.mapToDTO(item));
  }

  /**
   * Get all content items with a specific status
   */
  async getContentItemsByStatus(status: string): Promise<ContentItemDTO[]> {
    const contentStatus = ContentStatus.fromString(status);
    const items = await this.contentItemRepository.findByStatus(contentStatus);

    return items.map((item) => this.mapToDTO(item));
  }

  /**
   * Get all content items
   */
  async getAllContentItems(): Promise<ContentItemDTO[]> {
    const items = await this.contentItemRepository.findAll();
    return items.map((item) => this.mapToDTO(item));
  }

  /**
   * Change the status of a content item
   */
  async changeContentItemStatus(
    id: string,
    dto: ChangeStatusDTO
  ): Promise<ContentItemDTO | {error: string}> {
    const contentItemId = ContentItemId.fromString(id);
    const contentItem = await this.contentItemRepository.findById(
      contentItemId
    );

    if (!contentItem) {
      return {error: "Content item not found"};
    }

    try {
      const newStatus = ContentStatus.fromString(dto.status);
      contentItem.changeStatus(newStatus);

      await this.contentItemRepository.save(contentItem);

      return this.mapToDTO(contentItem);
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Invalid status transition",
      };
    }
  }

  /**
   * Get all revisions for a content item
   */
  async getContentItemRevisions(id: string): Promise<RevisionDTO[] | null> {
    const contentItemId = ContentItemId.fromString(id);
    const contentItem = await this.contentItemRepository.findById(
      contentItemId
    );

    if (!contentItem) {
      return null;
    }

    return contentItem.revisions.map((r) => {
      const revisionData = r.toObject();
      return {
        revisionId: revisionData.revisionId,
        revisionNumber: revisionData.revisionNumber,
        contentData: revisionData.contentData,
        createdAt: revisionData.createdAt.toISOString(),
        createdBy: revisionData.createdBy,
        comment: revisionData.comment,
      };
    });
  }

  /**
   * Revert a content item to a previous revision
   */
  async revertContentItem(
    id: string,
    dto: RevertToRevisionDTO
  ): Promise<ContentItemDTO | {error: string}> {
    const contentItemId = ContentItemId.fromString(id);
    const contentItem = await this.contentItemRepository.findById(
      contentItemId
    );

    if (!contentItem) {
      return {error: "Content item not found"};
    }

    try {
      contentItem.revertToRevision(dto.revisionNumber, dto.revertedBy);
      await this.contentItemRepository.save(contentItem);

      return this.mapToDTO(contentItem);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Failed to revert",
      };
    }
  }

  /**
   * Delete a content item
   */
  async deleteContentItem(id: string): Promise<{success: boolean}> {
    const contentItemId = ContentItemId.fromString(id);
    const deleted = await this.contentItemRepository.delete(contentItemId);

    return {success: deleted};
  }

  /**
   * Get count of content items by model
   */
  async getContentItemCountByModel(modelId: string): Promise<number> {
    const contentModelId = ContentModelId.fromString(modelId);
    return this.contentItemRepository.countByModelId(contentModelId);
  }

  /**
   * Map ContentItem aggregate to DTO
   */
  private mapToDTO(item: ContentItem): ContentItemDTO {
    const data = item.toObject();
    return {
      id: data.id,
      contentModelId: data.contentModelId,
      currentData: data.currentData,
      status: data.status,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      metadata: data.metadata,
      revisionCount: data.revisions.length,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
    };
  }
}
