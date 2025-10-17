import storage from "./storage.js";
import httpClient from "@10xdevspl/http-client";

const getWebhooksForEvent = async (collectionId, eventType) => {
  const webhooks = await storage.getWebhooks(collectionId);
  return webhooks.filter((webhook) => webhook.events.includes(eventType));
};

const callWebhook = async (webhook, data) => {
  return await httpClient.post(webhook.url, data, {
    "Content-Type": "application/json",
    "User-Agent": "10xCMS-Webhook-Service/1.0",
    "X-Webhook-Event": data.event,
  });
};

const notifyWebhooks = async (collectionId, eventType, data) => {
  const webhooks = await getWebhooksForEvent(collectionId, eventType);

  if (!webhooks || webhooks.length === 0) {
    return;
  }

  const collection = await storage.getCollectionById(collectionId);
  if (!collection) {
    console.error(
      `Collection not found for webhook notification: ${collectionId}`
    );
    return;
  }

  const payload = {
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
        `Error calling webhook: ${webhooks[index].url}`,
        result.reason
      );
    }
  });

  console.log(
    "Webhook notification complete with results:",
    results.map((r) => r.status).join(", ")
  );
};

const onItemCreated = async (collectionId, item) => {
  await notifyWebhooks(collectionId, "create", item);
};

const onItemUpdated = async (collectionId, item) => {
  await notifyWebhooks(collectionId, "update", item);
};

const onItemDeleted = async (collectionId, itemId) => {
  await notifyWebhooks(collectionId, "delete", {id: itemId});
};

export default {
  onItemCreated,
  onItemUpdated,
  onItemDeleted,
};
