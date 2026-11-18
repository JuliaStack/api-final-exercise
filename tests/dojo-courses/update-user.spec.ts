import { expiredToken } from "../app/test-data/invalid-token-data";
import { invalidUpdateUserData } from "../app/test-data/invalid-update-user-data";
import {
  adminCredentials,
  buildTokenRequestData,
  buildUserData,
} from "../app/test-data/user-data";
import { updateUserData } from "../app/test-data/update-user-data";
import { expect, test } from "../fixtures";

const nonExistingUserId = "non-existing-user-id";

test.describe("update user info", () => {
  for (const { id, title, buildPayload } of updateUserData) {
    test(
      `${id}: ${title} should be updated`,
      { tag: "@regression" },
      async ({ userController, registeredUser, adminToken, userToken }) => {
        const userInfoResponse =
          await test.step("precondition: get user before update", () =>
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
      },
    );
  }

  test(
    "API-032: user updated with isActive false should not be able to log in",
    { tag: "@regression" },
    async ({
      userController,
      rawUserController,
      registeredUser,
      adminToken,
    }) => {
      const updateResponse =
        await test.step("admin deactivates the user (isActive: false)", () =>
          userController.updateUser(registeredUser.id, adminToken, {
            isActive: false,
          }));

      const json = await updateResponse.json();

      await test.step("response shows the user is deactivated", () => {
        expect(json.isActive).toBe(false);
      });

      const tokenResponse =
        await test.step("deactivated user requests a token", () =>
          rawUserController.getToken(buildTokenRequestData(registeredUser)));

      await test.step("status code matches 401", () => {
        expect(tokenResponse.status()).toBe(401);
      });

      const tokenJson = await tokenResponse.json();
      await test.step("response contains an error description", () => {
        expect(tokenJson.error_description).toContain("Account is deactivated");
      });
    },
  );
});

test.describe("update user info - negative scenarios", () => {
  test(
    "API-025: regular user updating a user - should return 403",
    { tag: "@regression" },
    async ({
      userController,
      rawUserController,
      registeredUser,
      userToken,
    }) => {
      const userInfoResponse =
        await test.step("precondition: get user before update", () =>
          userController.getUserInfo(userToken));
      const userBeforeUpdate = await userInfoResponse.json();

      const payload = { name: buildUserData().name };

      const response = await test.step("regular user updates own account", () =>
        rawUserController.updateUser(registeredUser.id, userToken, payload));

      await test.step("status code matches 403", () => {
        expect(response.status()).toBe(403);
      });

      const json = await response.json();
      await test.step("response contains an error", () => {
        expect(json.error).toContain("Forbidden");
      });

      const userAfterResponse =
        await test.step("get user after the request", () =>
          userController.getUserInfo(userToken));

      await test.step("user is not changed", async () => {
        expect(await userAfterResponse.json()).toEqual(userBeforeUpdate);
      });
    },
  );

  test(
    "API-026: expired admin token - should return 401",
    { tag: "@regression" },
    async ({ rawUserController, registeredUser }) => {
      const payload = { name: buildUserData().name };

      const response = await test.step("update user with expired token", () =>
        rawUserController.updateUser(registeredUser.id, expiredToken, payload));

      await test.step("status code matches 401", () => {
        expect(response.status()).toBe(401);
      });

      const json = await response.json();
      await test.step("response contains an error", () => {
        expect(json.error).toContain("Unauthorized");
      });
    },
  );

  test(
    "API-027: email of another account - should return 400",
    { tag: "@regression" },
    async ({
      userController,
      rawUserController,
      registeredUser,
      adminToken,
      userToken,
    }) => {
      const payload = { email: adminCredentials.email };

      const response =
        await test.step("admin sets email that belongs to another account", () =>
          rawUserController.updateUser(registeredUser.id, adminToken, payload));

      await test.step("status code matches 400", () => {
        expect(response.status()).toBe(400);
      });

      const json = await response.json();
      await test.step("response contains an error", () => {
        expect(json.error).toContain("Failed to update user");
      });

      const userAfterResponse =
        await test.step("get user after the request", () =>
          userController.getUserInfo(userToken));

      await test.step("user email is not changed", async () => {
        expect((await userAfterResponse.json()).email).toBe(
          registeredUser.email,
        );
      });
    },
  );

  test(
    "API-028: non-existing user - should return 400",
    { tag: "@regression" },
    async ({ rawUserController, adminToken }) => {
      const payload = { name: buildUserData().name };

      const response = await test.step("admin updates non-existing user", () =>
        rawUserController.updateUser(nonExistingUserId, adminToken, payload));

      await test.step("status code matches 400", () => {
        expect(response.status()).toBe(400);
      });

      const json = await response.json();
      await test.step("response contains an error", () => {
        expect(json.error).toContain("Failed to update user");
      });
    },
  );

  for (const {
    id,
    title,
    buildPayload,
    status,
    error,
  } of invalidUpdateUserData) {
    test(
      `${id}: ${title} - should return ${status}`,
      { tag: "@regression" },
      async ({ rawUserController, registeredUser, adminToken }) => {
        const payload = buildPayload();

        const response =
          await test.step(`admin updates user with ${title}`, () =>
            rawUserController.updateUser(
              registeredUser.id,
              adminToken,
              payload,
            ));

        await test.step(`status code matches ${status}`, () => {
          expect(response.status()).toBe(status);
        });

        const json = await response.json();
        await test.step("response contains an error", () => {
          expect(json.error).toContain(error);
        });
      },
    );
  }

  test(
    "API-031: role in the request body - should return 200 and keep role USER",
    { tag: "@regression" },
    async ({ userController, registeredUser, adminToken, userToken }) => {
      const payload = { name: buildUserData().name, role: "ADMIN" };

      const response =
        await test.step("admin updates user with role ADMIN", () =>
          userController.updateUser(registeredUser.id, adminToken, payload));

      const json = await response.json();
      await test.step("response role is still USER", () => {
        expect(json.role).toBe("USER");
      });

      const userAfterResponse =
        await test.step("get user after the request", () =>
          userController.getUserInfo(userToken));

      await test.step("user role is still USER", async () => {
        expect((await userAfterResponse.json()).role).toBe("USER");
      });
    },
  );
});
