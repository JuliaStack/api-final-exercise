import { invalidOauthData } from "../../app/test-data/invalid-oauth-data";
import {
  buildTokenRequestData,
  buildUserData,
} from "../../app/test-data/user-data";
import { tokenResponseSchema } from "../../app/json-schemas/user";
import { expect, test } from "../../fixtures";

test.describe("get a token", () => {
  test(
    "API-009: registered user should receive token",
    { tag: ["@regression", "@smoke"] },
    async ({ userController, registeredUser }) => {
      const response = await test.step("request token", () =>
        userController.getToken(buildTokenRequestData(registeredUser)));

      const json = await response.json();

      await test.step("response body matches the token response schema", () => {
        const result = tokenResponseSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });
    },
  );
});

test.describe("get token - negative scenarios", () => {
  for (const { id, title, overrides, status } of invalidOauthData) {
    test(
      `${id}: ${title} - should return ${status}`,
      { tag: "@regression" },
      async ({ rawUserController, registeredUser }) => {
        const response = await test.step(`request token with ${title}`, () =>
          rawUserController.getToken({
            ...buildTokenRequestData(registeredUser),
            ...overrides,
          }));

        await test.step(`status code matches ${status}`, () => {
          expect(response.status()).toBe(status);
        });

        const json = await response.json();
        await test.step("response contains an error description", () => {
          expect(json.error_description).toBeTruthy();
        });
      },
    );
  }

  test(
    "API-017: non-existing user - should return 401",
    { tag: "@regression" },
    async ({ rawUserController }) => {
      const response =
        await test.step("request token for non-existing user", () =>
          rawUserController.getToken(buildTokenRequestData(buildUserData())));

      await test.step("status code matches 401", () => {
        expect(response.status()).toBe(401);
      });

      const json = await response.json();
      await test.step("response contains an error description", () => {
        expect(json.error_description).toBeTruthy();
      });
    },
  );
});
