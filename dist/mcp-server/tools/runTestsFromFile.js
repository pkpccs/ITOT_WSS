import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runTest } from "./runTest.js";
import { writeLog } from "../context/logger.js";
import { saveTestRun } from "../../src/services/db/testRunStore.js";
export async function runTestsFromFile(filePath = "Tests.txt", headed = false, testIds) {
    await writeLog(`runTestsFromFile called with file: ${filePath}`);
    const fullPath = path.resolve(process.cwd(), filePath);
    if (testIds && testIds.length > 0) {
        try {
            writeFileSync(fullPath, testIds.join("\n"), "utf8");
            await writeLog(`Dynamically updated ${filePath} with ${testIds.length} test IDs`);
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            await writeLog(`Failed to write to file ${filePath}: ${msg}`);
            return { ok: false, error: msg };
        }
    }
    let tests = [];
    try {
        const content = readFileSync(fullPath, "utf8");
        tests = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        await writeLog(`Failed to read file ${filePath}: ${msg}`);
        return { ok: false, error: msg };
    }
    const uniqueTests = [...new Set(tests)];
    if (uniqueTests.length === 0) {
        return { ok: false, error: `No test cases found in ${filePath}` };
    }
    const filter = uniqueTests.join("|");
    await writeLog(`Extracted filter from ${filePath}: ${filter}`);
    const result = await runTest(filter, headed);
    const record = saveTestRun({
        testName: `File: ${filePath}`,
        passed: result.ok,
    });
    return { ...result, recordId: record.id };
}
