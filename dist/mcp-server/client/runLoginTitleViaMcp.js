import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import process from "node:process";
async function main() {
    const client = new Client({ name: "mcp-local-test-runner", version: "1.0.0" }, { capabilities: {} });
    const transport = new StdioClientTransport({
        command: process.execPath,
        args: ["dist/mcp-server/server.js"],
        cwd: process.cwd(),
        stderr: "inherit",
    });
    await client.connect(transport);
    const tools = await client.listTools();
    const toolNames = tools.tools.map((tool) => tool.name);
    if (!toolNames.includes("runTest")) {
        throw new Error(`runTest tool not found. Available tools: ${toolNames.join(", ")}`);
    }
    const specPath = "tests/auth/login.spec.ts";
    const result = await client.callTool({
        name: "runTest",
        arguments: { testName: specPath },
    });
    const content = Array.isArray(result.content) ? result.content : [];
    const textOutput = content
        .filter((item) => typeof item === "object" &&
        item !== null &&
        "type" in item &&
        item.type === "text" &&
        "text" in item &&
        typeof item.text === "string")
        .map((item) => item.text)
        .join("\n");
    process.stdout.write(`${textOutput}\n`);
    await transport.close();
}
main().catch((error) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
});
