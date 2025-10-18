import {ContentModel} from "../../domain/aggregates/ContentModel.js";
import {ContentModelId} from "../../domain/value-objects/ContentModelId.js";
import {FieldDefinition} from "../../domain/value-objects/FieldDefinition.js";
import {IContentModelRepository} from "../../domain/repositories/IContentModelRepository.js";
import {IContentItemRepository} from "../../domain/repositories/IContentItemRepository.js";
import {
  CreateContentModelDTO,
  ContentModelDTO,
  UpdateContentModelDTO,
  ValidationResultDTO,
} from "../dto/ContentDTOs.js";

/**
 * Application Service: ContentModelService
 * Orchestrates use cases for Content Model management
 * Transaction boundary and coordination layer
 */
export class ContentModelService {
  constructor(
    private readonly contentModelRepository: IContentModelRepository,
    private readonly contentItemRepository: IContentItemRepository
  ) {}

  /**
   * Create a new content model
   */
  async createContentModel(
    dto: CreateContentModelDTO
  ): Promise<ContentModelDTO> {
    // Convert DTO fields to domain FieldDefinitions
    const fields = dto.fields.map((f) =>
      FieldDefinition.create(
        f.fieldName,
        f.fieldType,
        f.required || false,
        f.defaultValue,
        f.validationRules
      )
    );

    // Create domain aggregate
    const contentModel = ContentModel.create(dto.name, dto.description, fields);

    // Persist
    await this.contentModelRepository.save(contentModel);

    // Return DTO
    return this.mapToDTO(contentModel);
  }

  /**
   * Get all content models
   */
  async getAllContentModels(): Promise<ContentModelDTO[]> {
    const models = await this.contentModelRepository.findAll();
    return models.map((m) => this.mapToDTO(m));
  }

  /**
   * Get a content model by ID
   */
  async getContentModelById(id: string): Promise<ContentModelDTO | null> {
    const contentModelId = ContentModelId.fromString(id);
    const model = await this.contentModelRepository.findById(contentModelId);

    if (!model) {
      return null;
    }

    return this.mapToDTO(model);
  }

  /**
   * Update content model information (name, description)
   */
  async updateContentModel(
    id: string,
    dto: UpdateContentModelDTO
  ): Promise<ContentModelDTO | null> {
    const contentModelId = ContentModelId.fromString(id);
    const model = await this.contentModelRepository.findById(contentModelId);

    if (!model) {
      return null;
    }

    if (dto.name !== undefined || dto.description !== undefined) {
      model.updateInfo(
        dto.name || model.name,
        dto.description !== undefined ? dto.description : model.description
      );
    }

    await this.contentModelRepository.save(model);

    return this.mapToDTO(model);
  }

  /**
   * Delete a content model
   * Only allowed if no content items exist for this model
   */
  async deleteContentModel(id: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const contentModelId = ContentModelId.fromString(id);

    // Check if any content items exist
    const hasItems = await this.contentItemRepository.existsByModelId(
      contentModelId
    );

    if (hasItems) {
      return {
        success: false,
        error:
          "Cannot delete content model because content items exist. Delete items first.",
      };
    }

    const deleted = await this.contentModelRepository.delete(contentModelId);

    if (!deleted) {
      return {
        success: false,
        error: "Content model not found",
      };
    }

    return {success: true};
  }

  /**
   * Validate content data against a content model
   */
  async validateContentAgainstModel(
    modelId: string,
    data: Record<string, any>
  ): Promise<ValidationResultDTO> {
    const contentModelId = ContentModelId.fromString(modelId);
    const model = await this.contentModelRepository.findById(contentModelId);

    if (!model) {
      return {
        valid: false,
        errors: ["Content model not found"],
      };
    }

    return model.validateContentData(data);
  }

  /**
   * Add a field to a content model
   */
  async addField(
    modelId: string,
    fieldDTO: {
      fieldName: string;
      fieldType: any;
      required?: boolean;
      defaultValue?: any;
      validationRules?: any;
    }
  ): Promise<ContentModelDTO | null> {
    const contentModelId = ContentModelId.fromString(modelId);
    const model = await this.contentModelRepository.findById(contentModelId);

    if (!model) {
      return null;
    }

    const field = FieldDefinition.create(
      fieldDTO.fieldName,
      fieldDTO.fieldType,
      fieldDTO.required || false,
      fieldDTO.defaultValue,
      fieldDTO.validationRules
    );

    model.addField(field);
    await this.contentModelRepository.save(model);

    return this.mapToDTO(model);
  }

  /**
   * Remove a field from a content model
   */
  async removeField(
    modelId: string,
    fieldName: string
  ): Promise<ContentModelDTO | null> {
    const contentModelId = ContentModelId.fromString(modelId);
    const model = await this.contentModelRepository.findById(contentModelId);

    if (!model) {
      return null;
    }

    model.removeField(fieldName);
    await this.contentModelRepository.save(model);

    return this.mapToDTO(model);
  }

  /**
   * Map ContentModel aggregate to DTO
   */
  private mapToDTO(model: ContentModel): ContentModelDTO {
    const data = model.toObject();
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      fields: data.fields.map((f) => ({
        fieldName: f.fieldName,
        fieldType: f.fieldType,
        required: f.required,
        defaultValue: f.defaultValue,
        validationRules: f.validationRules,
      })),
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
    };
  }
}
