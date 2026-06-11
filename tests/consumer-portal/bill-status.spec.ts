import { test } from "../../src/fixtures/testFixtures";
import userData from "../../src/test-data/users.json" with { type: "json" };

test.describe("Consumer Portal Bill Status Suite", () => {
  test.describe.configure({ mode: "serial" });

  const { consumerNumber, otp, billNumber } = userData.billStatusConsumer;
  const shortConsumerNumber = "123";
  const unknownConsumerNumber = "9999999999999";
  const wrongOtp = "111111";

  const log = (message: string) => {
    console.log(`[BillStatusSpec] ${message}`);
  };

  async function runStep(stepName: string, action: () => Promise<void>) {
    log(stepName);
    await test.step(stepName, action);
  }

  test("CP-TC-05 | should complete Bill Status flow and display bill details for a valid consumer", async ({
    ConsumerPortal,
  }) => {
    try {
      await runStep("Open the application and navigate to Bill Status from Bill & Payments", async () => {
        await ConsumerPortal.openBillStatusFromBillAndPaymentsMenu();
        await ConsumerPortal.verifyBillStatusPageControls();
      });

      await runStep("Enter valid consumer number and request OTP", async () => {
        await ConsumerPortal.enterBillStatusConsumerNumber(consumerNumber);
        await ConsumerPortal.requestBillStatusOtp();
      });

      await runStep("Verify OTP popup and submit valid OTP", async () => {
        await ConsumerPortal.submitBillStatusOtp(otp);
      });

      await runStep("Search bill details after successful OTP validation", async () => {
        await ConsumerPortal.openBillStatusResults();
      });

      await runStep("Verify Bill Details section and billing identifiers", async () => {
        await ConsumerPortal.verifyBillDetails(consumerNumber, billNumber);
      });
    } catch (error) {
      console.error("[BillStatusSpec] CP-TC-05 failed", error);
      throw error;
    } finally {
      await ConsumerPortal.clearNetworkMocks();
    }
  });

  test("CP-TC-06 | should validate Bill Status page UI controls", async ({ ConsumerPortal }) => {
    try {
      await runStep("Open the application and navigate to Bill Status", async () => {
        await ConsumerPortal.openBillStatusPage();
      });

      await runStep("Verify all Bill Status controls are visible and correctly configured", async () => {
        await ConsumerPortal.verifyBillStatusPageControls();
        await ConsumerPortal.verifyBillStatusOtpButtonDisabled();
      });
    } catch (error) {
      console.error("[BillStatusSpec] CP-TC-06 failed", error);
      throw error;
    } finally {
      await ConsumerPortal.clearNetworkMocks();
    }
  });

  test("CP-TC-07 | should show required validation when consumer number is empty", async ({ ConsumerPortal }) => {
    try {
      await runStep("Open the application and navigate to Bill Status", async () => {
        await ConsumerPortal.openBillStatusPage();
      });

      await runStep("Verify empty consumer number blocks GET OTP", async () => {
        await ConsumerPortal.verifyBillStatusOtpButtonDisabled();
        await ConsumerPortal.verifyBillStatusConsumerValidationMessage(/fill out this field/i);
      });
    } catch (error) {
      console.error("[BillStatusSpec] CP-TC-07 failed", error);
      throw error;
    } finally {
      await ConsumerPortal.clearNetworkMocks();
    }
  });

  test("CP-TC-08 | should show validation for a short consumer number", async ({ ConsumerPortal }) => {
    try {
      await runStep("Open the application and navigate to Bill Status", async () => {
        await ConsumerPortal.openBillStatusPage();
      });

      await runStep("Enter a short consumer number", async () => {
        await ConsumerPortal.enterBillStatusConsumerNumber(shortConsumerNumber);
      });

      await runStep("Verify the format validation message and blocked GET OTP action", async () => {
        await ConsumerPortal.verifyBillStatusOtpButtonDisabled();
        await ConsumerPortal.verifyBillStatusConsumerValidationMessage(/match the requested format/i);
      });
    } catch (error) {
      console.error("[BillStatusSpec] CP-TC-08 failed", error);
      throw error;
    } finally {
      await ConsumerPortal.clearNetworkMocks();
    }
  });

  test("CP-TC-09 | should reject an unknown consumer number", async ({ ConsumerPortal }) => {
    try {
      await runStep("Open the application and navigate to Bill Status", async () => {
        await ConsumerPortal.openBillStatusPage();
      });

      await runStep("Enter an unknown 13-digit consumer number", async () => {
        await ConsumerPortal.enterBillStatusConsumerNumber(unknownConsumerNumber);
      });

      await runStep("Verify the application shows consumer not found", async () => {
        await ConsumerPortal.requestBillStatusOtpExpectingConsumerNotFound();
      });
    } catch (error) {
      console.error("[BillStatusSpec] CP-TC-09 failed", error);
      throw error;
    } finally {
      await ConsumerPortal.clearNetworkMocks();
    }
  });

  test("CP-TC-10 | should show an invalid OTP message for a wrong OTP", async ({ ConsumerPortal }) => {
    try {
      await runStep("Open the application and navigate to Bill Status", async () => {
        await ConsumerPortal.openBillStatusPage();
      });

      await runStep("Enter valid consumer number and request OTP", async () => {
        await ConsumerPortal.enterBillStatusConsumerNumber(consumerNumber);
        await ConsumerPortal.requestBillStatusOtp();
      });

      await runStep("Submit a wrong OTP and verify rejection", async () => {
        await ConsumerPortal.submitBillStatusOtpExpectingFailure(wrongOtp);
        await ConsumerPortal.verifyBillStatusOtpDialogStillOpen();
        await ConsumerPortal.verifyBillStatusOtpNotVerified();
      });
    } catch (error) {
      console.error("[BillStatusSpec] CP-TC-10 failed", error);
      throw error;
    } finally {
      await ConsumerPortal.clearNetworkMocks();
    }
  });

  test("CP-TC-11 | should keep submit blocked when OTP is empty", async ({ ConsumerPortal }) => {
    try {
      await runStep("Open the application and navigate to Bill Status", async () => {
        await ConsumerPortal.openBillStatusPage();
      });

      await runStep("Enter valid consumer number and request OTP", async () => {
        await ConsumerPortal.enterBillStatusConsumerNumber(consumerNumber);
        await ConsumerPortal.requestBillStatusOtp();
      });

      await runStep("Verify empty OTP cannot be submitted", async () => {
        await ConsumerPortal.submitEmptyBillStatusOtp();
        await ConsumerPortal.verifyBillStatusOtpDialogStillOpen();
        await ConsumerPortal.verifyBillStatusOtpNotVerified();
      });
    } catch (error) {
      console.error("[BillStatusSpec] CP-TC-11 failed", error);
      throw error;
    } finally {
      await ConsumerPortal.clearNetworkMocks();
    }
  });

  test("CP-TC-12 | should show an expiry message when OTP verification returns expired status", async ({
    ConsumerPortal,
  }) => {
    try {
      await runStep("Open the application and navigate to Bill Status", async () => {
        await ConsumerPortal.openBillStatusPage();
      });

      await runStep("Enter valid consumer number and request OTP", async () => {
        await ConsumerPortal.enterBillStatusConsumerNumber(consumerNumber);
        await ConsumerPortal.requestBillStatusOtp();
      });

      await runStep("Simulate expired OTP response and verify the expiry message", async () => {
        await ConsumerPortal.mockBillStatusOtpVerificationFailure("OTP expired");
        await ConsumerPortal.submitBillStatusOtpExpectingMessage(otp, /OTP expired/i);
        await ConsumerPortal.verifyBillStatusOtpDialogStillOpen();
        await ConsumerPortal.verifyBillStatusOtpNotVerified();
      });
    } catch (error) {
      console.error("[BillStatusSpec] CP-TC-12 failed", error);
      throw error;
    } finally {
      await ConsumerPortal.clearNetworkMocks();
    }
  });

  test("CP-TC-13 | should block bill search before OTP verification", async ({ ConsumerPortal }) => {
    try {
      await runStep("Open the application and navigate to Bill Status", async () => {
        await ConsumerPortal.openBillStatusPage();
      });

      await runStep("Enter valid consumer number without completing OTP verification", async () => {
        await ConsumerPortal.enterBillStatusConsumerNumber(consumerNumber);
      });

      await runStep("Verify search action stays blocked before OTP verification", async () => {
        await ConsumerPortal.verifySearchBlockedWithoutOtpVerification();
        await ConsumerPortal.verifyBillStatusOtpNotVerified();
      });
    } catch (error) {
      console.error("[BillStatusSpec] CP-TC-13 failed", error);
      throw error;
    } finally {
      await ConsumerPortal.clearNetworkMocks();
    }
  });

  test("CP-TC-14 | should reject repeated wrong OTP attempts and enforce retry protection", async ({
    ConsumerPortal,
  }) => {
    try {
      await runStep("Open the application and navigate to Bill Status", async () => {
        await ConsumerPortal.openBillStatusPage();
      });

      await runStep("Enter valid consumer number and request OTP", async () => {
        await ConsumerPortal.enterBillStatusConsumerNumber(consumerNumber);
        await ConsumerPortal.requestBillStatusOtp();
      });

      await runStep("Simulate repeated wrong OTP attempts and verify retry protection messaging", async () => {
        await ConsumerPortal.mockBillStatusOtpVerificationSequence([
          "Invalid OTP",
          "Invalid OTP",
          "Maximum retry limit exceeded",
        ]);

        await ConsumerPortal.submitBillStatusOtpExpectingMessage(wrongOtp, /Invalid OTP/i);
        await ConsumerPortal.verifyBillStatusOtpDialogStillOpen();

        await ConsumerPortal.submitBillStatusOtpExpectingMessage(wrongOtp, /Invalid OTP/i);
        await ConsumerPortal.verifyBillStatusOtpDialogStillOpen();

        await ConsumerPortal.submitBillStatusOtpExpectingMessage(wrongOtp, /Maximum retry limit exceeded/i);
        await ConsumerPortal.verifyBillStatusOtpDialogStillOpen();
        await ConsumerPortal.verifyBillStatusOtpNotVerified();
      });
    } catch (error) {
      console.error("[BillStatusSpec] CP-TC-14 failed", error);
      throw error;
    } finally {
      await ConsumerPortal.clearNetworkMocks();
    }
  });

  test("CP-TC-15 | should show error handling when the GET OTP API fails", async ({ ConsumerPortal }) => {
    try {
      await runStep("Open the application and navigate to Bill Status", async () => {
        await ConsumerPortal.openBillStatusPage();
      });

      await runStep("Mock GET OTP API failure and request OTP", async () => {
        await ConsumerPortal.mockBillStatusFetchConsumerFailure("OTP service unavailable");
        await ConsumerPortal.enterBillStatusConsumerNumber(consumerNumber);
        await ConsumerPortal.clickBillStatusGetOtpButton();
      });

      await runStep("Verify error handling for GET OTP API failure", async () => {
        await ConsumerPortal.verifyErrorPopup("Error", "OTP service unavailable");
        await ConsumerPortal.dismissGenericErrorPopup();
        await ConsumerPortal.verifyBillStatusOtpNotVerified();
      });
    } catch (error) {
      console.error("[BillStatusSpec] CP-TC-15 failed", error);
      throw error;
    } finally {
      await ConsumerPortal.clearNetworkMocks();
    }
  });

  test("CP-TC-16 | should show error handling when bill search API fails", async ({ ConsumerPortal }) => {
    try {
      await runStep("Open the application and navigate to Bill Status", async () => {
        await ConsumerPortal.openBillStatusPage();
      });

      await runStep("Complete OTP verification for a valid consumer", async () => {
        await ConsumerPortal.enterBillStatusConsumerNumber(consumerNumber);
        await ConsumerPortal.requestBillStatusOtp();
        await ConsumerPortal.submitBillStatusOtp(otp);
      });

      await runStep("Mock bill search API failure and trigger bill search", async () => {
        await ConsumerPortal.mockBillStatusSearchFailure("Bill details service unavailable");
        await ConsumerPortal.openBillStatusResults();
      });

      await runStep("Verify error handling for bill search API failure", async () => {
        await ConsumerPortal.verifyErrorPopup("Error", "No data found");
        await ConsumerPortal.dismissGenericErrorPopup();
      });
    } catch (error) {
      console.error("[BillStatusSpec] CP-TC-16 failed", error);
      throw error;
    } finally {
      await ConsumerPortal.clearNetworkMocks();
    }
  });
});
