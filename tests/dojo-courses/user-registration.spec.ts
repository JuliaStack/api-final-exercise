import { test, expect } from "../fixtures";
import { buildUserData } from "../app/test-data/userData";
import { registeredUserSchema } from "../app/json-schemas/user";

test.describe("register a new user", { tag: ["@regression", "@smoke"] }, () => {
  test("API-001: register user - should return registered user", async ({
    api,
  }) => {
    const user = buildUserData();

    const response = await test.step("successful user registration", () => {
      return api.post("api/auth/register", { data: user });
    });

    await test.step("status code matches 201", () => {
      expect(response.status()).toBe(201);
    });

    const json = await response.json();

    await test.step("response body matches the registered user schema", () => {
      const result = registeredUserSchema.safeParse(json);
      expect(result.error?.issues ?? []).toEqual([]);
    });

    await test.step("user email matches the request", () => {
      expect(json.email).toBe(user.email);
    });

    await test.step("user name matches the request", () => {
      expect(json.name).toBe(user.name);
    });
  });
});
