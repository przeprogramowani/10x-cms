import storageModule from "../storage/storage.js";
import collectionsService from "../collections/collections.service.js";
import httpClient from "@10xdevspl/http-client";
import type {
  Webhook,
  WebhookEvent,
  WebhookPayload,
  Item,
  ItemData,
} from "../types.js";

const getWebhooksForEvent = async (
  collectionId: string,
  eventType: WebhookEvent
): Promise<Webhook[]> => {
  const webhooks = await storageModule.getWebhooks(collectionId);
  return webhooks.filter((webhook) => webhook.events.includes(eventType));
};

const callWebhook = async (
  webhook: Webhook,
  data: WebhookPayload
): Promise<unknown> => {
  return await httpClient.post(webhook.url, data, {
    "Content-Type": "application/json",
    "User-Agent": "10xCMS-Webhook-Service/1.0",
    "X-Webhook-Event": data.event,
  });
};

const notifyWebhooks = async (
  collectionId: string,
  eventType: WebhookEvent,
  data: ItemData | Item | { id: string }
): Promise<void> => {
  const webhooks = await getWebhooksForEvent(collectionId, eventType);

  if (!webhooks || webhooks.length === 0) {
    return;
  }

  const collection = await collectionsService.getCollectionById(collectionId);
  if (!collection) {
    console.error(
      `Collection not found for webhook notification: ${collectionId}`
    );
    return;
  }

  const payload: WebhookPayload = {
    event: eventType,
    collection: {
      id: collection.id,
      name: collection.name,
    },
    data,
    timestamp: new Date().toISOString(),
  };

  console.log(
    `Notifying ${webhooks.length} webhooks for ${collection.name} - ${eventType}`
  );

  const promises = webhooks.map((webhook) => callWebhook(webhook, payload));

  const results = await Promise.allSettled(promises);

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Error calling webhook: ${webhooks[index]?.url}`,
        result.reason
      );
    }
  });

  console.log(
    "Webhook notification complete with results:",
    results.map((r) => r.status).join(", ")
  );
};

const onItemCreated = async (collectionId: string, item: Item): Promise<void> => {
  await notifyWebhooks(collectionId, "create", item);
};

const onItemUpdated = async (collectionId: string, item: Item): Promise<void> => {
  await notifyWebhooks(collectionId, "update", item);
};

const onItemDeleted = async (
  collectionId: string,
  itemId: string
): Promise<void> => {
  await notifyWebhooks(collectionId, "delete", { id: itemId });
};

export default {
  onItemCreated,
  onItemUpdated,
  onItemDeleted,
};
