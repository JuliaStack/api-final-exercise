import { invalidTokenData } from "../../app/test-data/invalid-token-data";
import { userInfoSchema } from "../../app/json-schemas/user";
import { expect, test } from "../../fixtures";

test.describe("get registered user info", () => {
  test(
    "API-010: registered user should receive info",
    { tag: ["@regression", "@smoke"] },
    async ({ userController, registeredUser, userToken }) => {
      const response = await test.step("request user info", () =>
        userController.getUserInfo(userToken));

      const json = await response.json();

      await test.step("response body matches the user info schema", () => {
        const result = userInfoSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("user email matches registered user", () => {
        expect(json.email).toBe(registeredUser.email);
      });

      await test.step("user name matches registered user", () => {
        expect(json.name).toBe(registeredUser.name);
      });
    },
  );
});

test.describe("get user info - negative scenarios", () => {
  for (const { id, title, token, status } of invalidTokenData) {
    test(
      `${id}: ${title} - should return ${status}`,
      { tag: "@regression" },
      async ({ rawUserController }) => {
        const response =
          await test.step(`request user info with ${title}`, () =>
            rawUserController.getUserInfo(token));

        await test.step(`status code matches ${status}`, () => {
          expect(response.status()).toBe(status);
        });

        const json = await response.json();
        await test.step("response contains an error", () => {
          expect(json.error).toContain("Unauthorized");
        });
      },
    );
  }
});
