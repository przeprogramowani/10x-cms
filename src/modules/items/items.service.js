import db from "../../db/connection.js";

/**
 * Add an item to a collection
 */
const addItemToCollection = async (collectionId, item) => {
  const newItem = {
    id: Date.now().toString(),
    collection_id: collectionId,
    data: item,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db("items").insert(newItem);
  return newItem;
};

/**
 * Update an item in a collection
 */
const updateItemInCollection = async (collectionId, itemId, updates) => {
  const updateData = {
    data: JSON.stringify(updates),
    updated_at: new Date().toISOString(),
  };

  await db("items")
    .where({
      id: itemId,
      collection_id: collectionId,
    })
    .update(updateData);

  return await db("items").where({id: itemId}).first();
};

/**
 * Delete an item from a collection
 */
const deleteItemFromCollection = async (collectionId, itemId) => {
  const deleted = await db("items")
    .where({
      id: itemId,
      collection_id: collectionId,
    })
    .delete();

  return deleted > 0;
};

export default {
  addItemToCollection,
  updateItemInCollection,
  deleteItemFromCollection,
};
