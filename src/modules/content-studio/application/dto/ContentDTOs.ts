import {FieldType} from "../../domain/value-objects/FieldDefinition.js";

/**
 * Data Transfer Objects for Content Studio
 * Used for communication between application layer and HTTP layer
 */

// ===== Content Model DTOs =====

export interface CreateContentModelDTO {
  name: string;
  description: string;
  fields: CreateFieldDTO[];
}

export interface CreateFieldDTO {
  fieldName: string;
  fieldType: FieldType;
  required?: boolean;
  defaultValue?: string | number | boolean;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface UpdateContentModelDTO {
  name?: string;
  description?: string;
}

export interface ContentModelDTO {
  id: string;
  name: string;
  description: string;
  fields: FieldDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface FieldDTO {
  fieldName: string;
  fieldType: string;
  required: boolean;
  defaultValue?: string | number | boolean;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// ===== Content Item DTOs =====

export interface CreateContentItemDTO {
  contentModelId: string;
  data: Record<string, any>;
  createdBy: string;
  metadata?: Record<string, any>;
}

export interface UpdateContentItemDTO {
  data: Record<string, any>;
  updatedBy: string;
  comment?: string;
}

export interface ChangeStatusDTO {
  status: string; // DRAFT, READY_FOR_REVIEW, PUBLISHED, ARCHIVED
}

export interface ContentItemDTO {
  id: string;
  contentModelId: string;
  currentData: Record<string, any>;
  status: string;
  createdBy: string;
  updatedBy: string;
  metadata: Record<string, any>;
  revisionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentItemWithModelDTO extends ContentItemDTO {
  contentModel: ContentModelDTO;
}

// ===== Revision DTOs =====

export interface RevisionDTO {
  revisionId: string;
  revisionNumber: number;
  contentData: Record<string, any>;
  createdAt: string;
  createdBy: string;
  comment?: string;
}

export interface RevertToRevisionDTO {
  revisionNumber: number;
  revertedBy: string;
}

// ===== Validation DTOs =====

export interface ValidationResultDTO {
  valid: boolean;
  errors: string[];
}
