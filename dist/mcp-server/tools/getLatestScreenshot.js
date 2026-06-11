import { readdir, stat, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { writeLog } from "../context/logger.js";
const screenshotsDir = path.resolve(process.cwd(), "storage/screenshots");
export async function getLatestScreenshot() {
    await writeLog("getLatestScreenshot called");
    try {
        let files = [];
        try {
            files = await readdir(screenshotsDir);
        }
        catch {
            return { ok: false, error: "Screenshots directory does not exist or is empty." };
        }
        const pngFiles = files.filter(f => f.endsWith(".png"));
        if (pngFiles.length === 0) {
            return { ok: false, error: "No screenshots found in storage/screenshots." };
        }
        // Sort to find the most recently modified file
        const sortedFiles = await Promise.all(pngFiles.map(async (file) => {
            const fileStat = await stat(path.join(screenshotsDir, file));
            return { file, time: fileStat.mtimeMs };
        }));
        sortedFiles.sort((a, b) => b.time - a.time);
        const latestFile = sortedFiles[0].file;
        const imageBuffer = await readFile(path.join(screenshotsDir, latestFile));
        return { ok: true, name: latestFile, data: imageBuffer.toString("base64") };
    }
    catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
}
