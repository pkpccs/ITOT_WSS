import { TEST_LOGIN_HOME_URL } from "../../src/config/env.js";
import { test } from "../../src/fixtures/testFixtures.js";
import usersData from "../../src/test-data/users.json" with { type: "json" };
const manageAccountsData = usersData.manageAccountsData;
import { ManageAccountsPage } from "../../src/pages/ManageAccountsPage.js";
import { LoginPage } from "../../src/pages/LoginPage.js";
import type { Page } from "@playwright/test";

const validConsumer = usersData.validConsumer;

test.describe("Manage Accounts Feature", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;
  let manageAccountsPage: ManageAccountsPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const loginPage = new LoginPage(page);
    manageAccountsPage = new ManageAccountsPage(page);
    const mobileNumber = validConsumer.mobile;
    const otp = validConsumer.otp;

    console.log("Setup: Logging in with OTP");
    await loginPage.loginWithOtp(mobileNumber, otp);
    await loginPage.clickVerifyAndSignIn();
    await loginPage.verifyHomePageAfterSuccessfulLogin(TEST_LOGIN_HOME_URL);
    
    console.log("Setup: Navigating to Manage Accounts");
    await manageAccountsPage.navigateToManageAccountIndex();
    await manageAccountsPage.verifyPageLoaded();
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  test("MAT-TC-001 | should login and navigate to Manage Accounts page", async () => {
    // Since the setup handles navigation, this acts as a smoke test for the setup block.
    console.log("✅ MAT-TC-001: Navigation verified successfully in beforeAll hook.");
  });

  test("MAT-TC-002 | should verify Manage Accounts page UI elements", async () => {
    await test.step("Verify UI elements on Manage Accounts page", async () => {
      await manageAccountsPage.verifyPageLoaded();
    });
    console.log("✅ MAT-TC-002: UI elements verified successfully.");
  });

  test("MAT-TC-003 | should attempt to add account and show error for invalid details", async () => {
    const invalidConsumerNumber = manageAccountsData.invalidConsumerNumber; 

    await test.step("Click the 'Add Account' button", async () => {
      await manageAccountsPage.clickAddAccount();
    });

    await test.step("Verify the 'Add Account' form is visible", async () => {
      await manageAccountsPage.verifyAddAccountModalVisible();
    });

    await test.step("Fill consumer details and click GET OTP", async () => {
      await manageAccountsPage.selectConsumerType(manageAccountsData.consumerType);
      await manageAccountsPage.enterNickName(manageAccountsData.nickNameInvalid);
      await manageAccountsPage.enterConsumerNumber(invalidConsumerNumber);
    });

    await test.step("Click GET OTP and verify error message popup for invalid number", async () => {
      await manageAccountsPage.requestOtpExpectingError(/No registered mobile number|Invalid|Not Found/i);
    });
    console.log("✅ MAT-TC-003: Add Account error flow verified successfully.");
  });

  test("MAT-TC-004 | should search for consumer number from test data and show detail not found", async () => {
    const consumerNumber = manageAccountsData.consumerNumberWithRegisteredMobile; 
    const otp = validConsumer.otp;

    await test.step("Navigate back to Manage Account index page", async () => {
      await manageAccountsPage.navigateToManageAccountIndex();
    });

    await test.step("Open the Add Account form", async () => {
      await manageAccountsPage.clickAddAccount();
      await manageAccountsPage.verifyAddAccountModalVisible();
    });

    await test.step("Fill consumer details, verify OTP, click search, and verify detail not found", async () => {
      await manageAccountsPage.selectConsumerType(manageAccountsData.consumerType);
      await manageAccountsPage.enterNickName(manageAccountsData.nickName);
      await manageAccountsPage.enterConsumerNumber(consumerNumber);
      await manageAccountsPage.requestAndVerifyOtp(otp);
      await manageAccountsPage.clickSearchIcon();
      await manageAccountsPage.handleSearchResults("error");
    });

    console.log(`✅ MAT-TC-004: Consumer search for ${consumerNumber} showed detail-not-found as expected.`);
  });

  test("MAT-TC-005 | should show mapping already exists when adding previously added account", async () => {
    const consumerNumber = manageAccountsData.existingConsumerNumber;
    const otp = validConsumer.otp;

    await test.step("Navigate back to Manage Account index page", async () => {
      await manageAccountsPage.navigateToManageAccountIndex();
    });

    await test.step("Open the Add Account form", async () => {
      await manageAccountsPage.clickAddAccount();
      await manageAccountsPage.verifyAddAccountModalVisible();
    });

    await test.step("Fill consumer details, verify OTP, click search, submit add account, and verify mapping exists", async () => {
      await manageAccountsPage.selectConsumerType(manageAccountsData.consumerType);
      await manageAccountsPage.enterNickName(manageAccountsData.nickName);
      await manageAccountsPage.enterConsumerNumber(consumerNumber);
      await manageAccountsPage.requestAndVerifyOtp(otp);
      await manageAccountsPage.clickSearchIcon();
      await manageAccountsPage.handleSearchAndVerifyMappingExists(manageAccountsData.mappingExistsMessage);
    });

    console.log("✅ MAT-TC-005: Mapping already exists error verified successfully.");
  });

  test("MAT-TC-006 | should attempt to add account and search with invalid data", async () => {
    const consumerNumber = manageAccountsData.invalidConsumerNumber;

    await test.step("Navigate back to Manage Account index page", async () => {
      await manageAccountsPage.navigateToManageAccountIndex();
    });

    await test.step("Open the Add Account form", async () => {
      await manageAccountsPage.clickAddAccount();
      await manageAccountsPage.verifyAddAccountModalVisible();
    });

    await test.step("Fill consumer details and click GET OTP", async () => {
      await manageAccountsPage.selectConsumerType(manageAccountsData.consumerType);
      await manageAccountsPage.enterNickName(manageAccountsData.nickNameInvalid);
      await manageAccountsPage.enterConsumerNumber(consumerNumber);
    });

    await test.step("Click GET OTP and verify error message popup", async () => {
      await manageAccountsPage.requestOtpExpectingError(/No registered mobile number|Not Found|Invalid/i);
    });
    console.log("✅ MAT-TC-006: Invalid account error flow verified successfully.");
  });
});
