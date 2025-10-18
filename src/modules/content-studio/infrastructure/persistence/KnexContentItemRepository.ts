import db from "../../../../db/connection.js";
import {ContentItem} from "../../domain/aggregates/ContentItem.js";
import {ContentItemId} from "../../domain/value-objects/ContentItemId.js";
import {ContentModelId} from "../../domain/value-objects/ContentModelId.js";
import {ContentStatus} from "../../domain/value-objects/ContentStatus.js";
import {IContentItemRepository} from "../../domain/repositories/IContentItemRepository.js";
import {RevisionData, RevisionProps} from "../../domain/entities/Revision.js";
import {ContentItemMetadata} from "../../domain/aggregates/ContentItem.js";

/**
 * Knex implementation of IContentItemRepository
 * Maps between ContentItem aggregates and database rows
 * Handles the complexity of storing aggregates with nested entities (revisions)
 */

interface ContentItemRow {
  id: string;
  content_model_id: string;
  current_data: string | RevisionData;
  status: string;
  created_by: string;
  updated_by: string;
  metadata: string | ContentItemMetadata;
  created_at: Date;
  updated_at: Date;
}

interface ContentRevisionRow {
  id: string;
  content_item_id: string;
  revision_number: number;
  revision_data: string | RevisionData;
  comment: string | null;
  created_by: string;
  created_at: Date;
}

export class KnexContentItemRepository implements IContentItemRepository {
  private readonly itemsTable = "content_items";
  private readonly revisionsTable = "content_revisions";

  async save(contentItem: ContentItem): Promise<void> {
    const data = contentItem.toObject();

    // Prepare content item row
    const itemRow: ContentItemRow = {
      id: data.id,
      content_model_id: data.contentModelId,
      current_data: JSON.stringify(data.currentData),
      status: data.status,
      created_by: data.createdBy,
      updated_by: data.updatedBy,
      metadata: JSON.stringify(data.metadata),
      created_at: data.createdAt,
      updated_at: data.updatedAt,
    };

    // Use transaction to ensure consistency
    await db.transaction(async (trx) => {
      // Check if exists
      const exists = await trx(this.itemsTable)
        .where({id: itemRow.id})
        .first("id");

      if (exists) {
        // Update content item
        await trx(this.itemsTable).where({id: itemRow.id}).update({
          current_data: itemRow.current_data,
          status: itemRow.status,
          updated_by: itemRow.updated_by,
          metadata: itemRow.metadata,
          updated_at: itemRow.updated_at,
        });

        // Get existing revision numbers
        const existingRevisions = await trx(this.revisionsTable)
          .where({content_item_id: itemRow.id})
          .select("revision_number");

        const existingRevisionNumbers = new Set(
          existingRevisions.map((r) => r.revision_number)
        );

        // Insert new revisions only
        const newRevisions = data.revisions.filter(
          (r) => !existingRevisionNumbers.has(r.revisionNumber)
        );

        if (newRevisions.length > 0) {
          const revisionRows = newRevisions.map((revision) => ({
            id: revision.revisionId,
            content_item_id: itemRow.id,
            revision_number: revision.revisionNumber,
            revision_data: JSON.stringify(revision.contentData),
            comment: revision.comment || null,
            created_by: revision.createdBy,
            created_at: revision.createdAt,
          }));

          await trx(this.revisionsTable).insert(revisionRows);
        }
      } else {
        // Insert content item
        await trx(this.itemsTable).insert(itemRow);

        // Insert all revisions
        const revisionRows = data.revisions.map((revision) => ({
          id: revision.revisionId,
          content_item_id: itemRow.id,
          revision_number: revision.revisionNumber,
          revision_data: JSON.stringify(revision.contentData),
          comment: revision.comment || null,
          created_by: revision.createdBy,
          created_at: revision.createdAt,
        }));

        await trx(this.revisionsTable).insert(revisionRows);
      }
    });
  }

  async findById(id: ContentItemId): Promise<ContentItem | null> {
    const itemRow = await db(this.itemsTable)
      .where({id: id.toString()})
      .first<ContentItemRow>();

    if (!itemRow) {
      return null;
    }

    // Get all revisions for this content item
    const revisionRows = await db(this.revisionsTable)
      .where({content_item_id: itemRow.id})
      .orderBy("revision_number", "asc")
      .select<ContentRevisionRow[]>("*");

    return this.mapRowsToDomain(itemRow, revisionRows);
  }

  async findByModelId(modelId: ContentModelId): Promise<ContentItem[]> {
    const itemRows = await db(this.itemsTable)
      .where({content_model_id: modelId.toString()})
      .orderBy("updated_at", "desc")
      .select<ContentItemRow[]>("*");

    return this.mapMultipleRowsToDomain(itemRows);
  }

  async findByStatus(status: ContentStatus): Promise<ContentItem[]> {
    const itemRows = await db(this.itemsTable)
      .where({status: status.toString()})
      .orderBy("updated_at", "desc")
      .select<ContentItemRow[]>("*");

    return this.mapMultipleRowsToDomain(itemRows);
  }

  async findAll(): Promise<ContentItem[]> {
    const itemRows = await db(this.itemsTable)
      .orderBy("updated_at", "desc")
      .select<ContentItemRow[]>("*");

    return this.mapMultipleRowsToDomain(itemRows);
  }

  async delete(id: ContentItemId): Promise<boolean> {
    // Cascade delete will handle revisions automatically
    const deleted = await db(this.itemsTable)
      .where({id: id.toString()})
      .delete();

    return deleted > 0;
  }

  async existsByModelId(modelId: ContentModelId): Promise<boolean> {
    const row = await db(this.itemsTable)
      .where({content_model_id: modelId.toString()})
      .first("id");

    return !!row;
  }

  async countByModelId(modelId: ContentModelId): Promise<number> {
    const result = await db(this.itemsTable)
      .where({content_model_id: modelId.toString()})
      .count("* as count")
      .first<{count: number}>();

    return result?.count || 0;
  }

  /**
   * Map database rows to ContentItem aggregate
   */
  private mapRowsToDomain(
    itemRow: ContentItemRow,
    revisionRows: ContentRevisionRow[]
  ): ContentItem {
    const currentData =
      typeof itemRow.current_data === "string"
        ? JSON.parse(itemRow.current_data)
        : itemRow.current_data;

    const metadata =
      typeof itemRow.metadata === "string"
        ? JSON.parse(itemRow.metadata)
        : itemRow.metadata;

    const revisions: RevisionProps[] = revisionRows.map((r) => ({
      revisionId: r.id,
      revisionNumber: r.revision_number,
      contentData:
        typeof r.revision_data === "string"
          ? JSON.parse(r.revision_data)
          : r.revision_data,
      comment: r.comment || undefined,
      createdBy: r.created_by,
      createdAt: new Date(r.created_at),
    }));

    return ContentItem.reconstitute(
      itemRow.id,
      itemRow.content_model_id,
      currentData,
      revisions,
      itemRow.status,
      itemRow.created_by,
      itemRow.updated_by,
      metadata,
      new Date(itemRow.created_at),
      new Date(itemRow.updated_at)
    );
  }

  /**
   * Map multiple content items with their revisions
   */
  private async mapMultipleRowsToDomain(
    itemRows: ContentItemRow[]
  ): Promise<ContentItem[]> {
    if (itemRows.length === 0) {
      return [];
    }

    // Get all revisions for these content items in one query
    const itemIds = itemRows.map((r) => r.id);
    const revisionRows = await db(this.revisionsTable)
      .whereIn("content_item_id", itemIds)
      .orderBy("revision_number", "asc")
      .select<ContentRevisionRow[]>("*");

    // Group revisions by content item ID
    const revisionsByItemId = new Map<string, ContentRevisionRow[]>();
    for (const revision of revisionRows) {
      const existing = revisionsByItemId.get(revision.content_item_id) || [];
      existing.push(revision);
      revisionsByItemId.set(revision.content_item_id, existing);
    }

    // Map each content item with its revisions
    return itemRows.map((itemRow) => {
      const revisions = revisionsByItemId.get(itemRow.id) || [];
      return this.mapRowsToDomain(itemRow, revisions);
    });
  }
}
