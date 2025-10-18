/**
 * Content Studio Module - Public Exports
 * DDD-based content management system
 */

// Domain Layer
export {ContentModel} from "./domain/aggregates/ContentModel.js";
export {ContentItem} from "./domain/aggregates/ContentItem.js";
export {ContentModelId} from "./domain/value-objects/ContentModelId.js";
export {ContentItemId} from "./domain/value-objects/ContentItemId.js";
export {
  ContentStatus,
  ContentStatusType,
} from "./domain/value-objects/ContentStatus.js";
export {
  FieldDefinition,
  FieldType,
} from "./domain/value-objects/FieldDefinition.js";
export {Revision} from "./domain/entities/Revision.js";
export {Component} from "./domain/entities/Component.js";

// Repository Interfaces (Ports)
export type {IContentModelRepository} from "./domain/repositories/IContentModelRepository.js";
export type {IContentItemRepository} from "./domain/repositories/IContentItemRepository.js";

// Application Layer
export {ContentModelService} from "./application/services/ContentModelService.js";
export {ContentItemService} from "./application/services/ContentItemService.js";
export type * from "./application/dto/ContentDTOs.js";

// Infrastructure Layer (Adapters)
export {KnexContentModelRepository} from "./infrastructure/persistence/KnexContentModelRepository.js";
export {KnexContentItemRepository} from "./infrastructure/persistence/KnexContentItemRepository.js";
