import { faker } from "@faker-js/faker";
import { postSchema, type Post } from "../../app/json-schemas/post";
import { unauthorizedUpdatePostCallers } from "../../app/test-data/invalid-post-data";
import {
  buildPostData,
  nonExistingPostId,
} from "../../app/test-data/post-data";
import { expect, test } from "../../fixtures";

test.describe("update post", () => {
  test(
    "API-101: admin updating all fields of a published post - should return 200 and the updated post",
    { tag: ["@regression", "@smoke"] },
    async ({ postController, createPost, createdTag, adminToken }) => {
      const post = await createPost({ isPublished: true });
      const data = buildPostData({
        tagIds: [createdTag.id],
        isPublished: true,
      });
      const expectedFields = {
        id: post.id,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        imageUrl: data.imageUrl,
        slug: data.title.toLowerCase().replace(/\s+/g, "-"),
        isPublished: true,
        tags: [createdTag],
      };

      const response = await test.step("admin updates the post", () =>
        postController.updatePost(post.id, adminToken, data));

      const json: Post = await response.json();

      await test.step("response body matches the post schema", () => {
        const result = postSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("post has the sent values", () => {
        expect(json).toMatchObject(expectedFields);
      });

      const listResponse =
        await test.step("anonymous user requests the post list", () =>
          postController.getPosts());

      const list: Post[] = await listResponse.json();

      await test.step("changes are persisted in the public list", () => {
        expect(list).toContainEqual(json);
      });
    },
  );

  test(
    "API-102: admin updating only the excerpt - should leave the other fields unchanged",
    { tag: "@regression" },
    async ({ postController, createPost, createdTag, adminToken }) => {
      const post = await createPost({
        isPublished: true,
        tagIds: [createdTag.id],
      });
      const excerpt = faker.lorem.sentence();

      const beforeResponse =
        await test.step("precondition: anonymous user requests the post list", () =>
          postController.getPosts());

      const beforeList: Post[] = await beforeResponse.json();
      const before = beforeList.find(({ id }) => id === post.id);

      await test.step("admin updates only the excerpt", () =>
        postController.updatePost(post.id, adminToken, { excerpt }));

      const afterResponse =
        await test.step("anonymous user requests the post list", () =>
          postController.getPosts());

      const afterList: Post[] = await afterResponse.json();
      const after = afterList.find(({ id }) => id === post.id);

      await test.step("only the excerpt and updatedAt have changed", () => {
        expect(after).toEqual({
          ...before,
          excerpt,
          updatedAt: expect.any(String),
        });
      });
    },
  );

  test(
    "API-103: admin publishing a draft - should put the post into the public list",
    { tag: "@regression" },
    async ({ postController, createPost, adminToken }) => {
      const post = await createPost();

      const response = await test.step("admin publishes the draft", () =>
        postController.updatePost(post.id, adminToken, { isPublished: true }));

      const json: Post = await response.json();

      await test.step("post is published", () => {
        expect(json.isPublished).toBe(true);
      });

      const listResponse =
        await test.step("anonymous user requests the post list", () =>
          postController.getPosts());

      const list: Post[] = await listResponse.json();

      await test.step("post is in the public list", () => {
        expect(list.map(({ id }) => id)).toContain(post.id);
      });
    },
  );

  test(
    "API-104: admin unpublishing a post - should remove it from the public list",
    { tag: "@regression" },
    async ({ postController, createPost, adminToken }) => {
      const post = await createPost({ isPublished: true });

      const response = await test.step("admin unpublishes the post", () =>
        postController.updatePost(post.id, adminToken, { isPublished: false }));

      const json: Post = await response.json();

      await test.step("post is not published", () => {
        expect(json.isPublished).toBe(false);
      });

      const listResponse =
        await test.step("anonymous user requests the post list", () =>
          postController.getPosts());

      const list: Post[] = await listResponse.json();

      await test.step("post is not in the public list", () => {
        expect(list.map(({ id }) => id)).not.toContain(post.id);
      });
    },
  );

  test(
    "API-105: admin sending tagIds - should replace the tags of the post",
    { tag: "@regression" },
    async ({ postController, createPost, createTag, adminToken }) => {
      const firstTag = await createTag();
      const secondTag = await createTag();
      const post = await createPost({
        isPublished: true,
        tagIds: [firstTag.id],
      });

      const response =
        await test.step("admin moves the post to the second tag", () =>
          postController.updatePost(post.id, adminToken, {
            tagIds: [secondTag.id],
          }));

      const json: Post = await response.json();

      await test.step("response has only the second tag", () => {
        expect(json.tags).toEqual([secondTag]);
      });

      const listResponse =
        await test.step("anonymous user requests the post list", () =>
          postController.getPosts());

      const list: Post[] = await listResponse.json();

      await test.step("post in the public list has only the second tag", () => {
        expect(list.find(({ id }) => id === post.id)?.tags).toEqual([
          secondTag,
        ]);
      });
    },
  );

  test(
    "API-106: admin renaming a post to the title of another post - should give it a unique slug",
    { tag: "@regression" },
    async ({ postController, createPost, adminToken }) => {
      const existingPost = await createPost({ isPublished: true });
      const renamedPost = await createPost({ isPublished: true });

      const response =
        await test.step("admin renames the second post to the title of the first post", () =>
          postController.updatePost(renamedPost.id, adminToken, {
            title: existingPost.title,
          }));

      const json: Post = await response.json();

      await test.step("title is updated and slug is made unique", () => {
        expect(json.title).toBe(existingPost.title);
        expect(json.slug).toMatch(new RegExp(`^${existingPost.slug}-\\d+$`));
      });

      const listResponse =
        await test.step("anonymous user requests the post list", () =>
          postController.getPosts());

      const list: Post[] = await listResponse.json();

      await test.step("title and slug of the first post are not changed", () => {
        expect(list.find(({ id }) => id === existingPost.id)).toMatchObject({
          title: existingPost.title,
          slug: existingPost.slug,
        });
      });
    },
  );
});

test.describe("update post - negative scenarios", () => {
  for (const {
    id,
    title,
    getToken,
    status,
    error,
  } of unauthorizedUpdatePostCallers) {
    test(
      `${id}: ${title} updating a post - should return ${status}`,
      { tag: "@regression" },
      async ({ postController, rawPostController, createPost, userToken }) => {
        const post = await createPost({ isPublished: true });
        const data = buildPostData();

        const response = await test.step(`${title} updates the post`, () =>
          rawPostController.updatePost(post.id, getToken(userToken), data));

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

        await test.step("post is not changed", () => {
          expect(list.find(({ id }) => id === post.id)).toMatchObject({
            title: post.title,
            slug: post.slug,
          });
        });
      },
    );
  }

  test.fail(
    "API-115: admin updating a non-existing post - should return 404",
    {
      tag: "@regression",
      annotation: {
        type: "known bug",
        description:
          "the route calls prisma.post.update without a lookup and returns 500 for a missing id",
      },
    },
    async ({ rawPostController, adminToken }) => {
      const data = buildPostData();

      const response =
        await test.step("admin updates a non-existing post", () =>
          rawPostController.updatePost(nonExistingPostId, adminToken, data));

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
