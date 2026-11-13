import { test, expect } from "../fixtures";
import { buildUserData } from "../app/test-data/user-data";
import { registeredUserSchema } from "../app/json-schemas/user";
import { invalidRegistrationData } from "../app/test-data/invalid-registration-data";

test.describe("register a new user", { tag: ["@regression", "@smoke"] }, () => {
  test("API-001: register user - should return registered user", async ({
    userController,
  }) => {
    const payload = buildUserData();

    const response = await test.step("successful user registration", () =>
      userController.registerUser(payload));

    await test.step("status code matches 201", () => {
      expect(response.status()).toBe(201);
    });

    const json = await response.json();

    await test.step("response body matches the registered user schema", () => {
      const result = registeredUserSchema.safeParse(json);
      expect(result.error?.issues ?? []).toEqual([]);
    });

    await test.step("user email matches the request", () => {
      expect(json.email).toBe(payload.email);
    });

    await test.step("user name matches the request", () => {
      expect(json.name).toBe(payload.name);
    });
  });
});

test.describe(
  "register a new user - negative scenarios",
  { tag: ["@regression"] },
  () => {
    for (const { id, title, payload } of invalidRegistrationData) {
      test(`${id}: ${title} - should return 400`, async ({
        rawUserController,
      }) => {
        const response =
          await test.step("user registration with invalid data", () =>
            rawUserController.registerUser(payload));

        await test.step("status code matches 400", () => {
          expect(response.status()).toBe(400);
        });

        const json = await response.json();
        await test.step("response contains an error message", async () => {
          expect(json.error).toBeTruthy();
        });
      });
    }

    test("API-008: existing user - should return 409", async ({
      userController,
      rawUserController,
    }) => {
      const payload = buildUserData();

      await test.step("successful user registration", () =>
        userController.registerUser(payload));

      const response = await test.step("existing user registration", () =>
        rawUserController.registerUser(payload));

      await test.step("status code matches 409", () => {
        expect(response.status()).toBe(409);
      });

      const json = await response.json();
      await test.step("response contains an error message", async () => {
        expect(json.error).toBeTruthy();
      });
    });
  },
);
