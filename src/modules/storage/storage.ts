import db from "../../db/connection.js";
import type {
  Collection,
  CollectionSchema,
  Item,
  ItemData,
  Webhook,
  WebhookEvent,
  CollectionRow,
  ItemRow,
  WebhookRow,
} from "../types.js";

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

const getCollections = async (): Promise<Collection[]> => {
  return await db("collections").select<Collection[]>("*");
};

const getCollectionById = async (id: string): Promise<Collection | undefined> => {
  const collection = await db("collections")
    .where({ id })
    .first<CollectionRow>();

  if (collection) {
    const items = await db("items")
      .where({ collection_id: id })
      .select<ItemRow[]>("*");

    // Parse JSON fields
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

const deleteCollection = async (id: string): Promise<boolean> => {
  const deleted = await db("collections").where({ id }).delete();

  return deleted > 0;
};

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

const getWebhooks = async (collectionId: string): Promise<Webhook[]> => {
  const webhooks = await db("webhooks")
    .where({ collection_id: collectionId })
    .select<WebhookRow[]>("*");

  return webhooks.map((webhook) => {
    let events: WebhookEvent[];

    if (typeof webhook.events === "string") {
      try {
        events = JSON.parse(webhook.events);
      } catch (e) {
        events = [];
      }
    } else {
      events = webhook.events;
    }

    return {
      ...webhook,
      events,
    };
  });
};

const addWebhook = async (
  collectionId: string,
  url: string,
  events: WebhookEvent[]
): Promise<Webhook> => {
  const webhook: Webhook = {
    id: Date.now().toString(),
    collection_id: collectionId,
    url,
    events,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Store events as JSON string in database
  await db("webhooks").insert({
    ...webhook,
    events: JSON.stringify(events),
  });

  return webhook;
};

const deleteWebhook = async (webhookId: string): Promise<boolean> => {
  const deleted = await db("webhooks").where({ id: webhookId }).delete();

  return deleted > 0;
};

const initializeStorage = async (): Promise<void> => {
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
