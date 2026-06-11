export async function getHealth() {
    return {
        status: "ok",
        service: "mcp-playwright-framework",
        timestamp: new Date().toISOString(),
    };
}
