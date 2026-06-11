/// <reference types="node" />
import { readFileSync } from "fs";
import { runTest } from "../../mcp-server/tools/runTest.js";
import { saveTestRun } from "../services/db/testRunStore.js";
const args = process.argv.slice(2);
const headed = args.includes("--headed");
const allure = args.includes("--allure");
function getArgValue(name) {
    const index = args.indexOf(name);
    if (index === -1) {
        return undefined;
    }
    return args[index + 1];
}
function readTestFilterFromFile(filePath) {
    const tests = readFileSync(filePath, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    const uniqueTests = [...new Set(tests)];
    if (uniqueTests.length === 0) {
        throw new Error(`No test cases found in ${filePath}`);
    }
    return uniqueTests.join("|");
}
const filePath = getArgValue("--file");
const positionalFilter = args.filter((arg, index) => {
    if (arg === "--headed" || arg === "--file") {
        return false;
    }
    if (index > 0 && args[index - 1] === "--file") {
        return false;
    }
    return true;
})[0];
const testFilter = filePath ? readTestFilterFromFile(filePath) : positionalFilter;
if (!testFilter) {
    console.error("Error: No test filter or file specified.");
    console.error("Usage: npm run testrun -- <test_filter | file.ts> [--file <filepath>] [--headed] [--allure]");
    process.exit(1);
}
async function main() {
    console.log(`Executing test run... Filter: "${testFilter}" | Headed: ${headed} | Allure: ${allure}\n`);
    const result = await runTest(testFilter, headed, false, allure ? "allure-playwright" : undefined);
    console.log("--- STDOUT ---");
    console.log(result.stdout);
    if (result.stderr) {
        console.log("--- STDERR ---");
        console.error(result.stderr);
    }
    const record = saveTestRun({
        testName: testFilter,
        passed: result.ok,
    });
    console.log(`\nStatus: ${result.ok ? "PASSED" : "FAILED"}`);
    console.log(`Run saved with ID: ${record.id}`);
    process.exit(result.ok ? 0 : 1);
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
