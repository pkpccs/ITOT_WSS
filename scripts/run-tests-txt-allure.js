import { spawn } from "node:child_process";

function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      shell: true,
      stdio: "inherit",
    });

    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

async function main() {
  const cleanCode = await runCommand("npm", ["run", "allure:clean"]);
  if (cleanCode !== 0) {
    process.exit(cleanCode);
  }

  const testCode = await runCommand("npm", ["run", "testrun:file:allure"]);
  const reportCode = await runCommand("npx", [
    "allure",
    "generate",
    "allure-results",
    "--clean",
    "-o",
    "allure-report",
  ]);

  if (reportCode !== 0) {
    process.exit(reportCode);
  }

  process.exit(testCode);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
