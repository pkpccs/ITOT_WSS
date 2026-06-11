import { expect } from "@playwright/test";
import { BASE_URL } from "../config/env";
import { BasePage } from "../core/BasePage";

export class LoginPage extends BasePage {
  async goto() {
    await this.openUrl(BASE_URL);
  }

  async verifyTitle() {
    await expect(this.page).toHaveTitle("Login : Consumer Portal");
  }

  async openOtpLogin() {
    await this.page.getByRole("button", { name: "Login with OTP" }).click();
  }

  async openPasswordLogin() {
    await this.page.getByRole("button", { name: "Login with Password" }).click();
  }

  async verifyOtpSection() {
    await this.expectVisible("#otpIdentifierInput");
    await this.expectVisible("#btnSendOtp");
  }

  async verifyPasswordSection() {
    await expect(this.page.locator("#passwordUserIdInput")).toBeVisible();
    await expect(this.page.locator("#passwordPasswordInput")).toBeVisible();
    await expect(this.page.getByRole("button", { name: "Sign In" })).toBeVisible();
  }

  async openForgotPassword() {
    await this.openPasswordLogin();
    await this.page.locator("a", { hasText: "Forgot Password?" }).first().click();
  }

  async verifyForgotPasswordSection() {
    await expect(this.page.locator("#fpUserId")).toBeVisible();
    await expect(this.page.locator("#sendOtpBtn")).toBeVisible();
  }

  async verifyQuickPayLink() {
    await this.page.locator("button", { hasText: "Bill & Payments" }).first().click();
    const quickPay = this.page.locator('a[href="/Public/QuickPay/Pay"]').first();
    await expect(quickPay).toBeVisible();
    await expect(quickPay).toHaveAttribute("href", "/Public/QuickPay/Pay");
  }

  async openQuickPayFromBillAndPayments() {
    await this.page.locator("button", { hasText: "Bill & Payments" }).first().click();
    await this.page.locator('a[href="/Public/QuickPay/Pay"]').first().click();
    await expect(this.page).toHaveURL(/\/Public\/QuickPay\/Pay/i);
  }

  async verifyOtpMobilePlaceholder() {
    await this.openOtpLogin();
    await expect(this.page.locator("#otpIdentifierInput")).toHaveAttribute("placeholder", "Enter Mobile Number");
  }

  async verifyPasswordFieldPlaceholders() {
    await this.openPasswordLogin();
    await expect(this.page.locator("#passwordUserIdInput")).toHaveAttribute("placeholder", "User Id");
    await expect(this.page.locator("#passwordPasswordInput")).toHaveAttribute("placeholder", "Password");
  }

  async verifyBillAndPaymentsLinks() {
    await this.page.locator("button", { hasText: "Bill & Payments" }).first().click();
    await expect(this.page.locator('a[href="/Public/QuickPay/Pay"]').first()).toBeVisible();
    await expect(this.page.locator('a[href="/Public/BillStatus/Index"]').first()).toBeVisible();
    await expect(this.page.locator('a[href="/Public/BillCalculator/Index"]').first()).toBeVisible();
  }

  async verifyComplaintLinks() {
    await this.page.locator("button", { hasText: "Complaints" }).first().click();
    await expect(this.page.locator('a[href="/Public/ComplaintDetail/RaiseComplaint"]').first()).toBeVisible();
    await expect(this.page.locator('a[href="/Public/ComplaintDetail/Status"]').first()).toBeVisible();
  }

  async verifyPublicContactLinks() {
    const helpline = this.page.locator('a[href="tel:1912"]').first();
    const whatsapp = this.page.locator('a[href="https://wa.me/919496001912"]').first();
    await expect(helpline).toBeVisible();
    await expect(whatsapp).toBeVisible();
  }

  async verifyRegisterLink() {
    const register = this.page.locator('a[href="Public/Account/RegisterUser"]').first();
    await expect(register).toBeVisible();
    await expect(register).toHaveAttribute("href", "Public/Account/RegisterUser");
  }

  async enterMobileNumber(mobileNumber: string) {
    await this.page.locator("#otpIdentifierInput").fill(mobileNumber);
  }

  async clickSendOtpButton() {
    await this.page.locator("#btnSendOtp").click();
  }

  async enterOtp(otp: string) {
    const otpDialog = this.page.getByRole("dialog");
    await expect(otpDialog).toBeVisible({ timeout: 10000 });

    const otpDigits = otpDialog.getByRole("textbox");
    await expect(otpDigits).toHaveCount(6, { timeout: 10000 });

    const normalizedOtp = otp.trim();
    if (normalizedOtp.length !== 6) {
      throw new Error(`OTP must be exactly 6 digits. Received length: ${normalizedOtp.length}`);
    }

    // This OTP widget auto-advances focus only on real keyboard input.
    await otpDigits.first().click();
    await this.page.keyboard.type(normalizedOtp);
  }

  async clickVerifyAndSignIn() {
    const otpDialog = this.page.getByRole("dialog");
    const verifyAndSignInButton = otpDialog.getByRole("button", { name: /Verify\s*&\s*Sign In/i });
    await expect(verifyAndSignInButton).toBeEnabled({ timeout: 10000 });
    await verifyAndSignInButton.click();
  }

  async verifyInvalidOtpError() {
    await expect(this.page.getByText("Error: Invalid OTP")).toBeVisible({ timeout: 10000 });
  }

  async verifyHomePageAfterSuccessfulLogin(expectedUrl?: string) {
    if (expectedUrl) {
      await expect(this.page).toHaveURL(expectedUrl, { timeout: 15000 });
    } else {
      await expect(this.page).not.toHaveTitle("Login : Consumer Portal", { timeout: 15000 });
    }

    await expect(this.page.getByRole("button", { name: "Login with OTP" })).toBeHidden({ timeout: 10000 });
    await expect(this.page.getByRole("button", { name: "Login with Password" })).toBeHidden({ timeout: 10000 });
  }

  async loginWithOtp(mobileNumber: string, otp: string) {
    await this.goto();
    await this.openOtpLogin();
    await this.enterMobileNumber(mobileNumber);
    await this.clickSendOtpButton();
    await this.enterOtp(otp);
  }
}
