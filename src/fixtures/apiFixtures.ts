import { test as base } from "@playwright/test";
import { ApiClient } from "../api/client/ApiClient.js";

type ApiFixtures = {
  apiClient: ApiClient;
};

export const apiTest = base.extend<ApiFixtures>({
  apiClient: async ({ request }, use) => {
    await use(new ApiClient(request));
  },
});

export { expect } from "@playwright/test";

