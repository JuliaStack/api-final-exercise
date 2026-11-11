import { userInfoSchema } from "../app/json-schemas/user";
import { expect, test } from "../fixtures";

test.describe(
  "get registered user info",
  { tag: ["@regression", "@smoke"] },
  () => {
    test("API-010: registered user should receive info", async ({
      userController,
      registeredUser,
      accessToken,
    }) => {
      const response = await test.step("request user info", () =>
        userController.getUserInfo(accessToken));

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
    });
  },
);
