import db from "../../db/connection.js";

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

const getCollections = async () => {
  return await db("collections").select("*");
};

const getCollectionById = async (id) => {
  const collection = await db("collections").where({id}).first();
  if (collection) {
    collection.items = await db("items").where({collection_id: id});
  }
  return collection;
};

const updateCollection = async (id, updates) => {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await db("collections").where({id}).update(updateData);

  return await getCollectionById(id);
};

const deleteCollection = async (id) => {
  const deleted = await db("collections").where({id}).delete();

  return deleted > 0;
};

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

const deleteItemFromCollection = async (collectionId, itemId) => {
  const deleted = await db("items")
    .where({
      id: itemId,
      collection_id: collectionId,
    })
    .delete();

  return deleted > 0;
};

const getWebhooks = async (collectionId) => {
  const webhooks = await db("webhooks")
    .where({collection_id: collectionId})
    .select("*");
  return webhooks.map((webhook) => {
    if (typeof webhook.events === "string") {
      try {
        webhook.events = JSON.parse(webhook.events);
      } catch (e) {
        webhook.events = [];
      }
    }
    return webhook;
  });
};

const addWebhook = async (collectionId, url, events) => {
  const webhook = {
    id: Date.now().toString(),
    collection_id: collectionId,
    url,
    events: JSON.stringify(events),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db("webhooks").insert(webhook);
  return {
    ...webhook,
    events, // Return the original array for the response
  };
};

const deleteWebhook = async (webhookId) => {
  const deleted = await db("webhooks").where({id: webhookId}).delete();

  return deleted > 0;
};

const initializeStorage = async () => {
  await db.migrate.latest();
};

export default {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  addItemToCollection,
  updateItemInCollection,
  deleteItemFromCollection,
  getWebhooks,
  addWebhook,
  deleteWebhook,
  initializeStorage,
};
