import type { Post } from "../../app/json-schemas/post";
import { unauthorizedDeletePostCallers } from "../../app/test-data/invalid-post-data";
import {
  buildPostData,
  nonExistingPostId,
} from "../../app/test-data/post-data";
import type { CreatedPost } from "../../app/types/post";
import { expect, test } from "../../fixtures";

test.describe("delete post", () => {
  test(
    "API-110: admin deleting a published post - should return 200 and remove it from the public list",
    { tag: ["@regression", "@smoke"] },
    async ({ apiClient, adminToken }) => {
      const createResponse =
        await test.step("precondition: admin creates a published post", () =>
          apiClient.posts.createPost(
            adminToken,
            buildPostData({ isPublished: true }),
          ));
      const post: CreatedPost = await createResponse.json();

      const response = await test.step("admin deletes the post", () =>
        apiClient.posts.deletePost(post.id, adminToken));

      const json = await response.json();

      await test.step("response confirms the deletion", () => {
        expect(json).toEqual({ success: true });
      });

      const listResponse =
        await test.step("anonymous user requests the post list", () =>
          apiClient.posts.getPosts());

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
    caller,
    status,
    error,
  } of unauthorizedDeletePostCallers) {
    test(
      `${id}: ${title} deleting a post - should return ${status}`,
      { tag: "@regression" },
      async ({ apiClient, rawApiClient, createPost, tokenFor }) => {
        const token = await tokenFor(caller);

        const post = await createPost({ isPublished: true });

        const response = await test.step(`${title} deletes the post`, () =>
          rawApiClient.posts.deletePost(post.id, token));

        await test.step(`status code matches ${status}`, () => {
          expect(response.status()).toBe(status);
        });

        const json = await response.json();
        await test.step("response contains an error", () => {
          expect(json.error).toContain(error);
        });

        const listResponse =
          await test.step("anonymous user requests the post list", () =>
            apiClient.posts.getPosts());

        const list: Post[] = await listResponse.json();

        await test.step("post is kept in the public list", () => {
          expect(list.map(({ id }) => id)).toContain(post.id);
        });
      },
    );
  }

  test.fail(
    "API-114: admin deleting a non-existing post - should return 404",
    {
      tag: "@regression",
      annotation: {
        type: "known bug",
        description:
          "the route calls prisma.post.delete without a lookup and returns 500 for a missing id",
      },
    },
    async ({ rawApiClient, adminToken }) => {
      const response =
        await test.step("admin deletes a non-existing post", () =>
          rawApiClient.posts.deletePost(nonExistingPostId, adminToken));

      await test.step("status code matches 404", () => {
        expect(response.status()).toBe(404);
      });

      const json = await response.json();
      await test.step("response contains an error", () => {
        expect(json.error).toContain("Post not found");
      });
    },
  );
});
