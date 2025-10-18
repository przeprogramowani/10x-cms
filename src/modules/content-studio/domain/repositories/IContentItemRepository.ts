import {ContentItem} from "../aggregates/ContentItem.js";
import {ContentItemId} from "../value-objects/ContentItemId.js";
import {ContentModelId} from "../value-objects/ContentModelId.js";
import {ContentStatus} from "../value-objects/ContentStatus.js";

/**
 * Repository Interface (Port): IContentItemRepository
 * Defines the contract for persisting and retrieving ContentItem aggregates
 * Implementation will be in the infrastructure layer
 */
export interface IContentItemRepository {
  /**
   * Save a content item (create or update)
   * Includes all revisions
   */
  save(contentItem: ContentItem): Promise<void>;

  /**
   * Find a content item by its ID
   * Returns the complete aggregate with all revisions
   */
  findById(id: ContentItemId): Promise<ContentItem | null>;

  /**
   * Find all content items for a specific content model
   */
  findByModelId(modelId: ContentModelId): Promise<ContentItem[]>;

  /**
   * Find all content items with a specific status
   */
  findByStatus(status: ContentStatus): Promise<ContentItem[]>;

  /**
   * Find all content items
   */
  findAll(): Promise<ContentItem[]>;

  /**
   * Delete a content item by ID
   * Returns true if deleted, false if not found
   */
  delete(id: ContentItemId): Promise<boolean>;

  /**
   * Check if any content items exist for a given model
   * Useful before deleting a content model
   */
  existsByModelId(modelId: ContentModelId): Promise<boolean>;

  /**
   * Count content items by model ID
   */
  countByModelId(modelId: ContentModelId): Promise<number>;
}
