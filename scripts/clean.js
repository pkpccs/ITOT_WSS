import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function removePath(targetPath) {
  if (!fs.existsSync(targetPath)) return;

  try {
    fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: could not remove ${targetPath}. Continuing. ${message}`);
  }
}

function removeFile(targetPath) {
  if (!fs.existsSync(targetPath)) return;

  try {
    fs.unlinkSync(targetPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: could not remove ${targetPath}. Continuing. ${message}`);
  }
}

function cleanCompiledJs(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanCompiledJs(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      removeFile(fullPath);
    }
  }
}

const args = process.argv.slice(2);

if (args.includes("allure")) {
  removePath("./allure-results");
  removePath("./allure-report");
  removePath("./allure-report-bill-status");
  process.exit(0);
}

cleanCompiledJs("./mcp-server");
cleanCompiledJs("./src/services");
removePath("./dist");
removePath("./playwright-report");
removePath("./test-results");
removePath("./test-results-api");
removePath("./.playwright-mcp");
removePath("./blob-report");
removeFile("./src/runner/testRunner.js");
