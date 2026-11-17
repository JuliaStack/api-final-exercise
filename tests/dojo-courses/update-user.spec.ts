import { updateUserData } from "../app/test-data/update-user-data";
import { expect, test } from "../fixtures";

test.describe("update user info", { tag: ["@regression", "@smoke"] }, () => {
  for (const { id, title, buildPayload } of updateUserData) {
    test(`${id}: ${title} should be updated`, async ({
      userController,
      registeredUser,
      adminToken,
      userToken,
    }) => {
      const userInfoResponse = await test.step("get user before update", () =>
        userController.getUserInfo(userToken));
      const userBeforeUpdate = await userInfoResponse.json();

      const payload = buildPayload();

      const updateResponse =
        await test.step(`admin updates ${title} of the user`, () =>
          userController.updateUser(registeredUser.id, adminToken, payload));

      const json = await updateResponse.json();

      await test.step("response contains updated fields", () => {
        expect(json).toEqual({ ...userBeforeUpdate, ...payload });
      });

      const updatedUser =
        await test.step(`get user with ${title} updated`, () =>
          userController.getUserInfo(userToken));

      const getJson = await updatedUser.json();

      await test.step("changes are persisted", () => {
        expect(getJson).toEqual({ ...userBeforeUpdate, ...payload });
      });
    });
  }
});
