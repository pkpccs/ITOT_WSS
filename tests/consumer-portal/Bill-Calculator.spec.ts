import { expect, test } from "../../src/fixtures/testFixtures";
import userData from "../../src/test-data/users.json" with { type: "json" };

type ValidationDefectCase = {
  id: string;
  title: string;
  units: string;
  expectedMessage: RegExp;
};

const POSITIVE_INPUT = userData.billCalculatorData;
const ADVANCED_INPUT = userData.advancedBillCalculatorData;

const VALIDATION_DEFECT_CASES: ValidationDefectCase[] = [
  {
    id: "CP-TC-18",
    title: "Negative: Empty Consumed Units should show required validation",
    units: "",
    expectedMessage: /required|enter.+units|fill out this field/i,
  },
  {
    id: "CP-TC-19",
    title: "Negative: Invalid Units Input should show numeric validation",
    units: "abc$@!",
    expectedMessage: /numeric|number|invalid/i,
  },
  {
    id: "CP-TC-20",
    title: "Negative: Negative Units should show validation",
    units: "-50",
    expectedMessage: /negative|greater than 0|minimum/i,
  },
  {
    id: "CP-TC-21",
    title: "Negative: Zero Units should show validation",
    units: "0",
    expectedMessage: /greater than 0|minimum|invalid/i,
  },
];

const log = (message: string) => {
  console.log(`[BillCalculatorSpec] ${message}`);
};

async function runStep(stepName: string, action: () => Promise<void>) {
  log(stepName);
  await test.step(stepName, action);
}

test.describe("Consumer Portal Bill Calculator Suite", () => {
  test.describe.configure({ mode: "parallel" });

  test.beforeEach(async ({ ConsumerPortal }) => {
    await runStep("Open the application and navigate to Bill Calculator", async () => {
      await ConsumerPortal.openBillCalculatorPage();
    });

    await runStep("Verify the Bill Calculator page is opened successfully", async () => {
      await ConsumerPortal.verifyBillCalculatorPageLoaded();
      await ConsumerPortal.verifyGenericCalculatorControls();
      await ConsumerPortal.verifyGenericDefaults();
    });
  });

  test("CP-TC-17 | Positive: Calculate bill successfully with valid Generic inputs", async ({ ConsumerPortal }) => {
    try {
      await runStep("Select Generic calculator values", async () => {
        await ConsumerPortal.clickGenericTab();
        await ConsumerPortal.selectTariff(POSITIVE_INPUT.tariff);
        await ConsumerPortal.selectCategory(POSITIVE_INPUT.category);
        await ConsumerPortal.selectBillingCycle(POSITIVE_INPUT.billingCycle);
        await ConsumerPortal.enterConsumedUnits(POSITIVE_INPUT.consumedUnits);
        await ConsumerPortal.selectPhase(POSITIVE_INPUT.phase);
      });

      await runStep("Calculate the bill", async () => {
        await ConsumerPortal.clickCalculateBill();
      });

      await runStep("Verify the bill breakdown and selected values", async () => {
        await ConsumerPortal.verifyBillBreakdownModalVisible();

        const summary = await ConsumerPortal.getBillBreakdownSummary();
        const selectedTariff = await ConsumerPortal.getGenericSelectedTariffLabel();
        const selectedCategory = await ConsumerPortal.getGenericSelectedCategoryLabel();
        const selectedBillingCycle = await ConsumerPortal.getGenericSelectedBillingCycleLabel();
        const selectedPhase = await ConsumerPortal.getGenericSelectedPhaseLabel();
        const enteredUnits = await ConsumerPortal.getConsumedUnitsValue();

        expect(selectedTariff).toBe(POSITIVE_INPUT.tariff);
        expect(selectedCategory).toBe(POSITIVE_INPUT.category);
        expect(selectedBillingCycle).toBe(POSITIVE_INPUT.billingCycle);
        expect(selectedPhase).toBe(POSITIVE_INPUT.phase);
        expect(enteredUnits).toBe(POSITIVE_INPUT.consumedUnits);

        expect(summary.energyCharge).toMatch(/\u20B9|Rs/i);
        expect(summary.duty).toMatch(/\u20B9|Rs/i);
        expect(summary.fixedCharge).toMatch(/\u20B9|Rs/i);
        expect(summary.meterRent).toMatch(/\u20B9|Rs/i);
        expect(summary.totalAmount).toMatch(/\u20B9|Rs/i);
      });
    } catch (error) {
      console.error("[BillCalculatorSpec] CP-TC-17 failed", error);
      throw error;
    }
  });

  for (const defectCase of VALIDATION_DEFECT_CASES) {
    test(`${defectCase.id} | ${defectCase.title}`, async ({ ConsumerPortal, page }) => {
      test.fail(
        true,
        "Known product defect: the Generic Bill Calculator currently accepts invalid units and still opens a static bill breakdown modal.",
      );

      try {
        await runStep("Enter invalid consumed units and attempt calculation", async () => {
          await ConsumerPortal.clickGenericTab();
          await ConsumerPortal.enterConsumedUnits(defectCase.units);
          await ConsumerPortal.clickCalculateBill();
        });

        await runStep("Verify the calculation is blocked with a validation message", async () => {
          await ConsumerPortal.verifyBillBreakdownModalNotVisible();
          await expect(page.getByText(defectCase.expectedMessage).first()).toBeVisible();
        });
      } catch (error) {
        console.error(`[BillCalculatorSpec] ${defectCase.id} failed`, error);
        throw error;
      }
    });
  }

  test("CP-TC-22 | Negative: Extremely high units should not crash the calculator", async ({ ConsumerPortal }) => {
    try {
      await runStep("Enter an extremely high unit value", async () => {
        await ConsumerPortal.clickGenericTab();
        await ConsumerPortal.enterConsumedUnits(POSITIVE_INPUT.extremelyHighUnits);
        await ConsumerPortal.clickCalculateBill();
      });

      await runStep("Verify the page remains stable and a result modal is shown", async () => {
        await ConsumerPortal.verifyBillCalculatorPageLoaded();
        await ConsumerPortal.verifyBillBreakdownModalVisible();

        const summary = await ConsumerPortal.getBillBreakdownSummary();
        expect(summary.totalAmount).toMatch(/\u20B9|Rs/i);
      });
    } catch (error) {
      console.error("[BillCalculatorSpec] CP-TC-22 failed", error);
      throw error;
    }
  });

  test("CP-TC-23 | Negative: Tariff not selected validation", async ({ ConsumerPortal }) => {
    test.skip(
      true,
      "The live Generic calculator exposes only one preselected Tariff option and does not provide an unselected state to validate.",
    );

    await ConsumerPortal.verifyBillCalculatorPageLoaded();
  });

  test("CP-TC-24 | Negative: Category not selected validation", async ({ ConsumerPortal }) => {
    test.skip(
      true,
      "The live Generic calculator exposes only one preselected Category option and does not provide an unselected state to validate.",
    );

    await ConsumerPortal.verifyBillCalculatorPageLoaded();
  });

  test("CP-TC-25 | Negative: Billing Cycle not selected validation", async ({ ConsumerPortal }) => {
    test.skip(
      true,
      "The live Generic calculator preselects Billing Cycle by default and does not allow a blank state through the UI.",
    );

    await ConsumerPortal.verifyBillCalculatorPageLoaded();
  });

  test("CP-TC-26 | Negative: Phase not selected validation", async ({ ConsumerPortal }) => {
    test.skip(
      true,
      "The live Generic calculator preselects Phase by default and does not allow a blank state through the UI.",
    );

    await ConsumerPortal.verifyBillCalculatorPageLoaded();
  });

  test("CP-TC-27 | Negative: Calculate without mandatory fields should be blocked", async ({ ConsumerPortal, page }) => {
    test.fail(
      true,
      "Known product defect: clicking Calculate Bill without units still opens the static bill breakdown modal.",
    );

    try {
      await runStep("Leave the consumed units blank and calculate", async () => {
        await ConsumerPortal.clickGenericTab();
        await ConsumerPortal.clearBillCalculatorUnits();
        await ConsumerPortal.clickCalculateBill();
      });

      await runStep("Verify the action is blocked with validation feedback", async () => {
        await ConsumerPortal.verifyBillBreakdownModalNotVisible();
        await expect(page.getByText(/required|enter.+units|fill out this field/i).first()).toBeVisible();
      });
    } catch (error) {
      console.error("[BillCalculatorSpec] CP-TC-27 failed", error);
      throw error;
    }
  });

  test("CP-TC-28 | UI Validation: Generic calculator controls and responsive layout", async ({ ConsumerPortal, page }) => {
    try {
      await runStep("Verify all Generic calculator controls are visible and editable", async () => {
        await ConsumerPortal.verifyGenericCalculatorControls();
      });

      await runStep("Validate responsive behavior on mobile viewport", async () => {
        await page.setViewportSize({ width: 375, height: 812 });
        await ConsumerPortal.verifyBillCalculatorPageLoaded();
        await ConsumerPortal.verifyGenericCalculatorControls();
        const calculateButton = await ConsumerPortal.getActiveCalculateBillButton();
        await calculateButton.scrollIntoViewIfNeeded();
        await expect(calculateButton).toBeInViewport();
      });

      await runStep("Restore desktop viewport", async () => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await ConsumerPortal.verifyBillCalculatorPageLoaded();
      });
    } catch (error) {
      console.error("[BillCalculatorSpec] CP-TC-28 failed", error);
      throw error;
    }
  });

  test("CP-TC-29 | API failure handling for Bill Calculator", async ({ ConsumerPortal }) => {
    test.skip(
      true,
      "No bill-calculation API request is made by the live page. The Calculate Bill control only opens a static Bootstrap modal, so API failure simulation is not applicable here.",
    );

    await ConsumerPortal.verifyBillCalculatorPageLoaded();
  });

  test("CP-TC-30 | Session timeout handling for Bill Calculator", async ({ ConsumerPortal }) => {
    test.skip(
      true,
      "No authenticated or calculation API call is triggered by the live Bill Calculator flow, so session-timeout simulation is not applicable to the current implementation.",
    );

    await ConsumerPortal.verifyBillCalculatorPageLoaded();
  });
});

test.describe("Consumer Portal Advanced Bill Calculator Suite", () => {
  test.describe.configure({ mode: "parallel" });

  test.beforeEach(async ({ ConsumerPortal }) => {
    await runStep("Open the application and navigate to Bill Calculator", async () => {
      await ConsumerPortal.openBillCalculatorPage();
    });

    await runStep("Verify the Advanced Bill Calculator section is available", async () => {
      await ConsumerPortal.verifyBillCalculatorPageLoaded();
      await ConsumerPortal.verifyTabsVisible();
      await ConsumerPortal.clickAdvancedTab();
      await ConsumerPortal.verifyAdvancedCalculatorControls();
      await ConsumerPortal.verifyAdvancedDefaults();
    });
  });

  test("CP-TC-31 | Positive: Calculate bill successfully with valid Advanced inputs", async ({ ConsumerPortal, page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    try {
      await runStep("Select Advanced calculator values", async () => {
        await ConsumerPortal.selectPricingType(ADVANCED_INPUT.pricingType);
        await ConsumerPortal.selectAdvancedTariff(ADVANCED_INPUT.tariff);
        await ConsumerPortal.selectAdvancedBillingCycle(ADVANCED_INPUT.billingCycle);
        await ConsumerPortal.enterConnectedLoad(ADVANCED_INPUT.connectedLoad);
        await ConsumerPortal.selectAdvancedPhase(ADVANCED_INPUT.phase);
        await ConsumerPortal.selectMeterOwner(ADVANCED_INPUT.meterOwner);
        await ConsumerPortal.enterAdvancedConsumedUnits(ADVANCED_INPUT.unitConsumed);
      });

      await runStep("Calculate the Advanced bill", async () => {
        await ConsumerPortal.clickCalculateBill();
      });

      await runStep("Verify the bill breakdown and selected Advanced values", async () => {
        await ConsumerPortal.verifyBillBreakdownModalVisible();

        const summary = await ConsumerPortal.getBillBreakdownSummary();
        const selectedPricingType = await ConsumerPortal.getAdvancedSelectedPricingTypeLabel();
        const selectedTariff = await ConsumerPortal.getAdvancedSelectedTariffLabel();
        const selectedBillingCycle = await ConsumerPortal.getAdvancedSelectedBillingCycleLabel();
        const selectedPhase = await ConsumerPortal.getAdvancedSelectedPhaseLabel();
        const selectedMeterOwner = await ConsumerPortal.getAdvancedSelectedMeterOwnerLabel();
        const enteredLoad = await ConsumerPortal.getConnectedLoadValue();
        const enteredUnits = await ConsumerPortal.getAdvancedConsumedUnitsValue();

        expect(selectedPricingType).toBe(ADVANCED_INPUT.pricingType);
        expect(selectedTariff).toBe(ADVANCED_INPUT.tariff);
        expect(selectedBillingCycle).toBe(ADVANCED_INPUT.billingCycle);
        expect(selectedPhase).toBe(ADVANCED_INPUT.phase);
        expect(selectedMeterOwner).toBe(ADVANCED_INPUT.meterOwner);
        expect(enteredLoad).toBe(ADVANCED_INPUT.connectedLoad);
        expect(enteredUnits).toBe(ADVANCED_INPUT.unitConsumed);

        expect(summary.energyCharge).toMatch(/\u20B9|Rs/i);
        expect(summary.duty).toMatch(/\u20B9|Rs/i);
        expect(summary.fixedCharge).toMatch(/\u20B9|Rs/i);
        expect(summary.meterRent).toMatch(/\u20B9|Rs/i);
        expect(summary.totalAmount).toMatch(/\u20B9|Rs/i);
        expect(consoleErrors).toEqual([]);
      });
    } catch (error) {
      console.error("[BillCalculatorSpec] CP-TC-31 failed", error);
      throw error;
    }
  });

  const advancedDefectCases = [
    { id: "CP-TC-32", title: "Negative: Empty Unit Consumed should show required validation", load: "1", units: "" },
    { id: "CP-TC-33", title: "Negative: Invalid Unit Consumed input should show numeric validation", load: "1", units: "abc$@!" },
    { id: "CP-TC-34", title: "Negative: Negative Unit Consumed should show validation", load: "1", units: "-25" },
    { id: "CP-TC-35", title: "Negative: Zero Unit Consumed should show validation", load: "1", units: "0" },
    { id: "CP-TC-37", title: "Negative: Connected Load empty should show validation", load: "", units: "100" },
    { id: "CP-TC-38", title: "Negative: Invalid Connected Load should show validation", load: "abc*%", units: "100" },
  ] as const;

  for (const defectCase of advancedDefectCases) {
    test(`${defectCase.id} | ${defectCase.title}`, async ({ ConsumerPortal, page }) => {
      test.fail(
        true,
        "Known product defect: the Advanced Bill Calculator currently accepts invalid or blank input and still opens a static bill breakdown modal.",
      );

      try {
        await runStep("Enter invalid Advanced input and attempt calculation", async () => {
          await ConsumerPortal.enterConnectedLoad(defectCase.load);
          await ConsumerPortal.enterAdvancedConsumedUnits(defectCase.units);
          await ConsumerPortal.clickCalculateBill();
        });

        await runStep("Verify the calculation is blocked with validation feedback", async () => {
          await ConsumerPortal.verifyBillBreakdownModalNotVisible();
          await expect(page.getByText(/required|numeric|number|invalid|greater than 0|minimum/i).first()).toBeVisible();
        });
      } catch (error) {
        console.error(`[BillCalculatorSpec] ${defectCase.id} failed`, error);
        throw error;
      }
    });
  }

  test("CP-TC-36 | Negative: Extremely high units should not crash the Advanced calculator", async ({ ConsumerPortal }) => {
    try {
      await runStep("Enter an extremely high Advanced unit value", async () => {
        await ConsumerPortal.enterConnectedLoad(ADVANCED_INPUT.connectedLoad);
        await ConsumerPortal.enterAdvancedConsumedUnits(ADVANCED_INPUT.extremelyHighUnits);
        await ConsumerPortal.clickCalculateBill();
      });

      await runStep("Verify the Advanced calculator remains stable", async () => {
        await ConsumerPortal.verifyBillCalculatorPageLoaded();
        await ConsumerPortal.verifyBillBreakdownModalVisible();

        const summary = await ConsumerPortal.getBillBreakdownSummary();
        expect(summary.totalAmount).toMatch(/\u20B9|Rs/i);
      });
    } catch (error) {
      console.error("[BillCalculatorSpec] CP-TC-36 failed", error);
      throw error;
    }
  });

  test("CP-TC-39 | Negative: Pricing Type not selected validation", async ({ ConsumerPortal }) => {
    test.skip(
      true,
      "The live Advanced calculator preselects Pricing Type and does not allow a blank state through the UI.",
    );

    await ConsumerPortal.verifyBillCalculatorPageLoaded();
  });

  test("CP-TC-40 | Negative: Tariff not selected validation", async ({ ConsumerPortal }) => {
    test.skip(
      true,
      "The live Advanced calculator exposes only one preselected Tariff option and does not provide an unselected state to validate.",
    );

    await ConsumerPortal.verifyBillCalculatorPageLoaded();
  });

  test("CP-TC-41 | Negative: Billing Cycle not selected validation", async ({ ConsumerPortal }) => {
    test.skip(
      true,
      "The live Advanced calculator preselects Billing Cycle and does not allow a blank state through the UI.",
    );

    await ConsumerPortal.verifyBillCalculatorPageLoaded();
  });

  test("CP-TC-42 | Negative: Phase not selected validation", async ({ ConsumerPortal }) => {
    test.skip(
      true,
      "The live Advanced calculator preselects Phase and does not allow a blank state through the UI.",
    );

    await ConsumerPortal.verifyBillCalculatorPageLoaded();
  });

  test("CP-TC-43 | Negative: Meter Owner not selected validation", async ({ ConsumerPortal }) => {
    test.skip(
      true,
      "The live Advanced calculator preselects Meter Owner and does not allow a blank state through the UI.",
    );

    await ConsumerPortal.verifyBillCalculatorPageLoaded();
  });

  test("CP-TC-44 | Negative: Calculate without mandatory fields should be blocked", async ({ ConsumerPortal, page }) => {
    test.fail(
      true,
      "Known product defect: clicking Calculate Bill on the Advanced tab without data still opens the static bill breakdown modal.",
    );

    try {
      await runStep("Leave mandatory Advanced fields blank and calculate", async () => {
        await ConsumerPortal.clearConnectedLoad();
        await ConsumerPortal.clearAdvancedConsumedUnits();
        await ConsumerPortal.clickCalculateBill();
      });

      await runStep("Verify calculation is blocked with validation feedback", async () => {
        await ConsumerPortal.verifyBillBreakdownModalNotVisible();
        await expect(page.getByText(/required|enter|invalid/i).first()).toBeVisible();
      });
    } catch (error) {
      console.error("[BillCalculatorSpec] CP-TC-44 failed", error);
      throw error;
    }
  });

  test("CP-TC-45 | UI Validation: Advanced controls and responsive layout", async ({ ConsumerPortal, page }) => {
    try {
      await runStep("Verify Advanced controls are visible and enabled", async () => {
        await ConsumerPortal.verifyTabsVisible();
        await ConsumerPortal.verifyAdvancedCalculatorControls();
      });

      await runStep("Validate responsive behavior on mobile viewport", async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await ConsumerPortal.verifyBillCalculatorPageLoaded();
        await ConsumerPortal.clickAdvancedTab();
        await ConsumerPortal.verifyAdvancedCalculatorControls();
        const calculateButton = await ConsumerPortal.getActiveCalculateBillButton();
        await calculateButton.scrollIntoViewIfNeeded();
        await expect(calculateButton).toBeInViewport();
      });

      await runStep("Restore desktop viewport", async () => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await ConsumerPortal.verifyBillCalculatorPageLoaded();
      });
    } catch (error) {
      console.error("[BillCalculatorSpec] CP-TC-45 failed", error);
      throw error;
    }
  });

  test("CP-TC-46 | API failure handling for Advanced Bill Calculator", async ({ ConsumerPortal }) => {
    test.skip(
      true,
      "No bill-calculation API request is made by the live Advanced page. The Calculate Bill control only opens a static Bootstrap modal, so API failure simulation is not applicable here.",
    );

    await ConsumerPortal.verifyBillCalculatorPageLoaded();
  });

  test("CP-TC-47 | Session timeout handling for Advanced Bill Calculator", async ({ ConsumerPortal }) => {
    test.skip(
      true,
      "No authenticated or calculation API call is triggered by the live Advanced Bill Calculator flow, so session-timeout simulation is not applicable to the current implementation.",
    );

    await ConsumerPortal.verifyBillCalculatorPageLoaded();
  });

  test("CP-TC-48 | Advanced tab navigation should preserve entered data without UI crash", async ({ ConsumerPortal }) => {
    try {
      await runStep("Enter data on the Advanced tab", async () => {
        await ConsumerPortal.enterConnectedLoad(ADVANCED_INPUT.tabNavigationConnectedLoad);
        await ConsumerPortal.enterAdvancedConsumedUnits(ADVANCED_INPUT.tabNavigationUnits);
      });

      await runStep("Switch between Generic and Advanced tabs multiple times", async () => {
        await ConsumerPortal.clickGenericTab();
        await ConsumerPortal.clickAdvancedTab();
        await ConsumerPortal.clickGenericTab();
        await ConsumerPortal.clickAdvancedTab();
      });

      await runStep("Verify data is preserved and the UI remains stable", async () => {
        expect(await ConsumerPortal.getConnectedLoadValue()).toBe(ADVANCED_INPUT.tabNavigationConnectedLoad);
        expect(await ConsumerPortal.getAdvancedConsumedUnitsValue()).toBe(ADVANCED_INPUT.tabNavigationUnits);
        await ConsumerPortal.verifyAdvancedCalculatorControls();
      });
    } catch (error) {
      console.error("[BillCalculatorSpec] CP-TC-48 failed", error);
      throw error;
    }
  });

  test("CP-TC-49 | Browser compatibility smoke for Advanced Bill Calculator", async ({ ConsumerPortal}, testInfo) => {
    try {
      await runStep(`Verify Advanced Bill Calculator on ${testInfo.project.name}`, async () => {
        await ConsumerPortal.verifyBillCalculatorPageLoaded();
        await ConsumerPortal.verifyTabsVisible();
        await ConsumerPortal.clickAdvancedTab();
        await ConsumerPortal.verifyAdvancedCalculatorControls();
      });
    } catch (error) {
      console.error("[BillCalculatorSpec] CP-TC-49 failed", error);
      throw error;
    }
  });
});
