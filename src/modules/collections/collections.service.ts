import db from "../../db/connection.js";
import type {
  Collection,
  CollectionSchema,
  CollectionRow,
  ItemRow,
} from "../types.js";

/**
 * Create a new collection with a given name and schema
 */
const createCollection = async (
  name: string,
  schema?: CollectionSchema
): Promise<Collection> => {
  const collection: Collection = {
    id: Date.now().toString(),
    name,
    schema: schema || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db("collections").insert(collection);
  return collection;
};

/**
 * Get all collections
 */
const getCollections = async (): Promise<Collection[]> => {
  return await db("collections").select<Collection[]>("*");
};

/**
 * Get a single collection by ID, including its items
 */
const getCollectionById = async (id: string): Promise<Collection | undefined> => {
  const collection = await db("collections")
    .where({ id })
    .first<CollectionRow>();

  if (collection) {
    const items = await db("items")
      .where({ collection_id: id })
      .select<ItemRow[]>("*");

    const parsedCollection: Collection = {
      ...collection,
      schema:
        typeof collection.schema === "string"
          ? JSON.parse(collection.schema)
          : collection.schema,
      items: items.map((item) => ({
        ...item,
        data: typeof item.data === "string" ? JSON.parse(item.data) : item.data,
      })),
    };

    return parsedCollection;
  }

  return undefined;
};

/**
 * Update a collection
 */
const updateCollection = async (
  id: string,
  updates: Partial<Omit<Collection, "id" | "created_at" | "updated_at">>
): Promise<Collection | undefined> => {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await db("collections").where({ id }).update(updateData);

  return await getCollectionById(id);
};

/**
 * Delete a collection and all its items (cascading)
 */
const deleteCollection = async (id: string): Promise<boolean> => {
  const deleted = await db("collections").where({ id }).delete();

  return deleted > 0;
};

export default {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
};
