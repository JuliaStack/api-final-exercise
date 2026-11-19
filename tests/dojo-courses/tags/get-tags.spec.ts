import { tagListSchema, type TagList } from "../../app/json-schemas/tag";
import { expiredToken } from "../../app/test-data/invalid-token-data";
import { buildTagData } from "../../app/test-data/tag-data";
import { expect, test } from "../../fixtures";

test.describe("get tags list", () => {
  test(
    "API-075: anonymous user gets the tag list - should include a newly created tag",
    { tag: ["@regression", "@smoke"] },
    async ({ tagController, createdTag }) => {
      const response =
        await test.step("anonymous user requests the tag list", () =>
          tagController.getTags());

      const json: TagList = await response.json();

      await test.step("response body matches the tag list schema", () => {
        const result = tagListSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("created tag is in the list", () => {
        expect(json).toContainEqual(createdTag);
      });
    },
  );

  test(
    "API-076: tag list - should be sorted by name ascending",
    { tag: "@regression" },
    async ({ tagController, createTag }) => {
      const { name: prefix } = buildTagData();
      const tagB = await createTag({ name: `${prefix} b` });
      const tagA = await createTag({ name: `${prefix} a` });

      const response =
        await test.step("anonymous user requests the tag list", () =>
          tagController.getTags());

      const json: TagList = await response.json();

      await test.step("tags are sorted in alphabetical order by name asc", () => {
        const ids = json.map(({ id }) => id);
        expect(ids).toContain(tagA.id);
        expect(ids).toContain(tagB.id);
        expect(ids.indexOf(tagA.id)).toBeLessThan(ids.indexOf(tagB.id));
      });
    },
  );

  test(
    "API-077: user with an expired token - should still get the tag list",
    { tag: "@regression" },
    async ({ tagController, createdTag }) => {
      const response =
        await test.step("user with an expired token requests the tag list", () =>
          tagController.getTags(expiredToken));

      const json: TagList = await response.json();

      await test.step("created tag is in the list", () => {
        expect(json).toContainEqual(createdTag);
      });
    },
  );
});
