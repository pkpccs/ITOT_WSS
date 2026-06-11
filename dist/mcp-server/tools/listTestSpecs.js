import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
export async function listTestSpecs() {
    const results = [];
    const testsDir = path.join(process.cwd(), "tests");
    async function walk(currentDir) {
        let entries;
        try {
            entries = await fs.readdir(currentDir, { withFileTypes: true });
        }
        catch (err) {
            return; // Ignore if directory doesn't exist or isn't accessible
        }
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
            }
            else if (entry.isFile() && entry.name.endsWith(".spec.ts")) {
                // Store the relative path with standard forward slashes
                results.push(path.relative(process.cwd(), fullPath).replace(/\\/g, "/"));
            }
        }
    }
    await walk(testsDir);
    return results.length > 0 ? results : ["No test specs found."];
}
