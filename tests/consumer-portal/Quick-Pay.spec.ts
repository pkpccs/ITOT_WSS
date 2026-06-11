import { test } from "../../src/fixtures/testFixtures";
import userData from "../../src/test-data/users.json" with { type: "json" };

test.describe("Consumer Portal Quick Pay Suite", () => {
  test.describe.configure({ mode: "parallel" });

  const { consumerNumber, mobile, otp } = userData.validConsumer;

  test.beforeEach(async ({ ConsumerPortal }) => {
    await ConsumerPortal.goto();
  });

  test("CP-TC-01 | should open quick pay from bill and payments menu", async ({ ConsumerPortal }) => {
    await ConsumerPortal.openQuickPayFromBillAndPayments();
  });

  test("CP-TC-02 | should show quick pay input fields", async ({ ConsumerPortal }) => {
    await ConsumerPortal.openQuickPayPage();
    await ConsumerPortal.verifyQuickPayPageControls();
  });

  test("CP-TC-03 | should enter consumer number on quick pay page", async ({ ConsumerPortal }) => {
    await ConsumerPortal.openQuickPayPage();
    await ConsumerPortal.enterConsumerNumber(consumerNumber);
  });

  test("CP-TC-04 | should enter consumer and mobile number on quick pay page", async ({ ConsumerPortal }) => {
    await ConsumerPortal.openQuickPayPage();
    await ConsumerPortal.enterConsumerNumber(consumerNumber);
    await ConsumerPortal.enterMobileNumber(mobile);
    await ConsumerPortal.clickSendOtpButton();
    await ConsumerPortal.enterOtp(otp);
    await ConsumerPortal.verifyOtp();
    await ConsumerPortal.enterCaptcha("123456"); // Note: Replace "123456" with your test environment's static captcha or extraction logic
  });
});
