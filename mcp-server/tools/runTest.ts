import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import process from "node:process";
import { writeLog } from "../context/logger.js";

const execFileAsync = promisify(execFile);
const projectRoot = process.cwd();

// Pre-compile regex patterns for performance
const quoteStripRegex = /^["']|["']$/g;
const pipeEscapeRegex = /\^\|/g;

export async function runTest(testName: string, headed = false, lastFailed = false, reporter?: string) {
  // Strip explicit single or double quotes that might be passed from the terminal
  const normalizedTest = (testName ?? "").trim().replace(quoteStripRegex, "").replace(pipeEscapeRegex, "|");
  const nodeCommand = process.execPath;
  const playwrightCli = path.resolve(projectRoot, "node_modules/playwright/cli.js");

  const isFilePath = normalizedTest.endsWith(".ts");
  const testPath = isFilePath
    ? (normalizedTest.startsWith("tests") ? normalizedTest : path.join("tests", normalizedTest))
    : "tests";

  const args = [playwrightCli, "test", testPath];

  // Only add --grep if it's not a file path
  if (normalizedTest.length > 0 && !isFilePath) {
    args.push("--grep", normalizedTest);
  }

  if (headed) {
    args.push("--headed");
  }

  if (lastFailed) {
    args.push("--last-failed");
  }

  if (reporter) {
    args.push("--reporter", reporter);
  }

  await writeLog(`runTest called with filter: ${normalizedTest || "<none>"}`);

  try {
    const { stdout, stderr } = await execFileAsync(nodeCommand, args, {
      cwd: projectRoot,
      maxBuffer: 1024 * 1024 * 10,
      env: process.env,
    });

    await writeLog("runTest finished successfully");

    return {
      ok: true,
      command: `${nodeCommand} ${args.join(" ")}`,
      stdout,
      stderr,
    };
  } catch (error) {
    const err = error as {
      stdout?: string;
      stderr?: string;
      message?: string;
      code?: number;
    };

    await writeLog(`runTest failed: ${err.message ?? "unknown error"}`);

    return {
      ok: false,
      command: `${nodeCommand} ${args.join(" ")}`,
      code: err.code ?? 1,
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? err.message ?? "Unknown error",
    };
  }
}
