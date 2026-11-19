import type { CreatedTag } from "../../app/types/tag";
import { nonAdminDeleteTagCallers } from "../../app/test-data/invalid-tag-data";
import { buildTagData } from "../../app/test-data/tag-data";
import { expect, test } from "../../fixtures";

test.describe("delete tag", () => {
  test(
    "API-086: admin deleting an existing tag - should return 200 and remove the tag",
    { tag: ["@regression", "@smoke"] },
    async ({ tagController, adminToken }) => {
      const createResponse =
        await test.step("precondition: admin creates a tag", () =>
          tagController.createTag(adminToken, buildTagData()));
      const tag: CreatedTag = await createResponse.json();

      const response = await test.step("admin deletes the tag", () =>
        tagController.deleteTag(tag.id, adminToken));

      const json = await response.json();

      await test.step("response confirms the deletion", () => {
        expect(json).toEqual({ success: true });
      });

      const listResponse =
        await test.step("anonymous user requests the tag list", () =>
          tagController.getTags());

      const list: CreatedTag[] = await listResponse.json();

      await test.step("tag is removed from the list", () => {
        expect(list.map(({ id }) => id)).not.toContain(tag.id);
      });
    },
  );
});

test.describe("delete tag - negative scenarios", () => {
  for (const {
    id,
    title,
    getToken,
    status,
    error,
  } of nonAdminDeleteTagCallers) {
    test(
      `${id}: ${title} deleting a tag - should return ${status}`,
      { tag: "@regression" },
      async ({ tagController, rawTagController, createdTag, userToken }) => {
        const response = await test.step(`${title} deletes the tag`, () =>
          rawTagController.deleteTag(createdTag.id, getToken(userToken)));

        await test.step(`status code matches ${status}`, () => {
          expect(response.status()).toBe(status);
        });

        const json = await response.json();
        await test.step("response contains an error", () => {
          expect(json.error).toContain(error);
        });

        const listResponse =
          await test.step("anonymous user requests the tag list", () =>
            tagController.getTags());

        const list: CreatedTag[] = await listResponse.json();

        await test.step("tag is kept and unchanged", () => {
          expect(list).toContainEqual(createdTag);
        });
      },
    );
  }
});
