# AGENTS.md

## Project Overview

MCP + Playwright Framework — a hybrid monorepo for running Playwright tests via an MCP (Model Context Protocol) server. Written in TypeScript, targeting ES2022/NodeNext.

## Build & Run

```bash
npm install          # install dependencies
npm run build        # compile TypeScript → dist/
npm run start:mcp    # start MCP server
npm run test         # run full Playwright suite
```

## Test Commands

| Command | Description |
|---|---|
| `npm run test` | Run full Playwright suite |
| `npm run test:login` | Login smoke suite (headed) |
| `npm run test:consumerportal` | Consumer portal via runner |
| `npm run test:registration` | Registration via runner |
| `npm run test:api` | API tests |
| `npm run testrun` | Clean → build → run via custom testRunner |
| `npm run testrun:file` | Run tests listed in `Tests.txt` (headed) |
| `npm run testrun:testng` | Run tests from `Tests.txt` |
| `npm run testrun:file:allure` | Run with Allure reporting |
| `npm run test:allure` | Login tests with Allure |
| `npm run test:api:allure` | API tests with Allure |
| `npm run allure:generate` | Generate Allure HTML report |
| `npm run allure:open` | Open Allure report |

## Project Structure

```
ITOT_WSS/
├── mcp-server/                # MCP server, tools, runtime context
│   ├── server.ts
│   ├── client/
│   │   ├── geminiMcpClient.ts
│   │   └── runLoginTitleViaMcp.ts
│   ├── context/
│   │   ├── apitestcontext.txt
│   │   ├── logger.ts
│   │   └── sessionManager.ts
│   └── tools/
│       ├── runTest.ts
│       ├── generateCode.ts
│       ├── listTestSpecs.ts
│       ├── getLatestScreenshot.ts
│       ├── runTestsFromFile.ts
│       └── getLogs.ts
├── src/
│   ├── config/env.ts                  # Runtime configuration
│   ├── core/BasePage.ts               # Base POM class
│   ├── fixtures/testFixtures.ts       # Playwright fixtures
│   ├── pages/
│   │   ├── ConsumerPortal.ts
│   │   ├── LoginPage.ts
│   │   └── RegistrationPage.ts
│   ├── runner/testRunner.ts           # CLI runner
│   ├── services/
│   │   ├── api/healthClient.ts
│   │   └── db/testRunStore.ts
│   ├── test-data/
│   │   ├── users.json
│   │   └── product-api.json
│   └── utils/helpers.ts
├── tests/
│   ├── api/product.spec.ts
│   ├── auth/login.spec.ts
│   ├── consumer-portal/
│   │   ├── Bill-Calculator.spec.ts
│   │   ├── bill-status.spec.ts
│   │   └── Quick-Pay.spec.ts
│   └── registration/registration.spec.ts
├── testcontexts/
│   ├── apitestcontext.txt
│   ├── consumerportaltestcontext.txt
│   └── webtestcontext.txt
├── scripts/
│   ├── clean.js
│   ├── run-tests-from-file.ps1
│   ├── run-tests-txt-allure.js
│   └── install-texts-context-menu.ps1
├── ui/dashboard/
│   ├── README.md
│   └── .gitkeep
├── storage/
│   ├── logs/
│   └── screenshots/
├── Tests.txt                    # List of test IDs to run (e.g. CP-TC-05)
├── playwright.config.ts         # Playwright config (Chromium, Firefox, WebKit)
├── tsconfig.json                # TypeScript config (ES2022, NodeNext, strict)
└── package.json
```

## Key Conventions

- **Language**: TypeScript (strict mode, ES2022 target, NodeNext module resolution)
- **Test framework**: Playwright (`@playwright/test`)
- **Architecture**: Monorepo with MCP server tools and a custom test runner
- **POM**: Page Object Model classes in `src/pages/`, extending `BasePage`
- **Test runner**: Custom CLI runner at `src/runner/testRunner.ts`; `Tests.txt` controls which test IDs to execute
- **Lint/Format**: No linter or formatter configured. Run `npm run build` (tsc) before changes to verify compilation
- **Allure**: Reporting via `allure-playwright` with cleanup/generate/open scripts
- **CI**: `forbidOnly` enabled on CI; retries: 2 on CI, 1 locally
- **Test data**: JSON files in `src/test-data/`; test context docs in `testcontexts/`
- **Test IDs**: Tests can be filtered by ID (e.g. `CP-TC-05`) defined in `Tests.txt`