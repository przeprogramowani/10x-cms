import {type Page, type Locator} from "@playwright/test";
import {BasePage} from "./BasePage";

export class CollectionsPage extends BasePage {
  // Selectors
  readonly createNewCollectionButton: Locator;
  readonly successNotification: Locator;

  constructor(page: Page) {
    super(page, "/collections"); // Set the specific URL path

    // Initialize selectors
    this.createNewCollectionButton = page.locator(
      '[data-testid="create-new-collection-button"]'
    );
    this.successNotification = page.locator(
      '[data-testid="notification-success"]'
    ); // Assuming a common success notification element
  }

  // Methods
  async navigateToCollections(): Promise<void> {
    // Assuming navigation is handled by BasePage or directly via URL for now
    // If there's a specific nav link, add it here later
    await this.navigate();
  }

  async clickCreateNewCollection(): Promise<void> {
    await this.createNewCollectionButton.click();
  }

  getCollectionCardByName(name: string): Locator {
    // This assumes the collection name is within the card identified by data-testid
    // We find the card that *contains* the name text.
    // Note: This is less precise than finding by ID if we knew it, but works with name.
    return this.page.locator(
      `[data-testid^="collection-card-"]:has-text("${name}")`
    );
  }

  getViewCollectionButtonForCardById(collectionId: string): Locator {
    return this.page.locator(
      `[data-testid="view-collection-button-${collectionId}"]`
    );
  }

  getViewCollectionButtonForRow(row: Locator): Locator {
    return row.locator('[data-testid^="view-collection-button-"]'); // Adjusted to use the new dynamic test-id prefix
  }
}
