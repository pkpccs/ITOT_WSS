import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { SessionManager } from "./context/sessionManager.js";
import { runTest } from "./tools/runTest.js";
import { getLogs } from "./tools/getLogs.js";
import { runTestsFromFile } from "./tools/runTestsFromFile.js";
import { getLatestScreenshot } from "./tools/getLatestScreenshot.js";
import { listTestSpecs } from "./tools/listTestSpecs.js";
import { writeLog } from "./context/logger.js";
import process from "node:process";
const sessionManager = new SessionManager();
function toToolText(data) {
    return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}
export async function startServer() {
    const server = new Server({
        name: "mcp-playwright-framework",
        version: "1.0.0",
    }, {
        capabilities: {
            tools: {},
        },
    });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [
            {
                name: "runTest",
                description: "Run Playwright tests. Optional input: test filter string.",
                inputSchema: {
                    type: "object",
                    properties: {
                        testName: {
                            type: "string",
                            description: "Optional test name or file filter passed to Playwright.",
                        },
                        headed: {
                            type: "boolean",
                            description: "Run tests in headed mode to visually see the browser.",
                        },
                        lastFailed: {
                            type: "boolean",
                            description: "Run only the tests that failed in the previous run.",
                        },
                    },
                    additionalProperties: false,
                },
            },
            {
                name: "getLogs",
                description: "Read latest execution logs from storage/logs.",
                inputSchema: {
                    type: "object",
                    properties: {
                        limit: {
                            type: "number",
                            description: "Maximum number of log lines to return.",
                        },
                    },
                    additionalProperties: false,
                },
            },
            {
                name: "runTestsFromFile",
                description: "Run Playwright tests based on a list of test IDs inside a text file.",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                            description: "Path to the text file containing test IDs. Defaults to Tests.txt.",
                        },
                        headed: {
                            type: "boolean",
                            description: "Run tests in headed mode to visually see the browser.",
                        },
                        testIds: {
                            type: "array",
                            items: { type: "string" },
                            description: "Optional list of test IDs to dynamically write to the file before running.",
                        },
                    },
                    additionalProperties: false,
                },
            },
            {
                name: "getLatestScreenshot",
                description: "Retrieves the most recent screenshot of a failed test from storage/screenshots as an image.",
                inputSchema: {
                    type: "object",
                    properties: {},
                    additionalProperties: false,
                },
            },
            {
                name: "listTestSpecs",
                description: "List all available Playwright test specs in the tests directory.",
                inputSchema: {
                    type: "object",
                    properties: {},
                    additionalProperties: false,
                },
            },
        ],
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        switch (name) {
            case "runTest": {
                const testName = typeof args?.testName === "string" ? args.testName : "";
                const headed = typeof args?.headed === "boolean" ? args.headed : false;
                const lastFailed = typeof args?.lastFailed === "boolean" ? args.lastFailed : false;
                const result = await runTest(testName, headed, lastFailed);
                return { content: [{ type: "text", text: toToolText(result) }] };
            }
            case "getLogs": {
                const rawLimit = args?.limit;
                const limit = typeof rawLimit === "number" ? rawLimit : 100;
                const result = await getLogs(limit);
                return { content: [{ type: "text", text: toToolText(result) }] };
            }
            case "runTestsFromFile": {
                const filePath = typeof args?.filePath === "string" ? args.filePath : "Tests.txt";
                const headed = typeof args?.headed === "boolean" ? args.headed : false;
                const testIds = Array.isArray(args?.testIds) ? args.testIds : undefined;
                const result = await runTestsFromFile(filePath, headed, testIds);
                return { content: [{ type: "text", text: toToolText(result) }] };
            }
            case "getLatestScreenshot": {
                const result = await getLatestScreenshot();
                if (result.ok && result.data) {
                    return {
                        content: [
                            { type: "text", text: `Screenshot file: ${result.name}` },
                            { type: "image", data: result.data, mimeType: "image/png" }
                        ]
                    };
                }
                return {
                    content: [{ type: "text", text: result.error || "No screenshots found." }],
                    isError: true
                };
            }
            case "listTestSpecs": {
                const specs = await listTestSpecs();
                return { content: [{ type: "text", text: toToolText(specs.join("\n")) }] };
            }
            default:
                return {
                    content: [{ type: "text", text: `Unknown tool: ${name}` }],
                    isError: true,
                };
        }
    });
    sessionManager.setSession(`session-${Date.now()}`);
    await writeLog(`MCP server starting. Session=${sessionManager.getSession()}`);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    await writeLog("MCP server connected over stdio");
}
startServer().catch(async (error) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    await writeLog(`MCP server failed: ${message}`);
    process.stderr.write(`${message}\n`);
    process.exit(1);
});
