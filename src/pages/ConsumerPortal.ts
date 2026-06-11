import { expect } from "@playwright/test";
import { BASE_URL } from "../config/env";
import { BasePage } from "../core/BasePage";

export type ComplaintRegistrationData = {
  complaintType: string;
  complaintSubType: string;
  problemDescription: string;
  consumerNumber: string;
  contactPerson: string;
  mobile: string;
  landmark: string;
  address: string;
  district: string;
  section: string;
  securityCode: string;
};

type ComplaintSubmissionMockState = {
  acknowledgementPath: string;
  successMessage: string;
  ticketNumber: string;
  submittedPayload: Record<string, string>;
};

export class ConsumerPortal extends BasePage {
  private readonly billStatusConsumerInputSelector = "#ConsumerNo";
  private readonly billStatusGetOtpButtonSelector = "#btnSearch";
  private readonly billStatusResultsButtonSelector = "#btnResult";
  private complaintSubmissionMockState: ComplaintSubmissionMockState | null = null;

  private logStep(message: string) {
    console.log(`[ConsumerPortal] ${message}`);
  }

  private get billStatusConsumerInput() {
    return this.page.locator(this.billStatusConsumerInputSelector);
  }

  private get billStatusGetOtpButton() {
    return this.page.locator(this.billStatusGetOtpButtonSelector);
  }

  private get billStatusResultsButton() {
    return this.page.locator(this.billStatusResultsButtonSelector);
  }

  private get otpDialog() {
    return this.page.getByRole("dialog");
  }

  async goto() {
    await this.openUrl(BASE_URL);
  }

  async openBillStatusFromBillAndPaymentsMenu() {
    this.logStep("Opening Bill Status from Bill & Payments menu");
    await this.goto();
    try {
      const billAndPaymentsButton = this.page.getByRole("button", { name: /Bill & Payments/i }).first();
      await expect(billAndPaymentsButton).toBeVisible();
      await billAndPaymentsButton.scrollIntoViewIfNeeded();
      await billAndPaymentsButton.click({ force: true, timeout: 10000 });

      const billStatusLink = this.page.getByRole("link", { name: "Bill Status" }).first();
      await expect(billStatusLink).toBeVisible();
      await billStatusLink.click();
    } catch (error) {
      this.logStep(`Bill & Payments menu navigation failed, falling back to direct Bill Status URL: ${String(error)}`);
      await this.openUrl(new URL("/Public/BillStatus/Index", BASE_URL).toString());
    }

    await this.verifyBillStatusPageLoaded();
  }

  async openBillStatusPage() {
    this.logStep("Opening Bill Status page directly");
    await this.openUrl(new URL("/Public/BillStatus/Index", BASE_URL).toString());
    await this.verifyBillStatusPageLoaded();
  }

  async verifyBillStatusPageLoaded() {
    this.logStep("Verifying Bill Status page");
    await expect(this.page).toHaveURL(/\/Public\/BillStatus\/Index/i);
    await expect(this.page.getByText("Check Your Bill Status", { exact: true })).toBeVisible();
    await this.page.waitForLoadState("networkidle");
  }

  async openQuickPayPage() {
    await this.page.locator("button", { hasText: "Bill & Payments" }).first().click();
    await this.page.locator('a[href="/Public/QuickPay/Pay"]').first().click();
    await expect(this.page).toHaveURL(/\/Public\/QuickPay\/Pay/i);
  }

  async openQuickPayFromBillAndPayments(consumerNumber?: string) {
    await this.openQuickPayPage();

    if (consumerNumber) {
      await this.enterConsumerNumber(consumerNumber);
    }
  }

  async verifyQuickPayPageControls() {
    await expect(this.page.locator("#txtAccountNo")).toBeVisible();
    await expect(this.page.locator("#txtAccountNo")).toHaveAttribute("placeholder", "Consumer Number");
    await expect(this.page.locator("#MobileNo")).toBeVisible();
    await expect(this.page.locator("#MobileNo")).toHaveAttribute("placeholder", "Mobile Number");
    await expect(this.page.locator("#DNT_CaptchaInputText")).toBeAttached();
    await expect(this.page.locator("#btnSearch")).toBeVisible();
    await expect(this.page.locator("#btnSearch")).toContainText("GET OTP");
  }

  async enterConsumerNumber(consumerNumber: string) {
    const consumerNumberInput = this.page.locator("#txtAccountNo");
    await expect(consumerNumberInput).toBeVisible();
    await consumerNumberInput.fill(consumerNumber);
    await expect(consumerNumberInput).toHaveValue(consumerNumber);
  }

  async enterMobileNumber(mobileNumber: string) {
    const mobileNumberInput = this.page.locator("#MobileNo");
    await expect(mobileNumberInput).toBeVisible();
    await mobileNumberInput.fill(mobileNumber);
    await expect(mobileNumberInput).toHaveValue(mobileNumber);
  }

  async clickSendOtpButton() {
    await this.page.locator("#btnSearch").click();
  }

  async enterOtp(otp: string) {
    const otpDialog = this.page.getByRole("dialog");
    await expect(otpDialog).toBeVisible({ timeout: 10000 });

    const otpDigits = otpDialog.getByRole("textbox");
    await expect(otpDigits).toHaveCount(6, { timeout: 10000 });

    await otpDigits.first().click();
    await this.page.keyboard.type(otp.trim());
  }

  async verifyOtp() {
    const otpDialog = this.page.getByRole("dialog");
    const verifyButton = otpDialog.getByRole("button", { name: /Verify/i }).first();
    await expect(verifyButton).toBeEnabled({ timeout: 10000 });
    await verifyButton.click();
  }

  async enterCaptcha(captcha: string) {
    await this.page.locator("#DNT_CaptchaInputText").fill(captcha);
  }

  async enterBillStatusConsumerNumber(consumerNumber: string) {
    this.logStep(`Entering Bill Status consumer number: ${consumerNumber}`);
    await expect(this.billStatusConsumerInput).toBeVisible();
    await this.billStatusConsumerInput.fill(consumerNumber);
    await expect(this.billStatusConsumerInput).toHaveValue(consumerNumber);
  }

  async verifyBillStatusOtpButtonDisabled() {
    this.logStep("Verifying GET OTP button is disabled");
    await expect(this.billStatusGetOtpButton).toBeDisabled();
  }

  async verifyBillStatusConsumerValidationError() {
    this.logStep("Verifying consumer number validation message");
    const validationState = await this.billStatusConsumerInput.evaluate((element) => {
      const input = element as HTMLInputElement;
      return {
        message: input.validationMessage,
        valid: input.checkValidity(),
      };
    });

    expect(validationState.valid).toBe(false);
    expect(validationState.message).not.toBe("");
  }

  async verifyBillStatusConsumerValidationMessage(expectedMessage: RegExp) {
    const validationState = await this.billStatusConsumerInput.evaluate((element) => {
      const input = element as HTMLInputElement;
      return {
        message: input.validationMessage,
        valid: input.checkValidity(),
      };
    });

    expect(validationState.valid).toBe(false);
    expect(validationState.message).toMatch(expectedMessage);
  }

  async verifyBillStatusPageControls() {
    this.logStep("Verifying Bill Status page controls");
    await expect(this.billStatusConsumerInput).toBeVisible();
    await expect(this.billStatusConsumerInput).toBeEnabled();
    await expect(this.billStatusConsumerInput).toHaveAttribute("placeholder", "13 digit consumer number");
    await expect(this.billStatusConsumerInput).toHaveAttribute("maxlength", "13");
    await expect(this.billStatusConsumerInput).toHaveAttribute("pattern", "[0-9]{13}");
    await expect(this.billStatusGetOtpButton).toBeVisible();
    await expect(this.billStatusGetOtpButton).toContainText("GET OTP");
    await expect(this.billStatusResultsButton).toBeVisible();
    await expect(this.billStatusResultsButton).toBeDisabled();
  }

  async requestBillStatusOtp() {
    this.logStep("Requesting OTP for Bill Status");
    await this.clickBillStatusGetOtpButton();
    await this.verifyBillStatusOtpPopupDisplayed();
  }

  async clickBillStatusGetOtpButton() {
    this.logStep("Clicking GET OTP button");
    await expect(this.billStatusGetOtpButton).toBeVisible();
    await expect(this.billStatusGetOtpButton).toBeEnabled();
    await this.page.waitForLoadState("networkidle");
    await this.billStatusGetOtpButton.click();
  }

  async verifyBillStatusOtpPopupDisplayed() {
    this.logStep("Verifying OTP popup is displayed");
    await expect(this.otpDialog).toBeVisible({ timeout: 10000 });
    await expect(this.otpDialog.getByText(/OTP sent to/i)).toBeVisible({ timeout: 10000 });
    await expect(this.otpDialog.getByText(/Enter 6 digit OTP/i)).toBeVisible({ timeout: 10000 });
  }

  async enterBillStatusOtp(otp: string) {
    this.logStep(`Entering Bill Status OTP: ${otp}`);
    const otpDigits = this.otpDialog.locator('input[type="text"]');

    await expect(otpDigits).toHaveCount(6, { timeout: 10000 });
    await otpDigits.evaluateAll((elements) => {
      for (const element of elements) {
        const input = element as HTMLInputElement;
        input.value = "";
      }
    });
    await otpDigits.first().click();
    await this.page.keyboard.type(otp.trim());
  }

  async verifyBillStatusOtpSubmitButtonEnabled() {
    this.logStep("Verifying OTP submit button is enabled");
    await expect(this.otpDialog.getByRole("button", { name: "Submit" })).toBeEnabled({ timeout: 10000 });
  }

  async submitBillStatusOtp(otp: string) {
    this.logStep("Submitting Bill Status OTP for success path");
    await this.enterBillStatusOtp(otp);
    const submitButton = this.otpDialog.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    await submitButton.click();

    await expect(this.billStatusGetOtpButton).toContainText("VERIFIED", { timeout: 10000 });
    await expect(this.billStatusResultsButton).toBeEnabled({ timeout: 10000 });
  }

  async submitBillStatusOtpExpectingFailure(otp: string) {
    this.logStep("Submitting Bill Status OTP expecting failure");
    await this.enterBillStatusOtp(otp);
    const submitButton = this.otpDialog.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    await submitButton.click();

    await expect(this.otpDialog.getByText("Invalid OTP")).toBeVisible({ timeout: 10000 });
    await expect(this.billStatusGetOtpButton).toContainText("GET OTP", { timeout: 10000 });
    await expect(this.billStatusResultsButton).toBeDisabled();
  }

  async submitBillStatusOtpExpectingMessage(otp: string, expectedMessage: RegExp | string) {
    this.logStep(`Submitting Bill Status OTP expecting message: ${expectedMessage.toString()}`);
    await this.enterBillStatusOtp(otp);
    const submitButton = this.otpDialog.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    await submitButton.click();
    await expect(this.otpDialog.getByText(expectedMessage)).toBeVisible({ timeout: 10000 });
    await expect(this.billStatusGetOtpButton).toContainText("GET OTP", { timeout: 10000 });
  }

  async requestBillStatusOtpExpectingConsumerNotFound() {
    this.logStep("Requesting OTP expecting unknown consumer error");
    await expect(this.billStatusGetOtpButton).toBeVisible();
    await expect(this.billStatusGetOtpButton).toBeEnabled();
    await this.billStatusGetOtpButton.click();

    await expect(this.page.getByText("Error", { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(this.page.getByText("Consumer/Mobile No. not found", { exact: true })).toBeVisible({
      timeout: 10000,
    });
    await this.page.getByRole("link", { name: "Ok" }).click();
  }

  async openBillStatusResults() {
    this.logStep("Opening Bill Status results");
    await expect(this.billStatusResultsButton).toBeVisible({ timeout: 10000 });
    await expect(this.billStatusResultsButton).toBeEnabled({ timeout: 10000 });
    await this.billStatusResultsButton.click();
  }

  async verifyBillDetails(consumerNumber: string, billNumber: string) {
    this.logStep("Verifying Bill Details section");
    await expect(this.page.getByText("Bill Details", { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(this.page.locator("#lblConsumerNo")).toHaveText(consumerNumber, { timeout: 10000 });
    await expect(this.page.locator("#lblBillNo")).toHaveText(billNumber, { timeout: 10000 });
  }

  async verifyBillStatusOtpNotVerified() {
    this.logStep("Verifying Bill Status remains unverified");
    await expect(this.billStatusGetOtpButton).toContainText("GET OTP");
    await expect(this.billStatusResultsButton).toBeDisabled();
  }

  async verifyBillDetailsNotDisplayed() {
    this.logStep("Verifying Bill Details are not displayed");
    await expect(this.page.getByText("Bill Details", { exact: true })).not.toBeVisible({ timeout: 2000 });
  }

  async verifySearchBlockedWithoutOtpVerification() {
    this.logStep("Verifying search is blocked before OTP verification");
    await expect(this.billStatusResultsButton).toBeDisabled();
    await expect(this.page.locator("#lblConsumerNo")).toHaveText("");
    await expect(this.page.locator("#lblBillNo")).toHaveText("");
  }

  async verifyBillStatusOtpDialogStillOpen() {
    this.logStep("Verifying OTP dialog remains open");
    await expect(this.otpDialog).toBeVisible({ timeout: 10000 });
  }

  async submitEmptyBillStatusOtp() {
    this.logStep("Submitting empty Bill Status OTP");
    const submitButton = this.otpDialog.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeDisabled({ timeout: 10000 });
  }

  async submitMultipleWrongOtps(otp: string, attempts: number) {
    this.logStep(`Submitting wrong OTP ${attempts} times`);
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      await this.submitBillStatusOtpExpectingFailure(otp);
      await this.verifyBillStatusOtpDialogStillOpen();
      console.log(`[ConsumerPortal] Wrong OTP attempt ${attempt} rejected`);
    }
  }

  async mockBillStatusOtpVerificationFailure(message: string) {
    this.logStep(`Mocking VerifyOtp failure with message: ${message}`);
    await this.page.route("**/Public/BillStatus/VerifyOtp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: false,
          message,
        }),
      });
    });
  }

  async mockBillStatusOtpVerificationSequence(messages: string[]) {
    this.logStep(`Mocking VerifyOtp sequence with messages: ${messages.join(", ")}`);
    let requestCount = 0;

    await this.page.route("**/Public/BillStatus/VerifyOtp", async (route) => {
      const message = messages[Math.min(requestCount, messages.length - 1)] ?? "Invalid OTP";
      requestCount += 1;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: false,
          message,
        }),
      });
    });
  }

  async mockBillStatusFetchConsumerFailure(message: string) {
    this.logStep(`Mocking FetchConsumerMobile failure with message: ${message}`);
    await this.page.route("**/Public/BillStatus/FetchConsumerMobile", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: false,
          message,
        }),
      });
    });
  }

  async mockBillStatusSearchFailure(message: string) {
    this.logStep(`Mocking GetBillDetails failure with message: ${message}`);
    await this.page.route("**/Public/BillStatus/GetBillDetails", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: false,
          message,
        }),
      });
    });
  }

  async verifyToastOrErrorMessage(expectedMessage: RegExp | string) {
    this.logStep(`Verifying message is displayed: ${expectedMessage.toString()}`);
    const messageTarget = this.page.getByText(expectedMessage).first();
    await expect(messageTarget).toBeVisible({ timeout: 10000 });
  }

  async verifyErrorPopup(expectedTitle: RegExp | string, expectedMessage: RegExp | string) {
    this.logStep(`Verifying error popup: ${expectedTitle.toString()} / ${expectedMessage.toString()}`);
    await expect(this.page.getByText(expectedTitle, { exact: typeof expectedTitle === "string" })).toBeVisible({
      timeout: 10000,
    });
    await expect(this.page.getByText(expectedMessage, { exact: typeof expectedMessage === "string" })).toBeVisible({
      timeout: 10000,
    });
  }

  async dismissGenericErrorPopup() {
    const okButton = this.page.getByRole("link", { name: "Ok" });
    if (await okButton.isVisible().catch(() => false)) {
      this.logStep("Dismissing error popup");
      await okButton.click();
    }
  }

  async clearNetworkMocks() {
    try {
      this.logStep("Clearing Bill Status route mocks");
      await this.page.unroute("**/Public/BillStatus/VerifyOtp");
      await this.page.unroute("**/Public/BillStatus/FetchConsumerMobile");
      await this.page.unroute("**/Public/BillStatus/GetBillDetails");
    } catch (error) {
      console.warn(`[ConsumerPortal] Skipping route cleanup because page is unavailable: ${String(error)}`);
    }
  }

  // ==========================================
  // Complaint Registration Methods
  // ==========================================

  private get complaintsMenuButton() {
    return this.page.getByRole("button", { name: /^Complaints$/i }).first();
  }

  private get raiseComplaintMenuLink() {
    return this.page.getByRole("link", { name: /^Raise Complaint$/i }).first();
  }

  private get complaintTypeSelect() {
    return this.page.locator("#ServiceTypeId");
  }

  private get complaintSubTypeSelect() {
    return this.page.locator("#CategoryId");
  }

  private get complaintProblemDescriptionInput() {
    return this.page.locator("#ProblemDescription");
  }

  private get complaintConsumerNumberInput() {
    return this.page.locator("#ConsumerNum");
  }

  private get complaintContactPersonInput() {
    return this.page.locator("#ContactPerson");
  }

  private get complaintMobileNumberInput() {
    return this.page.locator("#MobileNo");
  }

  private get complaintLandmarkInput() {
    return this.page.locator("#Landmark");
  }

  private get complaintAddressInput() {
    return this.page.locator("#Address");
  }

  private get complaintDistrictSelect() {
    return this.page.locator("#DistrictId");
  }

  private get complaintSectionSelect() {
    return this.page.locator("#SectionId");
  }

  private get complaintVisibleCaptchaInput() {
    return this.page.locator("#captcha");
  }

  private get complaintSubmitButton() {
    return this.page.locator("#btnSubmitComplaint");
  }

  private get complaintSuccessPopup() {
    return this.page.locator("#dvalert");
  }

  private buildComplaintAcknowledgementHtml(ticketNumber: string, data: ComplaintRegistrationData) {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Complaint Acknowledgement</title>
  </head>
  <body>
    <main>
      <h1>Complaint Acknowledgement</h1>
      <p id="ack-message">Complaint submitted successfully.</p>
      <dl>
        <dt>Reference Number</dt><dd id="ack-ticket">${ticketNumber}</dd>
        <dt>Complaint Type</dt><dd id="ack-complaint-type">${data.complaintType}</dd>
        <dt>Complaint Sub Type</dt><dd id="ack-complaint-sub-type">${data.complaintSubType}</dd>
        <dt>Problem Description</dt><dd id="ack-problem-description">${data.problemDescription}</dd>
        <dt>Consumer Number</dt><dd id="ack-consumer-number">${data.consumerNumber}</dd>
        <dt>Contact Person</dt><dd id="ack-contact-person">${data.contactPerson}</dd>
        <dt>Mobile Number</dt><dd id="ack-mobile-number">${data.mobile}</dd>
        <dt>Landmark</dt><dd id="ack-landmark">${data.landmark}</dd>
        <dt>Address</dt><dd id="ack-address">${data.address}</dd>
        <dt>District</dt><dd id="ack-district">${data.district}</dd>
        <dt>Section</dt><dd id="ack-section">${data.section}</dd>
      </dl>
    </main>
  </body>
</html>`;
  }

  async verifyHomePageLoaded() {
    this.logStep("Verifying Consumer Portal home page");
    await expect(this.page).toHaveURL(/ksebconsumerqc\.ugoone\.com\/?$/i);
    await expect(this.page.getByRole("heading", { name: /Welcome to Consumer Portal/i })).toBeVisible();
    await expect(this.complaintsMenuButton).toBeVisible();
  }

  async openRaiseComplaintFromComplaintsMenu() {
    this.logStep("Opening Raise Complaint from Complaints menu");
    await expect(this.complaintsMenuButton).toBeVisible();
    await this.complaintsMenuButton.click({ force: true, timeout: 10000 });
    await expect(this.raiseComplaintMenuLink).toBeVisible();
    await this.raiseComplaintMenuLink.click();
    await this.verifyFileNewComplaintPageLoaded();
  }

  async verifyFileNewComplaintPageLoaded() {
    this.logStep("Verifying File New Complaint page");
    await expect(this.page).toHaveURL(/\/Public\/ComplaintDetail\/RaiseComplaint/i);
    await expect(
      this.page.getByRole("heading", { name: /File New Complaint \/ Service Request/i }),
    ).toBeVisible();
    await expect(this.raiseComplaintMenuLink).toBeVisible();
  }

  async clickRaiseComplaintButton() {
    this.logStep("Opening Complaint Details page");
    await this.page.getByRole("link", { name: /^Raise Complaint$/i }).last().click();
    await this.verifyComplaintDetailsPageLoaded();
  }

  async verifyComplaintDetailsPageLoaded() {
    this.logStep("Verifying Complaint Details page");
    await expect(this.page).toHaveURL(/\/Public\/ComplaintDetail\/Index/i);
    await expect(this.page.getByRole("heading", { name: /^Complaint Details$/i })).toBeVisible();
    await expect(this.complaintTypeSelect).toBeVisible();
    await expect(this.complaintSubTypeSelect).toBeVisible();
    await expect(this.complaintProblemDescriptionInput).toBeVisible();
    await expect(this.complaintVisibleCaptchaInput).toBeVisible();
    await expect(this.complaintSubmitButton).toBeVisible();
  }

  async selectComplaintType(complaintType: string) {
    this.logStep(`Selecting Complaint Type: ${complaintType}`);
    await expect(this.complaintTypeSelect).toBeVisible();
    await this.complaintTypeSelect.selectOption({ label: complaintType });
    await expect(this.complaintTypeSelect.locator("option:checked")).toHaveText(complaintType);
  }

  async selectComplaintSubType(complaintSubType: string) {
    this.logStep(`Selecting Complaint Sub Type: ${complaintSubType}`);
    await expect(this.complaintSubTypeSelect).toBeVisible();
    await expect.poll(async () => await this.complaintSubTypeSelect.locator("option").count(), {
      timeout: 10000,
    }).toBeGreaterThan(1);
    await this.complaintSubTypeSelect.selectOption({ label: complaintSubType });
    await expect(this.complaintSubTypeSelect.locator("option:checked")).toHaveText(complaintSubType);
  }

  async enterComplaintProblemDescription(problemDescription: string) {
    this.logStep(`Entering complaint problem description: ${problemDescription}`);
    await this.complaintProblemDescriptionInput.fill(problemDescription);
    await expect(this.complaintProblemDescriptionInput).toHaveValue(problemDescription);
  }

  async enterComplaintConsumerNumber(consumerNumber: string) {
    this.logStep(`Entering complaint consumer number: ${consumerNumber}`);
    await this.complaintConsumerNumberInput.fill(consumerNumber);
    await expect(this.complaintConsumerNumberInput).toHaveValue(consumerNumber);
  }

  async enterComplaintContactPerson(contactPerson: string) {
    this.logStep(`Entering complaint contact person: ${contactPerson}`);
    await this.complaintContactPersonInput.fill(contactPerson);
    await expect(this.complaintContactPersonInput).toHaveValue(contactPerson);
  }

  async enterComplaintMobileNumber(mobileNumber: string) {
    this.logStep(`Entering complaint mobile number: ${mobileNumber}`);
    await this.complaintMobileNumberInput.fill(mobileNumber);
    await expect(this.complaintMobileNumberInput).toHaveValue(mobileNumber);
  }

  async enterComplaintLandmark(landmark: string) {
    this.logStep(`Entering complaint landmark: ${landmark}`);
    await this.complaintLandmarkInput.fill(landmark);
    await expect(this.complaintLandmarkInput).toHaveValue(landmark);
  }

  async enterComplaintAddress(address: string) {
    this.logStep(`Entering complaint address: ${address}`);
    await this.complaintAddressInput.fill(address);
    await expect(this.complaintAddressInput).toHaveValue(address);
  }

  async selectComplaintDistrict(district: string) {
    this.logStep(`Selecting complaint district: ${district}`);
    await this.complaintDistrictSelect.selectOption({ label: district });
    await expect(this.complaintDistrictSelect.locator("option:checked")).toHaveText(district);
  }

  async selectComplaintSection(section: string) {
    this.logStep(`Selecting complaint section: ${section}`);
    await this.complaintSectionSelect.selectOption({ label: section });
    await expect(this.complaintSectionSelect.locator("option:checked")).toHaveText(section);
  }

  async enterComplaintSecurityCode(securityCode: string) {
    this.logStep(`Entering complaint security code: ${securityCode}`);
    await expect(this.complaintVisibleCaptchaInput).toBeVisible();
    await this.complaintVisibleCaptchaInput.fill(securityCode);
    await expect(this.complaintVisibleCaptchaInput).toHaveValue(securityCode);
  }

  async waitForManualComplaintSecurityCodeEntry(timeoutMs = 15000, settleMs = 1200) {
    this.logStep(`Waiting up to ${timeoutMs}ms for manual complaint security code entry`);
    await expect(this.complaintVisibleCaptchaInput).toBeVisible();
    await this.complaintVisibleCaptchaInput.click();

    const startTime = Date.now();
    const pollIntervalMs = 200;
    let lastValue = "";
    let lastChangeAt = startTime;

    while (Date.now() - startTime < timeoutMs) {
      const currentValue = (await this.complaintVisibleCaptchaInput.inputValue()).trim();
      const now = Date.now();

      if (currentValue !== lastValue) {
        lastValue = currentValue;
        lastChangeAt = now;
      }

      if (lastValue !== "" && now - lastChangeAt >= settleMs) {
        this.logStep(`Security code entry settled after ${now - lastChangeAt}ms; continuing with value "${lastValue}"`);
        await expect(this.complaintVisibleCaptchaInput).toHaveValue(lastValue);
        return;
      }

      await this.page.waitForTimeout(pollIntervalMs);
    }

    throw new Error(`Expected the complaint security code to be entered and remain unchanged for ${settleMs}ms within ${timeoutMs}ms`);
  }

  async fillComplaintDetailsForm(data: ComplaintRegistrationData, options?: { includeSecurityCode?: boolean }) {
    await this.selectComplaintType(data.complaintType);
    await this.selectComplaintSubType(data.complaintSubType);
    await this.enterComplaintProblemDescription(data.problemDescription);
    await this.enterComplaintConsumerNumber(data.consumerNumber);
    await this.enterComplaintContactPerson(data.contactPerson);
    await this.enterComplaintMobileNumber(data.mobile);
    await this.enterComplaintLandmark(data.landmark);
    await this.enterComplaintAddress(data.address);
    await this.selectComplaintDistrict(data.district);
    await this.selectComplaintSection(data.section);

    if (options?.includeSecurityCode ?? true) {
      await this.enterComplaintSecurityCode(data.securityCode);
    }
  }

  async clickSubmitComplaint() {
    this.logStep("Submitting complaint form");
    await expect(this.complaintSubmitButton).toBeVisible();
    await expect(this.complaintSubmitButton).toBeEnabled();
    await this.complaintSubmitButton.click();
  }

  async verifyComplaintCaptchaValidationMessage(expectedMessage: string | RegExp) {
    this.logStep(`Verifying complaint security code validation: ${expectedMessage.toString()}`);
    const validationMessage = this.page.locator('[data-valmsg-for="Captcha"]');
    await expect(validationMessage).toBeVisible();
    await expect(validationMessage).toHaveText(expectedMessage);
    await expect(this.complaintVisibleCaptchaInput).toBeVisible();
    await expect(this.complaintVisibleCaptchaInput).toBeEditable();
  }

  async verifyComplaintFormStillVisible() {
    this.logStep("Verifying complaint form remains open");
    await expect(this.page).toHaveURL(/\/Public\/ComplaintDetail\/Index/i);
    await expect(this.page.getByRole("heading", { name: /^Complaint Details$/i })).toBeVisible();
    await expect(this.complaintSubmitButton).toBeVisible();
  }

  async verifyNoUnexpectedComplaintError() {
    this.logStep("Verifying no unexpected complaint error popup is displayed");
    const errorPopup = this.page.locator("#dvalert .cmTitle").filter({ hasText: /^Error$/i });
    await expect(errorPopup).toHaveCount(0);
  }

  async mockComplaintSubmissionSuccess(data: ComplaintRegistrationData, options?: { ticketNumber?: string; successMessage?: string }) {
    const ticketNumber = options?.ticketNumber ?? "CMP2405140001";
    const acknowledgementPath = `/mock/complaint-acknowledgement?ticket=${ticketNumber}`;
    const successMessage =
      options?.successMessage ?? `Complaint submitted successfully. Reference Number: ${ticketNumber}`;

    this.logStep(`Mocking complaint submission success for ticket ${ticketNumber}`);

    this.complaintSubmissionMockState = {
      acknowledgementPath,
      successMessage,
      ticketNumber,
      submittedPayload: {},
    };

    await this.page.route("**/Public/ComplaintDetail/SaveComplaint", async (route) => {
      const payload = new URLSearchParams(route.request().postData() ?? "");
      this.complaintSubmissionMockState = {
        acknowledgementPath,
        successMessage,
        ticketNumber,
        submittedPayload: Object.fromEntries(payload.entries()),
      };

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          Status: true,
          Message: successMessage,
          RedirectUrl: acknowledgementPath,
        }),
      });
    });

    await this.page.route(`**${acknowledgementPath}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: this.buildComplaintAcknowledgementHtml(ticketNumber, data),
      });
    });
  }

  async verifyComplaintSuccessPopup(ticketNumber?: string, successMessage?: string | RegExp) {
    this.logStep("Verifying complaint success popup");
    await expect(this.complaintSuccessPopup).toBeVisible({ timeout: 10000 });
    await expect(this.complaintSuccessPopup.locator(".cmTitle")).toHaveText(/Successful/i);

    if (ticketNumber) {
      await expect(this.complaintSuccessPopup.locator(".cmMess")).toContainText(ticketNumber);
    }

    if (successMessage) {
      await expect(this.complaintSuccessPopup.locator(".cmMess")).toContainText(successMessage);
    }
  }

  async acknowledgeComplaintSuccess() {
    this.logStep("Acknowledging complaint success popup");
    const okButton = this.complaintSuccessPopup.getByRole("link", { name: /^Ok$/i });
    await expect(okButton).toBeVisible({ timeout: 10000 });
    await okButton.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async verifyComplaintAcknowledgementPage(data: ComplaintRegistrationData, ticketNumber?: string) {
    const resolvedTicketNumber = ticketNumber ?? this.complaintSubmissionMockState?.ticketNumber;
    expect(resolvedTicketNumber, "Complaint ticket number was not available for acknowledgement verification").toBeTruthy();

    const finalTicketNumber = resolvedTicketNumber as string;
    this.logStep(`Verifying complaint acknowledgement page for ticket ${finalTicketNumber}`);
    await expect(this.page).toHaveURL(new RegExp(`ticket=${finalTicketNumber}$`, "i"));
    await expect(this.page.getByRole("heading", { name: /Complaint Acknowledgement/i })).toBeVisible();
    await expect(this.page.locator("#ack-ticket")).toHaveText(finalTicketNumber);
    await expect(this.page.locator("#ack-complaint-type")).toHaveText(data.complaintType);
    await expect(this.page.locator("#ack-complaint-sub-type")).toHaveText(data.complaintSubType);
    await expect(this.page.locator("#ack-problem-description")).toHaveText(data.problemDescription);
    await expect(this.page.locator("#ack-consumer-number")).toHaveText(data.consumerNumber);
    await expect(this.page.locator("#ack-contact-person")).toHaveText(data.contactPerson);
    await expect(this.page.locator("#ack-mobile-number")).toHaveText(data.mobile);
    await expect(this.page.locator("#ack-landmark")).toHaveText(data.landmark);
    await expect(this.page.locator("#ack-address")).toHaveText(data.address);
    await expect(this.page.locator("#ack-district")).toHaveText(data.district);
    await expect(this.page.locator("#ack-section")).toHaveText(data.section);
  }

  async verifyComplaintSubmissionPayload(data: ComplaintRegistrationData) {
    this.logStep("Verifying complaint submission payload");
    expect(this.complaintSubmissionMockState, "Complaint submission mock state was not captured").not.toBeNull();

    const payload = this.complaintSubmissionMockState?.submittedPayload ?? {};
    expect(payload.ProblemDescription).toBe(data.problemDescription);
    expect(payload.ConsumerNum).toBe(data.consumerNumber);
    expect(payload.ContactPerson).toBe(data.contactPerson);
    expect(payload.MobileNo).toBe(data.mobile);
    expect(payload.Landmark).toBe(data.landmark);
    expect(payload.Address).toBe(data.address);
    expect(payload.ServiceType).toBe(data.complaintType);
    expect(payload.Captcha).toBeTruthy();
    expect(payload.Captcha.trim().length).toBeGreaterThan(0);
    expect(payload.ServiceTypeId).toBeTruthy();
    expect(payload.CategoryId).toBeTruthy();
    expect(payload.DistrictId).toBeTruthy();
    expect(payload.SectionId).toBeTruthy();
  }

  async clearComplaintMocks() {
    try {
      this.logStep("Clearing complaint route mocks");
      await this.page.unroute("**/Public/ComplaintDetail/SaveComplaint");

      if (this.complaintSubmissionMockState) {
        await this.page.unroute(`**${this.complaintSubmissionMockState.acknowledgementPath}`);
      }
    } catch (error) {
      console.warn(`[ConsumerPortal] Skipping complaint route cleanup because page is unavailable: ${String(error)}`);
    } finally {
      this.complaintSubmissionMockState = null;
    }
  }

  // ==========================================
  // Bill Calculator Methods
  // ==========================================

  private get billCalculatorHeading() {
    return this.page.getByRole("heading", { name: /Electricity Bill Calculator/i });
  }

  private get genericTabButton() {
    return this.page.getByRole("button", { name: /^Generic$/i });
  }

  private get advancedTabButton() {
    return this.page.getByRole("button", { name: /^Advanced$/i });
  }

  private get genericTabPanel() {
    return this.page.locator("#generic");
  }

  private get advancedTabPanel() {
    return this.page.locator("#advanced");
  }

  private get genericTariffSelect() {
    return this.genericTabPanel.locator("select").nth(0);
  }

  private get genericCategorySelect() {
    return this.genericTabPanel.locator("select").nth(1);
  }

  private get genericUnitsInput() {
    return this.genericTabPanel.locator('input[type="text"]').first();
  }

  private get advancedTariffSelect() {
    return this.advancedTabPanel.locator("select").first();
  }

  private get advancedConnectedLoadInput() {
    return this.advancedTabPanel.locator('input[name="watt"]').first();
  }

  private get advancedUnitsInput() {
    return this.advancedTabPanel.locator('input[name="kwh"]').first();
  }

  private get billBreakdownModal() {
    return this.page.locator("#infoModal");
  }

  private get billBreakdownDialog() {
    return this.page.getByRole("dialog").filter({ hasText: /Bill Breakdown/i });
  }

  private normalizeLabelText(value: string) {
    return value.replace(/\s+/g, " ").trim();
  }

  private async clickRadioOptionByGroupName(panelSelector: string, groupName: string, optionLabel: string) {
    const normalizedLabel = this.normalizeLabelText(optionLabel);
    const radio = this.page.locator(
      `${panelSelector} label.cycle-option:has(input[type="radio"][name="${groupName}"])`,
    ).filter({ hasText: normalizedLabel }).first();

    await expect(radio).toBeVisible();
    await radio.click();
  }

  private async getBillRowValue(label: RegExp | string) {
    const row = this.billBreakdownDialog
      .locator(".bill-row")
      .filter({ has: this.page.locator("span").filter({ hasText: label }).first() })
      .first();
    await expect(row).toBeVisible();
    const texts = (await row.locator("span").allTextContents()).map((entry) => this.normalizeLabelText(entry));
    return texts[texts.length - 1] ?? "";
  }

  async openBillCalculatorPage() {
    this.logStep("Opening Bill Calculator page");
    await this.goto();

    try {
      await this.navigateToBillAndPayments();
      await this.clickBillCalculator();
    } catch (error) {
      this.logStep(`Bill Calculator menu navigation failed, falling back to direct URL: ${String(error)}`);
      await this.openUrl(new URL("/Public/BillCalculator/Index", BASE_URL).toString());
    }

    await this.verifyBillCalculatorPageLoaded();
  }

  async verifyBillCalculatorPageLoaded() {
    this.logStep("Verifying Bill Calculator page");
    await expect(this.page).toHaveURL(/\/Public\/BillCalculator\/Index/i);
    await expect(this.billCalculatorHeading).toBeVisible();
    await expect(this.genericTabButton).toBeVisible();
    await expect(this.advancedTabButton).toBeVisible();
  }

  async navigateToBillAndPayments() {
    this.logStep("Navigating to Bill & Payments menu");
    const billAndPaymentsBtn = this.page.getByRole("button", { name: /Bill & Payments/i }).first();
    await expect(billAndPaymentsBtn).toBeVisible();
    await billAndPaymentsBtn.click({ force: true, timeout: 10000 });
  }

  async clickBillCalculator() {
    this.logStep("Opening Bill Calculator");
    const billCalculatorLink = this.page.getByRole("link", { name: /^Bill Calculator$/i }).first();
    await expect(billCalculatorLink).toBeVisible();
    await billCalculatorLink.click();
    await this.verifyBillCalculatorPageLoaded();
  }

  async selectTariff(tariff: string) {
    this.logStep(`Selecting Tariff: ${tariff}`);
    await this.clickGenericTab();
    await expect(this.genericTariffSelect).toBeVisible();
    await this.genericTariffSelect.selectOption({ label: tariff });
  }

  async selectCategory(category: string) {
    this.logStep(`Selecting Category: ${category}`);
    await this.clickGenericTab();
    await expect(this.genericCategorySelect).toBeVisible();
    await this.genericCategorySelect.selectOption({ label: category });
  }

  async selectBillingCycle(cycle: string) {
    this.logStep(`Selecting Billing Cycle: ${cycle}`);
    await this.clickGenericTab();
    await this.clickRadioOptionByGroupName("#generic", "billing", cycle);
  }

  async enterConsumedUnits(units: string) {
    this.logStep(`Entering Consumed Units: ${units}`);
    await this.clickGenericTab();
    await expect(this.genericUnitsInput).toBeVisible();
    await this.genericUnitsInput.fill(units);
  }

  async selectPhase(phase: string) {
    this.logStep(`Selecting Phase: ${phase}`);
    await this.clickGenericTab();
    await this.clickRadioOptionByGroupName("#generic", "billing1", phase);
  }

  async clickCalculateBill() {
    this.logStep("Clicking Calculate Bill button");
    const calculateBtn = this.page.locator(".tab-pane.active, .tab-content").getByRole("button", {
      name: /Calculate Bill/i,
    }).first();
    await expect(calculateBtn).toBeVisible();
    await calculateBtn.click();
  }

  async clickAdvancedTab() {
    this.logStep("Clicking on Advanced tab");
    await expect(this.advancedTabButton).toBeVisible();
    await this.advancedTabButton.click();
    await expect(this.advancedTabPanel).toHaveClass(/active|show/i);
  }

  async clickGenericTab() {
    this.logStep("Clicking on Generic tab");
    await expect(this.genericTabButton).toBeVisible();
    await this.genericTabButton.click();
    await expect(this.genericTabPanel).toHaveClass(/active|show/i);
  }

  async verifyTabsVisible() {
    this.logStep("Verifying Generic and Advanced tabs are visible");
    await expect(this.genericTabButton).toBeVisible();
    await expect(this.advancedTabButton).toBeVisible();
  }

  async verifyGenericCalculatorControls() {
    this.logStep("Verifying Generic Bill Calculator controls");
    await this.clickGenericTab();
    await expect(this.genericTariffSelect).toBeVisible();
    await expect(this.genericTariffSelect).toBeEnabled();
    await expect(this.genericCategorySelect).toBeVisible();
    await expect(this.genericCategorySelect).toBeEnabled();
    await expect(this.genericUnitsInput).toBeVisible();
    await expect(this.genericUnitsInput).toBeEditable();
    await expect(this.page.locator('#generic input[type="radio"][name="billing"]')).toHaveCount(2);
    await expect(this.page.locator('#generic input[type="radio"][name="billing1"]')).toHaveCount(2);
    await expect(this.page.getByRole("button", { name: /Calculate Bill/i }).first()).toBeVisible();
  }

  async verifyAdvancedCalculatorControls() {
    this.logStep("Verifying Advanced Bill Calculator controls");
    await this.clickAdvancedTab();
    await expect(this.advancedTariffSelect).toBeVisible();
    await expect(this.advancedTariffSelect).toBeEnabled();
    await expect(this.advancedConnectedLoadInput).toBeVisible();
    await expect(this.advancedConnectedLoadInput).toBeEditable();
    await expect(this.advancedUnitsInput).toBeVisible();
    await expect(this.advancedUnitsInput).toBeEditable();
    await expect(this.page.locator('#advanced input[type="radio"][name="Pricing"]')).toHaveCount(4);
    await expect(this.page.locator('#advanced input[type="radio"][name="Cycle"]')).toHaveCount(3);
    await expect(this.page.locator('#advanced input[type="radio"][name="Phase"]')).toHaveCount(2);
    await expect(this.page.locator('#advanced input[type="radio"][name="owner"]')).toHaveCount(2);
    await expect(this.advancedTabPanel.getByRole("button", { name: /Calculate Bill/i })).toBeVisible();
  }

  async verifyAdvancedDefaults() {
    this.logStep("Verifying Advanced Bill Calculator default values");
    await this.clickAdvancedTab();
    await expect(this.page.locator('#advanced input[type="radio"][name="Pricing"]').nth(2)).toBeChecked();
    await expect(this.advancedTariffSelect).toHaveValue("1");
    await expect(this.page.locator('#advanced input[type="radio"][name="Cycle"]').first()).toBeChecked();
    await expect(this.page.locator('#advanced input[type="radio"][name="Phase"]').first()).toBeChecked();
    await expect(this.page.locator('#advanced input[type="radio"][name="owner"]').first()).toBeChecked();
  }

  async verifyGenericDefaults() {
    this.logStep("Verifying Generic Bill Calculator default values");
    await expect(this.genericTariffSelect).toHaveValue("1");
    await expect(this.genericCategorySelect).toHaveValue("1");
    await expect(this.page.locator('#generic input[type="radio"][name="billing"]').first()).toBeChecked();
    await expect(this.page.locator('#generic input[type="radio"][name="billing1"]').first()).toBeChecked();
  }

  async getGenericSelectedTariffLabel() {
    const selectedText = await this.genericTariffSelect.locator("option:checked").textContent();
    return this.normalizeLabelText(selectedText ?? "");
  }

  async getGenericSelectedCategoryLabel() {
    const selectedText = await this.genericCategorySelect.locator("option:checked").textContent();
    return this.normalizeLabelText(selectedText ?? "");
  }

  async getGenericSelectedBillingCycleLabel() {
    const checkedLabel = this.page.locator('#generic label:has(input[type="radio"][name="billing"]:checked) span').first();
    return this.normalizeLabelText((await checkedLabel.textContent()) ?? "");
  }

  async getGenericSelectedPhaseLabel() {
    const checkedLabel = this.page.locator('#generic label:has(input[type="radio"][name="billing1"]:checked) span').first();
    return this.normalizeLabelText((await checkedLabel.textContent()) ?? "");
  }

  async getConsumedUnitsValue() {
    return this.genericUnitsInput.inputValue();
  }

  async getAdvancedSelectedPricingTypeLabel() {
    const checkedLabel = this.page.locator('#advanced label:has(input[type="radio"][name="Pricing"]:checked) span').first();
    return this.normalizeLabelText((await checkedLabel.textContent()) ?? "");
  }

  async getAdvancedSelectedTariffLabel() {
    const selectedText = await this.advancedTariffSelect.locator("option:checked").textContent();
    return this.normalizeLabelText(selectedText ?? "");
  }

  async getAdvancedSelectedBillingCycleLabel() {
    const checkedLabel = this.page.locator('#advanced label:has(input[type="radio"][name="Cycle"]:checked) span').first();
    return this.normalizeLabelText((await checkedLabel.textContent()) ?? "");
  }

  async getAdvancedSelectedPhaseLabel() {
    const checkedLabel = this.page.locator('#advanced label:has(input[type="radio"][name="Phase"]:checked) span').first();
    return this.normalizeLabelText((await checkedLabel.textContent()) ?? "");
  }

  async getAdvancedSelectedMeterOwnerLabel() {
    const checkedLabel = this.page.locator('#advanced label:has(input[type="radio"][name="owner"]:checked) span').first();
    return this.normalizeLabelText((await checkedLabel.textContent()) ?? "");
  }

  async getActiveCalculateBillButton() {
    const activePanel = this.page.locator(".tab-pane.active.show, .tab-pane.active").first();
    return activePanel.getByRole("button", { name: /Calculate Bill/i }).first();
  }

  async getConnectedLoadValue() {
    return this.advancedConnectedLoadInput.inputValue();
  }

  async getAdvancedConsumedUnitsValue() {
    return this.advancedUnitsInput.inputValue();
  }

  async verifyBillBreakdownModalVisible() {
    this.logStep("Verifying Bill Breakdown modal is visible");
    await expect(this.billBreakdownDialog).toBeVisible();
    await expect(this.billBreakdownDialog.getByRole("heading", { name: /Bill Breakdown/i })).toBeVisible();
  }

  async verifyBillBreakdownModalNotVisible() {
    this.logStep("Verifying Bill Breakdown modal is not visible");
    await expect(this.billBreakdownModal).not.toHaveClass(/show/i);
  }

  async getBillBreakdownSummary() {
    this.logStep("Reading Bill Breakdown summary values");
    await this.verifyBillBreakdownModalVisible();

    return {
      energyCharge: await this.getBillRowValue(/Energy Charge/i),
      duty: await this.getBillRowValue(/^Duty$/i),
      fixedCharge: await this.getBillRowValue(/Fixed Charge/i),
      meterRent: await this.getBillRowValue(/Meter Rent/i),
      totalAmount: await this.getBillRowValue(/Total Amount/i),
    };
  }

  async closeBillBreakdownModal() {
    this.logStep("Closing Bill Breakdown modal");
    const closeButton = this.billBreakdownDialog.locator(".btn-close").first();
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    await expect(this.billBreakdownDialog).not.toBeVisible();
  }

  async clearBillCalculatorUnits() {
    this.logStep("Clearing Consumed Units field");
    await this.genericUnitsInput.clear();
  }

  async selectPricingType(pricingType: string) {
    this.logStep(`Selecting Pricing Type: ${pricingType}`);
    await this.clickAdvancedTab();
    await this.clickRadioOptionByGroupName("#advanced", "Pricing", pricingType);
  }

  async selectAdvancedTariff(tariff: string) {
    this.logStep(`Selecting Advanced Tariff: ${tariff}`);
    await this.clickAdvancedTab();
    await expect(this.advancedTariffSelect).toBeVisible();
    await this.advancedTariffSelect.selectOption({ label: tariff });
  }

  async selectAdvancedBillingCycle(cycle: string) {
    this.logStep(`Selecting Advanced Billing Cycle: ${cycle}`);
    await this.clickAdvancedTab();
    await this.clickRadioOptionByGroupName("#advanced", "Cycle", cycle);
  }

  async enterConnectedLoad(load: string) {
    this.logStep(`Entering Connected Load: ${load}`);
    await this.clickAdvancedTab();
    await expect(this.advancedConnectedLoadInput).toBeVisible();
    await this.advancedConnectedLoadInput.fill(load);
  }

  async clearConnectedLoad() {
    this.logStep("Clearing Connected Load field");
    await this.clickAdvancedTab();
    await this.advancedConnectedLoadInput.clear();
  }

  async selectAdvancedPhase(phase: string) {
    this.logStep(`Selecting Advanced Phase: ${phase}`);
    await this.clickAdvancedTab();
    await this.clickRadioOptionByGroupName("#advanced", "Phase", phase);
  }

  async selectMeterOwner(owner: string) {
    this.logStep(`Selecting Meter Owner: ${owner}`);
    await this.clickAdvancedTab();
    await this.clickRadioOptionByGroupName("#advanced", "owner", owner);
  }

  async enterAdvancedConsumedUnits(units: string) {
    this.logStep(`Entering Advanced Unit Consumed: ${units}`);
    await this.clickAdvancedTab();
    await expect(this.advancedUnitsInput).toBeVisible();
    await this.advancedUnitsInput.fill(units);
  }

  async clearAdvancedConsumedUnits() {
    this.logStep("Clearing Advanced Unit Consumed field");
    await this.clickAdvancedTab();
    await this.advancedUnitsInput.clear();
  }
}
