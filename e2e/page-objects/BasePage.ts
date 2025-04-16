import {type Page, type Locator} from "@playwright/test";

export abstract class BasePage {
  readonly page: Page;
  readonly url: string;

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
  }

  async navigate(): Promise<void> {
    await this.page.goto(this.url);
  }

  async waitForLoadState(
    state: "load" | "domcontentloaded" | "networkidle" = "networkidle"
  ): Promise<void> {
    await this.page.waitForLoadState(state);
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }
}
