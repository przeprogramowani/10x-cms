/**
 * Content Studio Schema Migration
 * Creates tables for Content Models, Content Items, and Content Revisions
 * Part of the Content Studio Bounded Context (DDD implementation)
 */

export const up = (knex) => {
  return knex.schema
    .createTable("content_models", (table) => {
      table.string("id").primary();
      table.string("name").notNullable();
      table.text("description");
      table.json("fields").notNullable(); // Array of FieldDefinition objects
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.fn.now());

      // Indexes
      table.index("name");
    })
    .createTable("content_items", (table) => {
      table.string("id").primary();
      table.string("content_model_id").notNullable();
      table.json("current_data").notNullable(); // Current revision data
      table.string("status").notNullable(); // DRAFT, READY_FOR_REVIEW, PUBLISHED, ARCHIVED
      table.string("created_by").notNullable();
      table.string("updated_by").notNullable();
      table.json("metadata"); // Additional metadata
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table.timestamp("updated_at").defaultTo(knex.fn.now());

      // Foreign key
      table
        .foreign("content_model_id")
        .references("content_models.id")
        .onDelete("RESTRICT"); // Prevent deletion of model if items exist

      // Indexes
      table.index("content_model_id");
      table.index("status");
      table.index("created_by");
      table.index("updated_at");
    })
    .createTable("content_revisions", (table) => {
      table.string("id").primary();
      table.string("content_item_id").notNullable();
      table.integer("revision_number").notNullable();
      table.json("revision_data").notNullable(); // Snapshot of content at this revision
      table.text("comment"); // What changed in this revision
      table.string("created_by").notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());

      // Foreign key
      table
        .foreign("content_item_id")
        .references("content_items.id")
        .onDelete("CASCADE"); // Delete revisions when content item is deleted

      // Indexes
      table.index("content_item_id");
      table.index(["content_item_id", "revision_number"]);

      // Ensure unique revision numbers per content item
      table.unique(["content_item_id", "revision_number"]);
    });
};

export const down = (knex) => {
  return knex.schema
    .dropTable("content_revisions")
    .dropTable("content_items")
    .dropTable("content_models");
};
