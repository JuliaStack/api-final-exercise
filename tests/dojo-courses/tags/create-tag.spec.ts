import type { CreatedTag } from "../../app/types/tag";
import { tagSchema } from "../../app/json-schemas/tag";
import {
  duplicateTagNameData,
  invalidTagData,
  unauthorizedCreateTagCallers,
} from "../../app/test-data/invalid-tag-data";
import { buildTagData } from "../../app/test-data/tag-data";
import { expect, test } from "../../fixtures";

test.describe("create tag", () => {
  test(
    "API-078: admin creating a tag with a valid name - should return 201 and the created tag",
    { tag: ["@regression", "@smoke"] },
    async ({ tagController, tagIdsToDelete, adminToken }) => {
      const data = buildTagData();

      const response = await test.step("admin creates a tag", () =>
        tagController.createTag(adminToken, data));

      const json: CreatedTag = await response.json();
      tagIdsToDelete.push(json.id);

      await test.step("status code matches 201", () => {
        expect(response.status()).toBe(201);
      });

      await test.step("response body matches the tag schema", () => {
        const result = tagSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("name and slug are built from the sent name", () => {
        expect(json.name).toBe(data.name);
        expect(json.slug).toBe(data.name.toLowerCase().replace(/\s+/g, "-"));
      });

      const listResponse =
        await test.step("anonymous user requests the tag list", () =>
          tagController.getTags());

      const list: CreatedTag[] = await listResponse.json();

      await test.step("tag is persisted", () => {
        expect(list).toContainEqual(json);
      });
    },
  );
});

test.describe("create tag - negative scenarios", () => {
  for (const {
    id,
    title,
    token,
    status,
    error,
  } of unauthorizedCreateTagCallers) {
    test(
      `${id}: ${title} creating a tag - should return ${status}`,
      { tag: "@regression" },
      async ({ tagController, rawTagController }) => {
        const data = buildTagData();

        const response = await test.step(`${title} creates a tag`, () =>
          rawTagController.createTag(token, data));

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

        await test.step("tag is not created", () => {
          expect(list.map(({ name }) => name)).not.toContain(data.name);
        });
      },
    );
  }

  test(
    "API-081: regular user creating a tag - should return 403",
    { tag: "@regression" },
    async ({ tagController, rawTagController, userToken }) => {
      const data = buildTagData();

      const response = await test.step("regular user creates a tag", () =>
        rawTagController.createTag(userToken, data));

      await test.step("status code matches 403", () => {
        expect(response.status()).toBe(403);
      });

      const json = await response.json();
      await test.step("response contains an error", () => {
        expect(json.error).toContain("Forbidden");
      });

      const listResponse =
        await test.step("anonymous user requests the tag list", () =>
          tagController.getTags());

      const list: CreatedTag[] = await listResponse.json();

      await test.step("tag is not created", () => {
        expect(list.map(({ name }) => name)).not.toContain(data.name);
      });
    },
  );

  for (const { id, title, buildName, status, error } of duplicateTagNameData) {
    test(
      `${id}: admin creating a tag with the ${title} - should return ${status}`,
      { tag: "@regression" },
      async ({ tagController, rawTagController, createdTag, adminToken }) => {
        const data = buildTagData({ name: buildName(createdTag) });

        const response =
          await test.step(`admin creates a tag with the ${title}`, () =>
            rawTagController.createTag(adminToken, data));

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

        await test.step("original tag is unchanged and not duplicated", () => {
          expect(list.filter(({ slug }) => slug === createdTag.slug)).toEqual([
            createdTag,
          ]);
        });
      },
    );
  }

  for (const { id, title, buildPayload, status, error } of invalidTagData) {
    test(
      `${id}: ${title} - should return ${status}`,
      { tag: "@regression" },
      async ({ rawTagController, adminToken }) => {
        const payload = buildPayload();

        const response =
          await test.step(`admin creates a tag with ${title}`, () =>
            rawTagController.createTag(adminToken, payload));

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
});
