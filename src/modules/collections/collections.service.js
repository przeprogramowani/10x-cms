import db from "../../db/connection.js";

/**
 * Create a new collection with a given name and schema
 */
const createCollection = async (name, schema) => {
  const collection = {
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
const getCollections = async () => {
  return await db("collections").select("*");
};

/**
 * Get a single collection by ID, including its items
 */
const getCollectionById = async (id) => {
  const collection = await db("collections").where({id}).first();
  if (collection) {
    collection.items = await db("items").where({collection_id: id});
  }
  return collection;
};

/**
 * Update a collection
 */
const updateCollection = async (id, updates) => {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await db("collections").where({id}).update(updateData);

  return await getCollectionById(id);
};

/**
 * Delete a collection and all its items (cascading)
 */
const deleteCollection = async (id) => {
  const deleted = await db("collections").where({id}).delete();

  return deleted > 0;
};

export default {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
};
