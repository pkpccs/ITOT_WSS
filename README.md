# Playwright + MCP Hybrid Framework

This repo is already organized around the same idea as your screenshot:
tests stay in `tests/`, reusable UI/API logic lives in `src/`, and the MCP server wraps the runner so external tools can trigger executions and collect artifacts.

## Recommended Structure

```text
ITOT_WSS/
├── tests/                  # Playwright specs
├── src/
│   ├── pages/              # Page objects
│   ├── fixtures/           # UI/API fixtures
│   ├── api/                # API clients + endpoints
│   ├── core/               # Base page / shared abstractions
│   ├── runner/             # Custom CLI runner
│   ├── services/           # Log, DB, and support services
│   ├── utils/              # Shared helpers
│   └── test-data/          # JSON test data
├── config/                 # Playwright/environment config
├── mcp-server/             # MCP server + tools
├── storage/                # Logs and screenshots
├── testcontexts/           # Test context docs
├── playwright.config.ts
├── package.json
└── README.md
```

## Folder Mapping

- `tests/` = your spec layer, like `login.spec.ts`, `checkout.spec.ts`, `search.spec.ts`.
- `src/pages/` = page objects such as `LoginPage`, `ConsumerPortal`, `RegistrationPage`.
- `src/fixtures/` = shared Playwright fixtures for UI and API tests.
- `src/api/` = API client and endpoint builders.
- `src/core/` = base classes like `BasePage`.
- `config/` = environment and Playwright configuration.
- `storage/` = screenshots and run logs produced during execution.
- `mcp-server/` = the MCP wrapper that can run tests and fetch results.

## What This Gives You

- Cleaner separation between tests, page objects, fixtures, and support code
- A stable place for future locator files if you want to split selectors out later
- A structure that works well for both manual runs and MCP-triggered runs

## Key Commands

```bash
npm install
npm run build
npm run start:mcp
npm run test
npm run test:api
npm run test:login
```

## More Detail

See `docs/framework-architecture.md` for the layer breakdown and execution flow.
