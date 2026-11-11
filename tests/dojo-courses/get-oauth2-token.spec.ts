import { buildTokenRequestData } from "../app/test-data/user-data";
import { tokenResponseSchema } from "../app/json-schemas/user";
import { expect, test } from "../fixtures";

test.describe("get a token", { tag: ["@regression", "@smoke"] }, () => {
  test("API-009: registered user should receive token", async ({
    userController,
    registeredUser,
    accessToken,
  }) => {
    const response = await test.step("request token", () =>
      userController.getToken(buildTokenRequestData(registeredUser)));

    const json = await response.json();

    await test.step("response body matches the token response schema", () => {
      const result = tokenResponseSchema.safeParse(json);
      expect(result.error?.issues ?? []).toEqual([]);
    });
  });
});
