# Hybrid Playwright + MCP Framework

This project uses a layered structure that maps closely to the architecture in your screenshot, with a few extra folders for MCP and service code.

## Layers

1. `tests/`: UI and API specs.
2. `src/pages/`: page objects for UI automation.
3. `src/fixtures/`: Playwright fixtures for UI and API tests.
4. `src/api/`: API client and endpoint abstractions.
5. `src/core/`: shared base classes and framework primitives.
6. `src/utils/` and `src/test-data/`: helpers and reusable data.
7. `config/`: environment and Playwright configuration.
8. `storage/`: screenshots and logs created during test runs.
9. `mcp-server/`: MCP tools that run tests and return artifacts.

## MCP Flow

1. A client connects to `mcp-server/server.ts`.
2. The server exposes tools such as `runTest`, `runTestsFromFile`, `getLogs`, `getLatestScreenshot`, and `listTestSpecs`.
3. Tools call the local Playwright runner and return text or image results.
4. Logs and screenshots are stored under `storage/` for later inspection.

## Recommended Conventions

- Keep locators close to the page object at first; split them into a separate `src/locators/` folder only when a page becomes large enough to benefit.
- Put reusable API request builders in `src/api/endpoints`.
- Put shared API wrappers in `src/api/client`.
- Keep UI page objects in `src/pages`.
- Use `src/fixtures/apiFixtures.ts` for API tests and `src/fixtures/testFixtures.ts` for UI tests.
- Keep environment defaults in `config/env.config.ts`.
