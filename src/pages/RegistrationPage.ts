import { expect } from "@playwright/test";
import { BASE_URL } from "../config/env";
import { BasePage } from "../core/BasePage";

export class RegistrationPage extends BasePage {
  async goto() {
    await this.openUrl(BASE_URL);
    await this.page.getByRole("link", { name: "Register here" }).click();
  }

  async selectUserType() {
    await this.page.locator(".user-type-item").first().click();
    await this.page.getByRole("button", { name: "Continue" }).click();
  }

  async fillPersonalDetails(fullName: string, email: string) {
    await this.page.getByLabel("Select prefix").selectOption("Mr");
    await this.page.getByRole("textbox", { name: "Full Name*" }).fill(fullName);
    await this.page.getByRole("textbox", { name: "Email Address*" }).fill(email);
  }

  async verifyMobileAndOtp(mobileNumber: string, otp: string, expectedErrorMessage?: string) {
    await this.page.getByRole("textbox", { name: "Enter Mobile Number" }).fill(mobileNumber);
    await this.page.getByRole("button", { name: "GET OTP" }).click();

    const otpDialog = this.page.getByRole("dialog");
    await expect(otpDialog).toBeVisible({ timeout: 10000 });
    const otpDigits = otpDialog.getByRole("textbox");
    await otpDigits.first().click();
    await this.page.keyboard.type(otp);

    await this.page.getByRole("button", { name: "Submit" }).click();

    if (expectedErrorMessage) {
      await expect(this.page.getByText(expectedErrorMessage, { exact: false })).toBeVisible({ timeout: 10000 });
    }
  }

  async proceedToAccountDetails() {
    await this.page.getByRole("button", { name: "Next Step" }).click();
  }

  async fillAccountCredentials(userId: string, password: string) {
    await this.page.getByRole("textbox", { name: "User Id*" }).fill(userId);
    await this.page.getByRole("textbox", { name: "Password*", exact: true }).fill(password);
    await this.page.getByRole("textbox", { name: "Confirm Password*" }).fill(password);
  }

  async fillCaptchaAndSubmit() {
    // Wait up to 60 seconds for the user to manually type a 6-character captcha.
    const captchaInput = this.page.getByRole("textbox", { name: "Captcha*" });
    await expect(captchaInput).toHaveValue(/.{6}/, { timeout: 60000 });

    // Automatically click the Final Submit button once 6 characters are detected
    await this.page.getByRole("button", { name: "Final Submit " }).click();

    // Verify the success popup text and click Ok. If not visible, the test will fail with these messages.
    await expect(this.page.getByText('Successful', { exact: true }), "Success popup title was not visible").toBeVisible({ timeout: 15000 });
    await expect(this.page.getByText('User has been successfully'), "Success popup message was not visible").toBeVisible();
    await this.page.getByRole("link", { name: "Ok" }).click();
  }
}
