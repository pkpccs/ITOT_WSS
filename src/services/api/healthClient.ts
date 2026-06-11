export type HealthResponse = {
  status: "ok";
  service: string;
  timestamp: string;
};

export async function getHealth(): Promise<HealthResponse> {
  return {
    status: "ok",
    service: "mcp-playwright-framework",
    timestamp: new Date().toISOString(),
  };
}
