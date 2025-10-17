import db from "../../db/connection.js";
import type { Item, ItemData, ItemRow } from "../types.js";

/**
 * Add an item to a collection
 */
const addItemToCollection = async (
  collectionId: string,
  item: ItemData
): Promise<Item> => {
  const newItem: Item = {
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
const updateItemInCollection = async (
  collectionId: string,
  itemId: string,
  updates: ItemData
): Promise<Item | undefined> => {
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

  const item = await db("items").where({ id: itemId }).first<ItemRow>();

  if (item) {
    return {
      ...item,
      data: typeof item.data === "string" ? JSON.parse(item.data) : item.data,
    };
  }

  return undefined;
};

/**
 * Delete an item from a collection
 */
const deleteItemFromCollection = async (
  collectionId: string,
  itemId: string
): Promise<boolean> => {
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
