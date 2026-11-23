import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { request, FullConfig } from "@playwright/test";
import { UserController } from "../app/controllers/user-controller";
import {
  adminCredentials,
  buildTokenRequestData,
} from "../app/test-data/user-data";
import { adminTokenFile } from "../app/utils";

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL;
  const apiRequest = await request.newContext({
    baseURL,
    failOnStatusCode: true,
  });
  try {
    const response = await apiRequest.get("api/courses", {
      params: { page: 1, limit: 5 },
    });
    console.log(`Global setup OK: ${response.status()} ${response.url()}`);

    // The admin token is shared by all tests: get it once and keep it in a file.
    const tokenResponse = await new UserController(apiRequest).getToken(
      buildTokenRequestData(adminCredentials),
    );
    const { access_token } = await tokenResponse.json();
    if (typeof access_token !== "string" || !access_token) {
      throw new Error(
        "Global setup: no access_token in the admin token response",
      );
    }
    mkdirSync(dirname(adminTokenFile), { recursive: true });
    writeFileSync(adminTokenFile, JSON.stringify({ access_token }));
    console.log("Admin token saved");
  } finally {
    await apiRequest.dispose();
  }
}
