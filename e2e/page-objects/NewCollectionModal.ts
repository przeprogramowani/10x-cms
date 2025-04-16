import {type Page, type Locator} from "@playwright/test";

export class NewCollectionModal {
  readonly page: Page;
  // Selectors for the modal itself (assuming one exists)
  readonly modal: Locator;
  readonly collectionNameInput: Locator;
  readonly addFieldButton: Locator;
  readonly createCollectionButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Adjust selector if the modal has a more specific identifier
    this.modal = page.locator('[data-testid="new-collection-modal"]'); // Use the specific test-id
    this.collectionNameInput = this.modal.locator(
      '[data-testid="collection-name-input"]'
    );
    this.addFieldButton = this.modal.locator(
      '[data-testid="add-field-button"]'
    );
    this.createCollectionButton = this.modal.locator(
      '[data-testid="create-collection-button"]'
    );
  }

  async waitForModalVisible(): Promise<void> {
    await this.modal.waitFor({state: "visible"});
  }

  async setCollectionName(name: string): Promise<void> {
    await this.collectionNameInput.fill(name);
  }

  // Method to get field inputs dynamically based on index (0-based)
  getFieldNameInput(index: number): Locator {
    return this.modal.locator(`[data-testid="field-name-input-${index}"]`);
  }

  // Method to get type dropdowns dynamically based on index (0-based)
  getFieldTypeSelect(index: number): Locator {
    return this.modal.locator(`[data-testid="field-type-select-${index}"]`);
  }

  async addField(index: number, name: string, type: string): Promise<void> {
    // Click add field button *before* filling details for fields beyond the first one
    if (index > 0) {
      await this.addFieldButton.click();
    }
    await this.getFieldNameInput(index).fill(name);
    await this.getFieldTypeSelect(index).selectOption({label: type});
  }

  async clickCreateCollection(): Promise<void> {
    await this.createCollectionButton.click();
  }
}
