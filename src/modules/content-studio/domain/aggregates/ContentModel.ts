import {ContentModelId} from "../value-objects/ContentModelId.js";
import {
  FieldDefinition,
  FieldDefinitionProps,
} from "../value-objects/FieldDefinition.js";

/**
 * Aggregate Root: ContentModel
 * Defines the structure (schema) for content types like BlogPost, Product, CaseStudy
 * Enforces invariants: no duplicate field names, minimum 1 field required
 */

export interface ContentModelProps {
  contentModelId: ContentModelId;
  name: string;
  description: string;
  fields: FieldDefinition[];
  createdAt: Date;
  updatedAt: Date;
}

export class ContentModel {
  private props: ContentModelProps;

  private constructor(props: ContentModelProps) {
    this.props = props;
  }

  /**
   * Factory method to create a new ContentModel
   */
  static create(
    name: string,
    description: string,
    fields: FieldDefinition[]
  ): ContentModel {
    if (!name || name.trim().length === 0) {
      throw new Error("Content model name is required");
    }

    if (!fields || fields.length === 0) {
      throw new Error("Content model must have at least one field");
    }

    // Check for duplicate field names
    const fieldNames = fields.map((f) => f.fieldName);
    const uniqueNames = new Set(fieldNames);
    if (fieldNames.length !== uniqueNames.size) {
      throw new Error("Content model cannot have duplicate field names");
    }

    const now = new Date();
    return new ContentModel({
      contentModelId: ContentModelId.generate(),
      name,
      description: description || "",
      fields,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute an existing ContentModel from persistence
   */
  static reconstitute(
    id: string,
    name: string,
    description: string,
    fields: FieldDefinitionProps[],
    createdAt: Date,
    updatedAt: Date
  ): ContentModel {
    return new ContentModel({
      contentModelId: ContentModelId.fromString(id),
      name,
      description,
      fields: fields.map((f) => FieldDefinition.fromObject(f)),
      createdAt,
      updatedAt,
    });
  }

  get id(): ContentModelId {
    return this.props.contentModelId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get fields(): FieldDefinition[] {
    return [...this.props.fields];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Add a new field to the content model
   */
  addField(fieldDefinition: FieldDefinition): void {
    // Check if field with same name already exists
    const existingField = this.props.fields.find(
      (f) => f.fieldName === fieldDefinition.fieldName
    );

    if (existingField) {
      throw new Error(
        `Field with name '${fieldDefinition.fieldName}' already exists`
      );
    }

    this.props.fields.push(fieldDefinition);
    this.props.updatedAt = new Date();
  }

  /**
   * Remove a field from the content model
   */
  removeField(fieldName: string): void {
    const fieldIndex = this.props.fields.findIndex(
      (f) => f.fieldName === fieldName
    );

    if (fieldIndex === -1) {
      throw new Error(`Field '${fieldName}' not found`);
    }

    if (this.props.fields.length === 1) {
      throw new Error("Cannot remove the last field from content model");
    }

    this.props.fields.splice(fieldIndex, 1);
    this.props.updatedAt = new Date();
  }

  /**
   * Update an existing field in the content model
   */
  updateField(fieldName: string, newDefinition: FieldDefinition): void {
    const fieldIndex = this.props.fields.findIndex(
      (f) => f.fieldName === fieldName
    );

    if (fieldIndex === -1) {
      throw new Error(`Field '${fieldName}' not found`);
    }

    // If renaming, check for duplicates
    if (newDefinition.fieldName !== fieldName) {
      const duplicateExists = this.props.fields.some(
        (f) => f.fieldName === newDefinition.fieldName
      );
      if (duplicateExists) {
        throw new Error(
          `Field with name '${newDefinition.fieldName}' already exists`
        );
      }
    }

    this.props.fields[fieldIndex] = newDefinition;
    this.props.updatedAt = new Date();
  }

  /**
   * Update the name and description
   */
  updateInfo(name: string, description: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Content model name is required");
    }

    this.props.name = name;
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  /**
   * Validate content data against this model's schema
   * Returns validation result with errors for each invalid field
   */
  validateContentData(data: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    for (const field of this.props.fields) {
      const value = data[field.fieldName];
      const result = field.validateValue(value);

      if (!result.valid && result.error) {
        errors.push(result.error);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get a field definition by name
   */
  getField(fieldName: string): FieldDefinition | undefined {
    return this.props.fields.find((f) => f.fieldName === fieldName);
  }

  /**
   * Convert to plain object for serialization
   */
  toObject(): {
    id: string;
    name: string;
    description: string;
    fields: FieldDefinitionProps[];
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.props.contentModelId.toString(),
      name: this.props.name,
      description: this.props.description,
      fields: this.props.fields.map((f) => f.toObject()),
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
