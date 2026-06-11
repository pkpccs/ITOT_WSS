import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { chromium, expect } from "@playwright/test";
import { BASE_URL, TEST_LOGIN_HOME_URL } from "../../src/config/env.js";
import usersData from "../../src/test-data/users.json" with { type: "json" };
import process from "node:process";
const validConsumer = usersData.validConsumer;
async function main() {
    const client = new Client({ name: "manage-accounts-test-runner", version: "1.0.0" }, { capabilities: {} });
    const transport = new StdioClientTransport({
        command: process.execPath,
        args: ["dist/mcp-server/server.js"],
        cwd: process.cwd(),
        stderr: "inherit",
    });
    await client.connect(transport);
    // Launch browser using Playwright
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        console.log("Starting Manage Accounts test flow...");
        // Step 1: Navigate to login page
        console.log(`Navigating to: ${BASE_URL}`);
        await page.goto(BASE_URL);
        // Step 2: Verify login page title
        await expect(page).toHaveTitle("Login : Consumer Portal");
        console.log("✓ Login page title verified");
        // Step 3: Perform OTP login flow
        const mobileNumber = validConsumer.mobile;
        const otp = validConsumer.otp;
        console.log(`Logging in with mobile: ${mobileNumber}`);
        // Click on "Login with OTP" button
        await page.getByRole("button", { name: "Login with OTP" }).click();
        console.log("✓ OTP login tab opened");
        // Enter mobile number
        await page.locator("#otpIdentifierInput").fill(mobileNumber);
        console.log(`✓ Mobile number entered: ${mobileNumber}`);
        // Click "Send OTP" button
        await page.locator("#btnSendOtp").click();
        console.log("✓ OTP sent");
        // Wait for OTP dialog and enter OTP
        const otpDialog = page.getByRole("dialog");
        await expect(otpDialog).toBeVisible({ timeout: 10000 });
        const otpDigits = otpDialog.getByRole("textbox");
        await expect(otpDigits).toHaveCount(6, { timeout: 10000 });
        await otpDigits.first().click();
        await page.keyboard.type(otp);
        console.log(`✓ OTP entered: ${otp}`);
        // Click "Verify & Sign In" button
        const verifyAndSignInButton = otpDialog.getByRole("button", { name: /Verify\s*&\s*Sign In/i });
        await expect(verifyAndSignInButton).toBeEnabled({ timeout: 10000 });
        await verifyAndSignInButton.click();
        console.log("✓ OTP verification submitted");
        // Step 4: Wait for home page to load
        try {
            await expect(page).toHaveURL(TEST_LOGIN_HOME_URL, { timeout: 15000 });
        }
        catch {
            // URL match might not be exact, verify by checking login buttons are hidden
            await expect(page.getByRole("button", { name: "Login with OTP" })).toBeHidden({ timeout: 10000 });
        }
        console.log("✓ Successfully logged in and on home page");
        // Step 5: Click on "Manage Accounts" in the header
        console.log("Looking for 'Manage Accounts' in header...");
        // Try multiple selectors to find Manage Accounts link
        let manageAccountsButton = page.locator('a:has-text("Manage Accounts")').first();
        if (!(await manageAccountsButton.isVisible({ timeout: 2000 }).catch(() => false))) {
            manageAccountsButton = page.locator('button:has-text("Manage Accounts")').first();
        }
        if (!(await manageAccountsButton.isVisible({ timeout: 2000 }).catch(() => false))) {
            manageAccountsButton = page.locator('a[href*="Account"]').first();
        }
        if (await manageAccountsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await manageAccountsButton.click();
            console.log("✓ Clicked on 'Manage Accounts'");
        }
        else {
            throw new Error("'Manage Accounts' button/link not found in header");
        }
        // Step 6: Verify Manage Accounts page loaded
        await page.waitForNavigation({ timeout: 10000 }).catch(() => {
            // Navigation might not occur, check by URL/title instead
        });
        // Verify page title or URL contains "Manage" or "Account"
        const currentUrl = page.url();
        const pageTitle = await page.title();
        console.log(`Current URL: ${currentUrl}`);
        console.log(`Page Title: ${pageTitle}`);
        if (currentUrl.toLowerCase().includes("account") || pageTitle.toLowerCase().includes("account")) {
            console.log("✓ Manage Accounts page opened successfully!");
        }
        else {
            throw new Error(`Expected 'Account' in URL or title, got: ${currentUrl} / ${pageTitle}`);
        }
        console.log("\n✅ Test PASSED: User login → Home page → Click Manage Accounts → Verify page");
    }
    catch (error) {
        const message = error instanceof Error ? error.stack ?? error.message : String(error);
        console.error(`\n❌ Test FAILED: ${message}`);
        process.exit(1);
    }
    finally {
        // Clean up
        await context.close();
        await browser.close();
        await transport.close();
    }
}
main().catch((error) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
});
