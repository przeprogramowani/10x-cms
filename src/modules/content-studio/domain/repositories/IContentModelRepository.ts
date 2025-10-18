import {ContentModel} from "../aggregates/ContentModel.js";
import {ContentModelId} from "../value-objects/ContentModelId.js";

/**
 * Repository Interface (Port): IContentModelRepository
 * Defines the contract for persisting and retrieving ContentModel aggregates
 * Implementation will be in the infrastructure layer
 */
export interface IContentModelRepository {
  /**
   * Save a content model (create or update)
   */
  save(contentModel: ContentModel): Promise<void>;

  /**
   * Find a content model by its ID
   */
  findById(id: ContentModelId): Promise<ContentModel | null>;

  /**
   * Find all content models
   */
  findAll(): Promise<ContentModel[]>;

  /**
   * Delete a content model by ID
   * Returns true if deleted, false if not found
   */
  delete(id: ContentModelId): Promise<boolean>;

  /**
   * Check if a content model exists by ID
   */
  exists(id: ContentModelId): Promise<boolean>;
}
