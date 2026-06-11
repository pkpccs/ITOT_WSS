import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
const logsDir = path.resolve(process.cwd(), "storage/logs");
export async function getLogs(limit = 100) {
    const maxLines = Number.isFinite(limit) ? Math.max(1, Math.min(Math.floor(limit), 1000)) : 100;
    let files = [];
    try {
        files = await readdir(logsDir);
    }
    catch {
        return { ok: true, limit: maxLines, logs: [] };
    }
    const logFiles = files
        .filter((file) => file.endsWith(".log"))
        .sort((a, b) => b.localeCompare(a));
    const lines = [];
    for (const file of logFiles) {
        const fullPath = path.join(logsDir, file);
        const content = await readFile(fullPath, "utf8");
        const fileLines = content
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
        for (let i = fileLines.length - 1; i >= 0; i -= 1) {
            lines.push(fileLines[i]);
            if (lines.length >= maxLines) {
                return { ok: true, limit: maxLines, logs: lines };
            }
        }
    }
    return { ok: true, limit: maxLines, logs: lines };
}
