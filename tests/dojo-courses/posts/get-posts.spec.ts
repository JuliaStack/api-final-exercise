import { postListSchema, type PostList } from "../../app/json-schemas/post";
import { expiredToken } from "../../app/test-data/invalid-token-data";
import { expect, test } from "../../fixtures";

test.describe("get posts list", () => {
  test(
    "API-098: anonymous user gets the post feed - should return only published posts with their tags",
    { tag: ["@regression", "@smoke"] },
    async ({ postController, createPost, createdTag }) => {
      const post = await createPost({
        isPublished: true,
        tagIds: [createdTag.id],
      });

      const response =
        await test.step("anonymous user requests the post list", () =>
          postController.getPosts());

      const json: PostList = await response.json();

      await test.step("response body matches the post list schema", () => {
        const result = postListSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("response contains no draft posts", () => {
        for (const item of json) {
          expect(item.isPublished).toBe(true);
        }
      });

      await test.step("created post is in the list", () => {
        expect(json.map(({ id }) => id)).toContain(post.id);
      });

      await test.step("created post has the tag it was created with", () => {
        const item = json.find(({ id }) => id === post.id);
        expect(item?.tags).toContainEqual(createdTag);
      });
    },
  );

  test(
    "API-099: post feed - should be sorted by publish date descending",
    { tag: "@regression" },
    async ({ postController, createPost }) => {
      const older = await createPost({ isPublished: true });
      const newer = await createPost({ isPublished: true });

      const response =
        await test.step("anonymous user requests the post list", () =>
          postController.getPosts());

      const json: PostList = await response.json();

      await test.step("newer post comes before the older one", () => {
        const ids = json.map(({ id }) => id);
        expect(ids).toContain(older.id);
        expect(ids).toContain(newer.id);
        expect(ids.indexOf(newer.id)).toBeLessThan(ids.indexOf(older.id));
      });

      await test.step("newer post has a later publish date", () => {
        const publishedAt = (id: string) =>
          Date.parse(json.find((item) => item.id === id)?.publishedAt ?? "");
        expect(publishedAt(newer.id)).toBeGreaterThan(publishedAt(older.id));
      });
    },
  );

  test(
    "API-100: user with an expired token - should still get the post feed",
    { tag: "@regression" },
    async ({ postController, createPost }) => {
      const post = await createPost({ isPublished: true });

      const response =
        await test.step("user with an expired token requests the post list", () =>
          postController.getPosts(expiredToken));

      const json: PostList = await response.json();

      await test.step("created post is in the list", () => {
        expect(json.map(({ id }) => id)).toContain(post.id);
      });
    },
  );
});
