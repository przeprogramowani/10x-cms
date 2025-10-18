import db from "../../../../db/connection.js";
import {ContentModel} from "../../domain/aggregates/ContentModel.js";
import {ContentModelId} from "../../domain/value-objects/ContentModelId.js";
import {IContentModelRepository} from "../../domain/repositories/IContentModelRepository.js";
import {FieldDefinitionProps} from "../../domain/value-objects/FieldDefinition.js";

/**
 * Knex implementation of IContentModelRepository
 * Maps between ContentModel aggregates and database rows
 */

interface ContentModelRow {
  id: string;
  name: string;
  description: string;
  fields: string | FieldDefinitionProps[];
  created_at: Date;
  updated_at: Date;
}

export class KnexContentModelRepository implements IContentModelRepository {
  private readonly tableName = "content_models";

  async save(contentModel: ContentModel): Promise<void> {
    const data = contentModel.toObject();
    const row: ContentModelRow = {
      id: data.id,
      name: data.name,
      description: data.description,
      fields: JSON.stringify(data.fields),
      created_at: data.createdAt,
      updated_at: data.updatedAt,
    };

    // Check if exists
    const exists = await this.exists(contentModel.id);

    if (exists) {
      // Update
      await db(this.tableName).where({id: row.id}).update({
        name: row.name,
        description: row.description,
        fields: row.fields,
        updated_at: row.updated_at,
      });
    } else {
      // Insert
      await db(this.tableName).insert(row);
    }
  }

  async findById(id: ContentModelId): Promise<ContentModel | null> {
    const row = await db(this.tableName)
      .where({id: id.toString()})
      .first<ContentModelRow>();

    if (!row) {
      return null;
    }

    return this.mapRowToDomain(row);
  }

  async findAll(): Promise<ContentModel[]> {
    const rows = await db(this.tableName)
      .select<ContentModelRow[]>("*")
      .orderBy("created_at", "desc");

    return rows.map((row) => this.mapRowToDomain(row));
  }

  async delete(id: ContentModelId): Promise<boolean> {
    const deleted = await db(this.tableName)
      .where({id: id.toString()})
      .delete();

    return deleted > 0;
  }

  async exists(id: ContentModelId): Promise<boolean> {
    const row = await db(this.tableName).where({id: id.toString()}).first("id");

    return !!row;
  }

  /**
   * Map database row to ContentModel aggregate
   */
  private mapRowToDomain(row: ContentModelRow): ContentModel {
    const fields =
      typeof row.fields === "string" ? JSON.parse(row.fields) : row.fields;

    return ContentModel.reconstitute(
      row.id,
      row.name,
      row.description,
      fields,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }
}
