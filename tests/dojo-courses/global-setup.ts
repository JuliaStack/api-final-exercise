import { request, expect, FullConfig } from "@playwright/test";

export default async function globalSetup(config: FullConfig) {
  const apiRequest = await request.newContext();
  try {
    const response = await apiRequest.get(
      `${config.projects[0].use.baseURL}api/courses`,
      {
        params: { page: 1, limit: 5 },
        failOnStatusCode: true,
      },
    );
    expect(response.ok()).toBeTruthy();
    console.log(`Global setup OK: ${response.status()} ${response.url()}`);
  } finally {
    await apiRequest.dispose();
  }
}
