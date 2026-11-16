import { buildUserData } from "../app/test-data/user-data";
import { expect, test } from "../fixtures";

test.describe("update user info", { tag: ["@regression", "@smoke"] }, () => {
  test("API-022: admin should update user's name", async ({
    userController,
    registeredUser,
    adminToken,
  }) => {
    const { name: newName } = buildUserData();

    const response = await test.step("admin updates user name", () =>
      userController.updateUser(registeredUser.id, adminToken, {
        name: newName,
      }));

    const json = await response.json();

    await test.step("response contains the new name", () => {
      expect(json.name).toBe(newName);
    });

    await test.step("user id and email stay unchanged", () => {
      expect.soft(json.id).toBe(registeredUser.id);
      expect.soft(json.email).toBe(registeredUser.email);
    });
  });
});
