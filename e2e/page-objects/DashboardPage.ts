import {type Page, type Locator} from "@playwright/test";
import {BasePage} from "./BasePage";

export class DashboardPage extends BasePage {
  readonly welcomeMessage: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page, "/home");

    this.welcomeMessage = page.locator('[data-testid="welcome-message"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
  }
}
