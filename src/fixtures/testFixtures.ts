import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { ConsumerPortal } from "../pages/ConsumerPortal";
import { RegistrationPage } from "../pages/RegistrationPage";

type Fixtures = {
  loginPage: LoginPage;
  ConsumerPortal: ConsumerPortal;
  registrationPage: RegistrationPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ browserName }, use, testInfo) => {
    const loginPage = new LoginPage();
    await loginPage.openBrowser({
      browserName,
      headless: testInfo.project.use.headless === true,
    });
    await loginPage.goto();
    try {
      await use(loginPage);
    } finally {
      await loginPage.captureScreenshotOnFailure(testInfo);
      await loginPage.closeBrowser();
    }
  },
  ConsumerPortal: async ({ browserName }, use, testInfo) => {
    const consumerPortal = new ConsumerPortal();
    await consumerPortal.openBrowser({
      browserName,
      headless: testInfo.project.use.headless === true,
    });
    await consumerPortal.goto();
    try {
      await use(consumerPortal);
    } finally {
      await consumerPortal.captureScreenshotOnFailure(testInfo);
      await consumerPortal.closeBrowser();
    }
  },
  registrationPage: async ({ browserName }, use, testInfo) => {
    const registrationPage = new RegistrationPage();
    await registrationPage.openBrowser({
      browserName,
      headless: testInfo.project.use.headless === true,
    });
    try {
      await use(registrationPage);
    } finally {
      await registrationPage.captureScreenshotOnFailure(testInfo);
      await registrationPage.closeBrowser();
    }
  },
});

export { expect } from "@playwright/test";
