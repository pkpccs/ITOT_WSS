import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from "@google/generative-ai";
import process from "node:process";

// Set this in your terminal before running
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Error: Please set the GEMINI_API_KEY environment variable.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function main() {
  const mcpClient = new Client({ name: "gemini-mcp-client", version: "1.0.0" }, { capabilities: {} });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["dist/mcp-server/server.js"],
    cwd: process.cwd(),
    stderr: "inherit",
  });

  console.log("Connecting to local MCP Server...");
  await mcpClient.connect(transport);

  // 1. Fetch Tools from your MCP server
  const toolsResponse = await mcpClient.listTools();
  
  // 2. Map MCP Tools to Gemini Function Declarations
  const geminiTools = toolsResponse.tools.map(tool => {
    const properties: Record<string, any> = {};
    if (tool.inputSchema?.properties) {
      for (const [key, prop] of Object.entries(tool.inputSchema.properties)) {
        const propType = (prop as any).type as string;
        let type = SchemaType.STRING;
        if (propType === 'number') type = SchemaType.NUMBER;
        if (propType === 'boolean') type = SchemaType.BOOLEAN;
        
        properties[key] = {
          type,
          description: (prop as any).description || ""
        };
      }
    }
    return {
      name: tool.name,
      description: tool.description,
        parameters: { 
          type: SchemaType.OBJECT, 
          properties,
          required: (tool.inputSchema as any)?.required || []
        }
    } as FunctionDeclaration;
  });

  const chat = model.startChat({ tools: [{ functionDeclarations: geminiTools }] });
  
  // 3. Prompt Gemini using CLI arguments, or fallback to the default test suite
  const cliPrompt = process.argv.slice(2).join(" ");
  const prompt = cliPrompt || "Please run the test tests/auth/login.spec.ts using the runTest tool. If it fails, use the getLogs tool to read the logs and tell me exactly why it failed.";
  console.log(`\nSending Prompt: "${prompt}"`);
  
  let result = await chat.sendMessage(prompt);
  
  // 4. Handle Gemini Tool Execution loop
  let calls = result.response.functionCalls();
  while (calls && calls.length > 0) {
    console.log(`\nGemini requested ${calls.length} tool call(s)`);
    
    const toolResponses = await Promise.all(calls.map(async (call) => {
      console.log(`- Executing: ${call.name}(${JSON.stringify(call.args)})`);
      try {
        const mcpResult = await mcpClient.callTool({ name: call.name, arguments: call.args as Record<string, unknown> });
        const textContent = (mcpResult.content as any[])?.map(c => c.text).join('\n') || "No output";
        return { functionResponse: { name: call.name, response: { result: textContent } } };
      } catch (error) {
        console.error(`Tool execution failed for ${call.name}:`, error);
        return { functionResponse: { name: call.name, response: { error: String(error) } } };
      }
    }));

    console.log(`Returning tool outputs back to Gemini...`);
    result = await chat.sendMessage(toolResponses);
    calls = result.response.functionCalls();
  }

  console.log(`\n=== Gemini Final Analysis ===\n${result.response.text()}`);
  await transport.close();
}

main().catch(console.error);