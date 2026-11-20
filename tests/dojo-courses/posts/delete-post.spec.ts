import type { Post } from "../../app/json-schemas/post";
import { nonAdminDeletePostCallers } from "../../app/test-data/invalid-post-data";
import { buildPostData } from "../../app/test-data/post-data";
import type { CreatedPost } from "../../app/types/post";
import { expect, test } from "../../fixtures";

test.describe("delete post", () => {
  test(
    "API-110: admin deleting a published post - should return 200 and remove it from the public list",
    { tag: ["@regression", "@smoke"] },
    async ({ postController, adminToken }) => {
      const createResponse =
        await test.step("precondition: admin creates a published post", () =>
          postController.createPost(
            adminToken,
            buildPostData({ isPublished: true }),
          ));
      const post: CreatedPost = await createResponse.json();

      const response = await test.step("admin deletes the post", () =>
        postController.deletePost(post.id, adminToken));

      const json = await response.json();

      await test.step("response confirms the deletion", () => {
        expect(json).toEqual({ success: true });
      });

      const listResponse =
        await test.step("anonymous user requests the post list", () =>
          postController.getPosts());

      const list: Post[] = await listResponse.json();

      await test.step("post is removed from the public list", () => {
        expect(list.map(({ id }) => id)).not.toContain(post.id);
      });
    },
  );
});

test.describe("delete post - negative scenarios", () => {
  for (const {
    id,
    title,
    getToken,
    status,
    error,
  } of nonAdminDeletePostCallers) {
    test(
      `${id}: ${title} deleting a post - should return ${status}`,
      { tag: "@regression" },
      async ({ postController, rawPostController, createPost, userToken }) => {
        const post = await createPost({ isPublished: true });

        const response = await test.step(`${title} deletes the post`, () =>
          rawPostController.deletePost(post.id, getToken(userToken)));

        await test.step(`status code matches ${status}`, () => {
          expect(response.status()).toBe(status);
        });

        const json = await response.json();
        await test.step("response contains an error", () => {
          expect(json.error).toContain(error);
        });

        const listResponse =
          await test.step("anonymous user requests the post list", () =>
            postController.getPosts());

        const list: Post[] = await listResponse.json();

        await test.step("post is kept in the public list", () => {
          expect(list.map(({ id }) => id)).toContain(post.id);
        });
      },
    );
  }
});
