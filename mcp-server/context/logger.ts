import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

const logsDir = path.resolve(process.cwd(), "storage/logs");

function timestamp() {
  return new Date().toISOString();
}

export async function writeLog(message: string) {
  await mkdir(logsDir, { recursive: true });
  const day = new Date().toISOString().slice(0, 10);
  const logFile = path.join(logsDir, `${day}.log`);
  await appendFile(logFile, `[${timestamp()}] ${message}\n`, "utf8");
}
