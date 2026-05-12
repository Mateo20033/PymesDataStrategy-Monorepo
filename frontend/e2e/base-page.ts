import { Page, expect } from "@playwright/test";

/**
 * Base page class for all page objects
 * Contains shared utilities and navigation helpers
 */
export class BasePage {
  constructor(readonly page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState("networkidle");
  }

  async waitForNavigation(url: string | RegExp): Promise<void> {
    await this.page.waitForURL(url);
  }

  async verifyPageTitle(title: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  async verifyURL(url: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(url);
  }

  async getResponseHeaders(url: string): Promise<Record<string, string>> {
    const response = await this.page.goto(url);
    return response?.headers() ?? {};
  }
}
