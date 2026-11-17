import { test as base, expect, APIRequestContext } from "@playwright/test";
import { UserController } from "./app/controllers/user-controller";
import type { CreatedUser } from "./app/types/user";
import {
  adminCredentials,
  buildUserData,
  buildTokenRequestData,
} from "./app/test-data/user-data";

type Fixtures = {
  // Request context that throws on any non-2xx/3xx response.
  // Use it for Arrange steps and happy paths; use the default `request`
  // fixture for the request under test in negative scenarios.
  // baseURL and extraHTTPHeaders come from the current project's `use` config.
  api: APIRequestContext;
  userController: UserController;
  rawUserController: UserController;
  registeredUser: CreatedUser;
  userToken: string;
  adminToken: string;
};

export const test = base.extend<Fixtures>({
  api: async ({ playwright, baseURL }, use) => {
    const api = await playwright.request.newContext({
      baseURL,
      failOnStatusCode: true,
    });
    await use(api);
    await api.dispose();
  },

  userController: async ({ api }, use) => {
    await use(new UserController(api));
  },

  rawUserController: async ({ request }, use) => {
    await use(new UserController(request));
  },

  registeredUser: async ({ userController }, use) => {
    const user = buildUserData();
    const response = await base.step("precondition: register a new user", () =>
      userController.registerUser(user),
    );
    const { id } = await response.json();

    await use({ ...user, id });
  },

  userToken: async ({ userController, registeredUser }, use) => {
    const response = await base.step(
      "precondition: get user access token",
      () => userController.getToken(buildTokenRequestData(registeredUser)),
    );
    const { access_token: userToken } = await response.json();
    await use(userToken);
  },

  adminToken: async ({ userController }, use) => {
    const response = await base.step(
      "precondition: get admin access token",
      () => userController.getToken(buildTokenRequestData(adminCredentials)),
    );
    const { access_token: adminToken } = await response.json();
    await use(adminToken);
  },
});

export { expect };
