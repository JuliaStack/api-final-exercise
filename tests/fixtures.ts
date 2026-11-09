import { test as base, expect, APIRequestContext } from "@playwright/test";

type Fixtures = {
  // Request context that throws on any non-2xx/3xx response.
  // Use it for Arrange steps and happy paths; use the default `request`
  // fixture for the request under test in negative scenarios.
  // baseURL and extraHTTPHeaders come from the current project's `use` config.
  api: APIRequestContext;
};

export const test = base.extend<Fixtures>({
  api: async ({ playwright, baseURL, extraHTTPHeaders }, use) => {
    const api = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders,
      failOnStatusCode: true,
    });
    await use(api);
    await api.dispose();
  },
});

export { expect };
