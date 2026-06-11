import { TEST_LOGIN_HOME_URL } from "../../src/config/env";
import { test } from "../../src/fixtures/testFixtures";
import userData from "../../src/test-data/users.json" with { type: "json" };

test.describe("Consumer portal login page core suite", () => {
  test("LOG-TC-001 | open consumer portal and verify login title", async ({ loginPage }) => {
    await loginPage.verifyTitle();
  });
});

test.describe("Consumer portal login page smoke suite", () => {
  test("LOG-TC-002 | should load login page with expected title", async ({ loginPage }) => {
    await loginPage.verifyTitle();
  });

  test("LOG-TC-003 | should show OTP login controls", async ({ loginPage }) => {
    await loginPage.openOtpLogin();
    await loginPage.verifyOtpSection();
  });

  test("LOG-TC-004 | should show password login controls", async ({ loginPage }) => {
    await loginPage.openPasswordLogin();
    await loginPage.verifyPasswordSection();
  });

  test("LOG-TC-005 | should open forgot password panel", async ({ loginPage }) => {
    await loginPage.openForgotPassword();
    await loginPage.verifyForgotPasswordSection();
  });

  test("LOG-TC-006 | should expose quick pay public link", async ({ loginPage }) => {
    await loginPage.verifyQuickPayLink();
  });
});

test.describe("Consumer portal login page extended suite", () => {
  test("LOG-TC-007 | should show OTP mobile input placeholder", async ({ loginPage }) => {
    await loginPage.verifyOtpMobilePlaceholder();
  });

  test("LOG-TC-008 | should show password login placeholders", async ({ loginPage }) => {
    await loginPage.verifyPasswordFieldPlaceholders();
  });
  

  test("LOG-TC-009 | should list bill and payments menu links", async ({ loginPage }) => {
    await loginPage.verifyBillAndPaymentsLinks();
  });

  test("LOG-TC-010 | should list complaint menu links", async ({ loginPage }) => {
    await loginPage.verifyComplaintLinks();
  });

  test("LOG-TC-011 | should expose public contact links", async ({ loginPage }) => {
    await loginPage.verifyPublicContactLinks();
  });

  test("LOG-TC-012 | should expose register link", async ({ loginPage }) => {
    await loginPage.verifyRegisterLink();
  });

  test("LOG-TC-013 | should login with OTP flow - enter mobile and verify OTP popup", async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.openOtpLogin();
    await loginPage.enterMobileNumber(userData.validConsumer.mobile);
    await loginPage.clickSendOtpButton();
    await loginPage.enterOtp(userData.validConsumer.otp);
  });

  test("LOG-TC-014 | should complete OTP login flow with mobile number and OTP", async ({ loginPage }) => {
    await loginPage.loginWithOtp(userData.validConsumer.mobile, userData.validConsumer.otp);
  });

  test('LOG-TC-015 | should display "Error: Invalid OTP" for wrong OTP', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.openOtpLogin();
    await loginPage.enterMobileNumber(userData.validConsumer.mobile);
    await loginPage.clickSendOtpButton();
    await loginPage.enterOtp("111111");
    await loginPage.clickVerifyAndSignIn();
    await loginPage.verifyInvalidOtpError();
  });

  test("LOG-TC-016 | should verify home page after successful OTP login", async ({ loginPage }) => {
    const proc = (globalThis as any).process;
    const mobileNumber = proc?.env?.TEST_LOGIN_MOBILE ?? userData.validConsumer.mobile;
    const validOtp = proc?.env?.TEST_LOGIN_VALID_OTP ?? userData.validConsumer.otp;
    const expectedHomeUrl = proc?.env?.TEST_LOGIN_HOME_URL ?? TEST_LOGIN_HOME_URL;

    await loginPage.goto();
    await loginPage.openOtpLogin();
    await loginPage.enterMobileNumber(mobileNumber);
    await loginPage.clickSendOtpButton();
    await loginPage.enterOtp(validOtp);
    await loginPage.clickVerifyAndSignIn();
    await loginPage.verifyHomePageAfterSuccessfulLogin(expectedHomeUrl);
  });
});
