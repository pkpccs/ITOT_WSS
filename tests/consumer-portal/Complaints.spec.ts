import { test } from "../../src/fixtures/testFixtures";
import userData from "../../src/test-data/users.json" with { type: "json" };

test.describe("Consumer Portal Complaint Registration Suite", () => {
  test.describe.configure({ mode: "serial" });

  const complaintData = userData.complaintRegistrationData;
  const complaintSuccessData = userData.complaintSuccessData;
  const log = (message: string) => {
    console.log(`[ComplaintsSpec] ${message}`);
  };

  async function runStep(stepName: string, action: () => Promise<void>) {
    log(stepName);
    await test.step(stepName, action);
  }

  test("CP-TC-50 | should complete complaint registration flow and open acknowledgement page", async ({
    ConsumerPortal,
  }) => {
    try {
      await runStep("Open the application and verify the consumer portal home page", async () => {
        await ConsumerPortal.goto();
        await ConsumerPortal.verifyHomePageLoaded();
      });

      await runStep("Navigate to Raise Complaint from the Complaints menu", async () => {
        await ConsumerPortal.openRaiseComplaintFromComplaintsMenu();
      });

      await runStep("Open the Complaint Details form", async () => {
        await ConsumerPortal.clickRaiseComplaintButton();
      });

      await runStep("Fill all complaint details except the security code", async () => {
        await ConsumerPortal.fillComplaintDetailsForm(complaintSuccessData, { includeSecurityCode: false });
      });

      await runStep("Enter the Security Code manually within 15 seconds", async () => {
        await ConsumerPortal.waitForManualComplaintSecurityCodeEntry(15000);
      });

      await runStep("Submit the complaint and verify the live success popup", async () => {
        await ConsumerPortal.clickSubmitComplaint();
        await ConsumerPortal.verifyComplaintSuccessPopup(undefined, /Complaint registered/i);
        await ConsumerPortal.verifyNoUnexpectedComplaintError();
        await ConsumerPortal.acknowledgeComplaintSuccess();
      });
    } catch (error) {
      console.error("[ComplaintsSpec] CP-TC-50 failed", error);
      throw error;
    } finally {
      await ConsumerPortal.clearComplaintMocks();
    }
  });

  test("CP-TC-51 | should show exact validation when security code is missing", async ({ ConsumerPortal }) => {
    try {
      await runStep("Open the application and navigate to the Complaint Details page", async () => {
        await ConsumerPortal.goto();
        await ConsumerPortal.verifyHomePageLoaded();
        await ConsumerPortal.openRaiseComplaintFromComplaintsMenu();
        await ConsumerPortal.clickRaiseComplaintButton();
      });

      await runStep("Fill the complaint form without entering the security code", async () => {
        await ConsumerPortal.fillComplaintDetailsForm(complaintData, { includeSecurityCode: false });
      });

      await runStep("Submit the form and verify the exact security code validation message", async () => {
        await ConsumerPortal.clickSubmitComplaint();
        await ConsumerPortal.verifyComplaintCaptchaValidationMessage("Please enter the security code.");
        await ConsumerPortal.verifyComplaintFormStillVisible();
        await ConsumerPortal.verifyNoUnexpectedComplaintError();
      });
    } catch (error) {
      console.error("[ComplaintsSpec] CP-TC-51 failed", error);
      throw error;
    } finally {
      await ConsumerPortal.clearComplaintMocks();
    }
  });

  test("CP-TC-52 | should show duplicate complaint error when complaint already exists", async ({
    ConsumerPortal,
  }) => {
    try {
      await runStep("Open the application and navigate to the Complaint Details page", async () => {
        await ConsumerPortal.goto();
        await ConsumerPortal.verifyHomePageLoaded();
        await ConsumerPortal.openRaiseComplaintFromComplaintsMenu();
        await ConsumerPortal.clickRaiseComplaintButton();
      });

      await runStep("Fill the complaint form except the security code", async () => {
        await ConsumerPortal.fillComplaintDetailsForm(complaintData, { includeSecurityCode: false });
      });

      await runStep("Enter the Security Code manually within 15 seconds", async () => {
        await ConsumerPortal.waitForManualComplaintSecurityCodeEntry(15000);
      });

      await runStep("Submit the complaint and verify the duplicate complaint error popup", async () => {
        await ConsumerPortal.clickSubmitComplaint();
        await ConsumerPortal.verifyErrorPopup("Error", /Complaint has already been/i);
        await ConsumerPortal.dismissGenericErrorPopup();
      });

      await runStep("Verify the complaint form remains available after dismissing the duplicate error", async () => {
        await ConsumerPortal.verifyComplaintFormStillVisible();
      });
    } catch (error) {
      console.error("[ComplaintsSpec] CP-TC-52 failed", error);
      throw error;
    } finally {
      await ConsumerPortal.clearComplaintMocks();
    }
  });
});
