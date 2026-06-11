import { test } from "../../src/fixtures/testFixtures";
import userData from "../../src/test-data/users.json" with { type: "json" };

test.describe("New User Registration Suite", () => {
  test.describe.configure({ mode: "parallel" });

  // Extract static test data once for the entire suite
  const {
    mobile: mobileNumber,
    otp,
    fullName,
    email,
    Userid: userId,
    password,
    invalidEmail,
  } = userData.newRegistrationUser;

  test.beforeEach(async ({ registrationPage }) => {
    await registrationPage.goto();
  });

  test("REG-TC-01 | should successfully register a new consumer", async ({ registrationPage }) => {
    // Increase the timeout for this specific test to 90 seconds to allow time for manual Captcha entry
    test.setTimeout(90_000);

    await test.step("Select user type", async () => {
      await registrationPage.selectUserType();
    });

    await test.step("Fill personal details", async () => {
      await registrationPage.fillPersonalDetails(fullName, email);
    });

    await test.step("Verify mobile and OTP", async () => {
      await registrationPage.verifyMobileAndOtp(mobileNumber, otp);
    });

    await test.step("Proceed to account details", async () => {
      await registrationPage.proceedToAccountDetails();
    });

    await test.step("Fill account credentials", async () => {
      await registrationPage.fillAccountCredentials(userId, password);
    });

    await test.step("Manual captcha entry and auto-submit", async () => {
      // The test will wait here for you to manually fill the captcha, auto-submit, and click Ok.
      await registrationPage.fillCaptchaAndSubmit();
    });
  });
  

  test("REG-TC-02 | should show error for invalid OTP", async ({ registrationPage }) => {
    await test.step("Select user type", async () => {
      await registrationPage.selectUserType();
    });

    await test.step("Fill personal details", async () => {
      await registrationPage.fillPersonalDetails(fullName, email);
    });

    await test.step("Attempt OTP verification with invalid OTP", async () => {
      // Pass an incorrect OTP and verify the application blocks it with an error message
      await registrationPage.verifyMobileAndOtp(mobileNumber, "111111", "Invalid OTP"); // Note: Update "Invalid OTP" if your app uses different text!
    });
  });

  test("REG-TC-03 | should load registration page and display user types", async ({ registrationPage }) => {
    await test.step("Verify user type selection is visible", async () => {
      // Leverages the expectVisible method built into your BasePage class
      await registrationPage.expectVisible(".user-type-item");
    });
  });

  test("REG-TC-04 | should allow entering personal details", async ({ registrationPage }) => {
    await test.step("Select user type", async () => {
      await registrationPage.selectUserType();
    });

    await test.step("Fill personal details", async () => {
      await registrationPage.fillPersonalDetails(fullName, email);
    });
  });

  test("REG-TC-05 | verify if user insert invalid email format", async ({ registrationPage, page }) => {
    await test.step("Select user type", async () => {
      await registrationPage.selectUserType();
    });

    await test.step("Fill personal details", async () => {
      await registrationPage.fillPersonalDetails(fullName, invalidEmail);
      
      // To trigger validation, we can simulate pressing Tab to remove focus from the email field
      await page.keyboard.press("Tab");

      // Verify the alert/error message appears. 
      await registrationPage.expectVisible("text=Please enter a valid email address."); 
    });
  });
});
