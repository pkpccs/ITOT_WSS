import path from "path";
import { mkdir } from "fs/promises";
import { chromium, expect, firefox, webkit } from "@playwright/test";
import type { Browser, BrowserContext, BrowserType, Locator, Page, TestInfo } from "@playwright/test";

type OpenBrowserOptions = {
  browserName?: string;
  headless?: boolean;
  page?: Page;
};

export class BasePage {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private activePage: Page | null = null;
  private usingExternalPage = false;

  constructor(page?: Page) {
    if (page) {
      this.activePage = page;
      this.usingExternalPage = true;
    }
  }

  protected get page(): Page {
    if (!this.activePage) {
      throw new Error("Page is not initialized. Call openBrowser() first.");
    }
    return this.activePage;
  }

  async openBrowser(options?: Page | OpenBrowserOptions) {
    if (this.activePage) {
      return;
    }

    const normalizedOptions =
      options && "goto" in options ? { page: options } : (options ?? {});

    const externalPage = normalizedOptions.page;

    // Preferred path: use Playwright test's injected page so project config is honored.
    if (externalPage) {
      this.activePage = externalPage;
      this.usingExternalPage = true;
      return;
    }

    // Launch a dedicated browser per test so teardown can fully close headed windows.
    this.browser = await this.resolveBrowserType(normalizedOptions.browserName).launch({
      headless: normalizedOptions.headless ?? true,
    });
    this.context = await this.browser.newContext();
    this.activePage = await this.context.newPage();
    this.usingExternalPage = false;
  }

  private resolveBrowserType(browserName?: string): BrowserType {
    switch (browserName) {
      case "firefox":
        return firefox;
      case "webkit":
        return webkit;
      case "chromium":
      default:
        return chromium;
    }
  }

  async openUrl(url: string) {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async closeBrowser() {
    if (this.usingExternalPage) {
      this.activePage = null;
      this.usingExternalPage = false;
      return;
    }

    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    this.activePage = null;
    this.usingExternalPage = false;
  }

  locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  async click(selector: string) {
    await this.locator(selector).click();
  }

  async expectVisible(selector: string) {
    await expect(this.locator(selector)).toBeVisible();
  }

  async captureScreenshotOnFailure(testInfo: TestInfo) {
    if (testInfo.status === testInfo.expectedStatus || !this.activePage) {
      return;
    }

    const screenshotDir = path.join(process.cwd(), "storage", "screenshots");
    await mkdir(screenshotDir, { recursive: true });

    const safeTitle = testInfo.title.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
    const screenshotPath = path.join(screenshotDir, `${safeTitle || "failed_test"}.png`);

    await this.activePage.screenshot({ path: screenshotPath, fullPage: true });
    await testInfo.attach("failure-screenshot", {
      path: screenshotPath,
      contentType: "image/png",
    });
  }
}
