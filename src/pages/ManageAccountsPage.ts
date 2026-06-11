import { Page, expect } from "@playwright/test";
import { BasePage } from "../core/BasePage.js";

export class ManageAccountsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // The Manage Account index page heading (singular "Manage Account")
  private get heading() {
    return this.page.getByRole("heading", { name: /Manage Account/i });
  }

  // "Add Consumer No." link on Manage Account index page that navigates to the add form
  private get addConsumerNoLink() {
    return this.page.getByRole("link", { name: /Add Consumer/i }).first();
  }

  // The inline "Add Account" section heading on the AddAccount page
  private get addAccountSectionHeading() {
    return this.page.getByRole("heading", { name: "Add Account", exact: true }).first();
  }

  async verifyPageLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 10000 });
  }

  async navigateToManageAccountIndex() {
    // Click the sidebar "Manage Account" link to navigate back to the index page
    await this.page.getByRole("link", { name: "Manage Account" }).first().click();
    await this.verifyPageLoaded();
  }

  async clickAddAccount() {
    // On the Manage Account index page, click "Add Consumer No." to open the add form
    await this.addConsumerNoLink.click();
    // Wait for navigation to the AddAccount page
    await this.page.waitForURL(/AddAccount/i, { timeout: 10000 }).catch(() => {});
  }

  async verifyAddAccountModalVisible() {
    // The "Add Account" section is rendered inline on the AddAccount page (not a modal dialog)
    // Heading is <h5>Add Account</h5>
    const sectionHeading = this.addAccountSectionHeading;
    await expect(sectionHeading).toBeVisible({ timeout: 10000 });

    // Consumer Type dropdown should be visible in the inline form
    const consumerTypeSelect = this.page.getByLabel(/Consumer Type/i);
    await expect(consumerTypeSelect).toBeVisible({ timeout: 10000 });
  }

  async selectConsumerType(type: string) {
    const selectBox = this.page.getByLabel(/Consumer Type/i);
    await expect(selectBox).toBeVisible({ timeout: 10000 });
    await selectBox.selectOption(type);
  }

  async enterNickName(nickName: string) {
    const nickNameInput = this.page.getByLabel(/Nick Name/i).or(this.page.getByPlaceholder(/Nick Name/i)).first();
    await expect(nickNameInput).toBeVisible();
    await nickNameInput.fill(nickName);
  }

  async enterConsumerNumber(consumerNumber: string) {
    const consumerNumberInput = this.page.getByLabel(/Consumer Number|Account Number/i)
      .or(this.page.getByPlaceholder(/Consumer Number|Account Number/i)).first();
    await consumerNumberInput.fill(consumerNumber);
  }

  async requestAndVerifyOtp(otp: string) {
    const getOtpBtn = this.page.getByRole("button", { name: /GET OTP|Send OTP/i }).first();
    await getOtpBtn.click();

    // Wait for OTP dialog to appear (could be "Submit OTP" heading)
    const otpDialog = this.page.getByRole("dialog").first();
    await expect(otpDialog).toBeVisible({ timeout: 10000 });
    
    // Enter OTP - look for segmented textboxes within the dialog
    const otpTextboxes = otpDialog.getByRole("textbox");
    await expect(otpTextboxes.first()).toBeVisible({ timeout: 10000 });
    
    const isSegmented = await otpTextboxes.count() > 1;
    if (isSegmented) {
      await otpTextboxes.first().click();
      await this.page.keyboard.type(otp);
    } else {
      // Fallback: look for a single text input
      const otpInput = this.page.getByPlaceholder(/Enter OTP/i).first()
        .or(this.page.getByRole("textbox").first());
      await otpInput.fill(otp);
    }

    // Click submit/verify button in the dialog
    const submitBtn = otpDialog.getByRole("button", { name: /Submit|Verify/i }).first();
    await submitBtn.click();
  }

  async requestOtpExpectingError(expectedErrorMessage: string | RegExp) {
    const getOtpBtn = this.page.getByRole("button", { name: /GET OTP|Send OTP/i }).first();
    await getOtpBtn.click();
    
    const errorPopup = this.page.getByText(expectedErrorMessage).first();
    await expect(errorPopup).toBeVisible({ timeout: 10000 });
    
    const okBtn = this.page.getByRole("link", { name: /Ok/i }).or(this.page.getByRole("button", { name: /Ok/i })).first();
    if (await okBtn.isVisible().catch(() => false)) await okBtn.click();
    
    const closeBtn = this.page.locator(".btn-close").or(this.page.getByLabel("Close")).first();
    if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
  }

  async clickSearchIcon() {
    const searchBtn = this.page.getByRole("button", { name: /Search/i })
      .or(this.page.locator('i.fa-search, .search-icon, button[aria-label="Search"]')).first();
    await searchBtn.click();
  }

  async handleSearchResults(expectedResult: "success" | "error") {
    if (expectedResult === "success") {
      const addBtn = this.page.getByRole("button", { name: /Add Account|Submit|Save|Link/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 10000 });
      await addBtn.click();
      
      const successMessage = this.page.getByText(/Account added successfully|Success|Successfully/i).first();
      await expect(successMessage).toBeVisible({ timeout: 10000 });
    } else {
      // Can be either a popup or an inline error message
      const errorPopup = this.page.getByText(/Not Found|Invalid|Error|does not exist|Detail not found/i).first();
      await expect(errorPopup).toBeVisible({ timeout: 10000 });
      
      // Dismiss error popup if it's a popup
      const okBtn = this.page.getByRole("link", { name: /Ok/i }).or(this.page.getByRole("button", { name: /Ok/i })).first();
      if (await okBtn.isVisible().catch(() => false)) await okBtn.click();
      
      const closeBtn = this.page.locator(".btn-close").or(this.page.getByLabel("Close")).first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
    }
  }

  async handleSearchAndVerifyMappingExists(expectedMessage: string | RegExp) {
    // The duplicate mapping warning appears after the search result is submitted.
    const addBtn = this.page.getByRole("button", { name: /Add Account|Submit|Save|Link/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const mappingMessage = this.page.getByText(expectedMessage).first();
    await expect(mappingMessage).toBeVisible({ timeout: 10000 });
    
    // Dismiss any popup if present
    const okBtn = this.page.getByRole("link", { name: /Ok/i }).or(this.page.getByRole("button", { name: /Ok/i })).first();
    if (await okBtn.isVisible().catch(() => false)) await okBtn.click();
    
    const closeBtn = this.page.locator(".btn-close").or(this.page.getByLabel("Close")).first();
    if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
  }
}
