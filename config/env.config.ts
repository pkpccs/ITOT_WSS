export const frameworkEnv = {
  baseUrl: process.env.BASE_URL ?? "https://ksebconsumerqc.ugoone.com/",
  loginHomeUrl:
    process.env.TEST_LOGIN_HOME_URL ?? "https://ksebconsumerqc.ugoone.com/GeneralUsers/Home/Index",
  apiBaseUrl: process.env.API_BASE_URL ?? "https://fakestoreapi.com",
  headless: process.env.HEADLESS === "true",
  defaultTimeoutMs: Number(process.env.DEFAULT_TIMEOUT_MS ?? "30000"),
} as const;

