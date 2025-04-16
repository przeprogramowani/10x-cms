import {test, expect} from "@playwright/test";
import {CollectionsPage} from "../page-objects/CollectionsPage";
import {NewCollectionModal} from "../page-objects/NewCollectionModal";

test.describe("Collection Management - Authenticated", () => {
  let collectionsPage: CollectionsPage;
  let newCollectionModal: NewCollectionModal;

  test.beforeEach(({page}) => {
    collectionsPage = new CollectionsPage(page);
    newCollectionModal = new NewCollectionModal(page);
  });

  test("should allow a user to create a new collection", async ({page}) => {
    const collectionName = "Notes";

    // 1. Navigate to the collections page
    await collectionsPage.navigateToCollections();
    await collectionsPage.waitForLoadState("domcontentloaded");

    // 2. Click the "Create New Collection" button
    await collectionsPage.clickCreateNewCollection();
    await newCollectionModal.waitForModalVisible();

    // 3. Enter collection name
    await newCollectionModal.setCollectionName(collectionName);

    // 4. Add first field
    await newCollectionModal.addField(0, "Title", "Text (Short)");

    // 5. Click "Add Field" (handled within addField method for index > 0)
    // 6. Add second field
    await newCollectionModal.addField(1, "Description", "Text (Long)");

    // 7. Click "Add Field" (handled within addField method for index > 0)
    // 8. Add third field
    await newCollectionModal.addField(2, "Date", "Date");

    // 9. Click the "Create Collection" button
    await newCollectionModal.clickCreateCollection();

    // Expected Outcomes / Assertions
    await collectionsPage.waitForLoadState("domcontentloaded");

    // - User is redirected to the collections page
    await expect(page).toHaveURL(collectionsPage.url);

    // - A new collection named "Notes" is listed
    const collectionCard =
      collectionsPage.getCollectionCardByName(collectionName);
    await expect(collectionCard).toBeVisible();

    // - A success notification "Collection created successfully!" is displayed
    //   (Selector added in CollectionsPage, assuming it appears there)
    await expect(collectionsPage.successNotification).toBeVisible();
    await expect(collectionsPage.successNotification).toHaveText(
      "Collection created successfully!"
    );
  });
});
