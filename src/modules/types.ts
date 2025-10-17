/**
 * Shared TypeScript types and interfaces for the 10xCMS modules
 */

/**
 * Represents a collection with its schema and metadata
 */
export interface Collection {
  id: string;
  name: string;
  schema: CollectionSchema;
  created_at: string;
  updated_at: string;
  items?: Item[];
}

/**
 * Schema definition for a collection
 * Maps field names to their types
 */
export interface CollectionSchema {
  [fieldName: string]: FieldType;
}

/**
 * Supported field types in a collection schema
 */
export type FieldType = "string" | "text" | "number" | "date" | "media";

/**
 * Represents an item within a collection
 */
export interface Item {
  id: string;
  collection_id: string;
  data: ItemData;
  created_at: string;
  updated_at: string;
}

/**
 * Data stored in an item (dynamic structure based on collection schema)
 */
export interface ItemData {
  [key: string]: string | number | undefined;
}

/**
 * Represents a webhook configuration
 */
export interface Webhook {
  id: string;
  collection_id: string;
  url: string;
  events: WebhookEvent[];
  created_at: string;
  updated_at: string;
}

/**
 * Webhook event types
 */
export type WebhookEvent = "create" | "update" | "delete";

/**
 * Payload sent to webhooks
 */
export interface WebhookPayload {
  event: WebhookEvent;
  collection: {
    id: string;
    name: string;
  };
  data: ItemData | { id: string };
  timestamp: string;
}

/**
 * Represents a media item in the library
 */
export interface MediaItem {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  description: string;
  uploadDate: string;
}

/**
 * Database row type for collections (with JSON fields as strings)
 */
export interface CollectionRow {
  id: string;
  name: string;
  schema: string | CollectionSchema;
  created_at: string;
  updated_at: string;
}

/**
 * Database row type for items (with JSON fields as strings)
 */
export interface ItemRow {
  id: string;
  collection_id: string;
  data: string | ItemData;
  created_at: string;
  updated_at: string;
}

/**
 * Database row type for webhooks (with JSON fields as strings)
 */
export interface WebhookRow {
  id: string;
  collection_id: string;
  url: string;
  events: string | WebhookEvent[];
  created_at: string;
  updated_at: string;
}
