import { postSchema, type Post } from "../../app/json-schemas/post";
import {
  invalidPostData,
  unauthorizedCreatePostCallers,
} from "../../app/test-data/invalid-post-data";
import { buildPostData } from "../../app/test-data/post-data";
import { expect, test } from "../../fixtures";

test.describe("create post", () => {
  test(
    "API-090: admin creating a published post with all fields and a tag - should return 201 and the published post",
    { tag: ["@regression", "@smoke"] },
    async ({ apiClient, postIdsToDelete, createdTag, adminToken }) => {
      const data = buildPostData({
        tagIds: [createdTag.id],
        isPublished: true,
      });
      const expectedFields = {
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        imageUrl: data.imageUrl,
        slug: data.title.toLowerCase().replace(/\s+/g, "-"),
        isPublished: true,
        tags: [createdTag],
      };

      const response = await test.step("admin creates a published post", () =>
        apiClient.posts.createPost(adminToken, data));

      const json: Post = await response.json();
      postIdsToDelete.push(json.id);

      await test.step("status code matches 201", () => {
        expect(response.status()).toBe(201);
      });

      await test.step("response body matches the post schema", () => {
        const result = postSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("post fields are built from the sent data", () => {
        expect(json).toMatchObject(expectedFields);
      });

      await test.step("publish date is set", () => {
        expect(json.publishedAt).not.toBeNull();
      });

      const listResponse =
        await test.step("anonymous user requests the post list", () =>
          apiClient.posts.getPosts());

      const list: Post[] = await listResponse.json();

      await test.step("post is in the public list", () => {
        expect(list).toContainEqual(json);
      });
    },
  );

  test(
    "API-091: admin creating a post without isPublished - should return 201 and a draft that is not in the public list",
    { tag: "@regression" },
    async ({ apiClient, postIdsToDelete, adminToken }) => {
      const data = buildPostData({
        excerpt: undefined,
        content: undefined,
        imageUrl: undefined,
      });

      const response = await test.step("admin creates a post", () =>
        apiClient.posts.createPost(adminToken, data));

      const json: Post = await response.json();
      postIdsToDelete.push(json.id);

      await test.step("status code matches 201", () => {
        expect(response.status()).toBe(201);
      });

      await test.step("post is a draft without optional fields", () => {
        expect(json).toMatchObject({
          title: data.title,
          isPublished: false,
          publishedAt: null,
          excerpt: null,
          content: null,
          imageUrl: null,
          tags: [],
        });
      });

      const listResponse =
        await test.step("anonymous user requests the post list", () =>
          apiClient.posts.getPosts());

      const list: Post[] = await listResponse.json();

      await test.step("draft is not in the public list", () => {
        expect(list.map(({ id }) => id)).not.toContain(json.id);
      });
    },
  );

  test(
    "API-092: admin creating a post with an existing title - should return 201 with a different slug",
    { tag: "@regression" },
    async ({ apiClient, createPost, postIdsToDelete, adminToken }) => {
      const firstPost = await createPost({ isPublished: true });
      const data = buildPostData({
        title: firstPost.title,
        isPublished: true,
      });

      const response =
        await test.step("admin creates a post with the same title", () =>
          apiClient.posts.createPost(adminToken, data));

      const json: Post = await response.json();
      postIdsToDelete.push(json.id);

      await test.step("status code matches 201", () => {
        expect(response.status()).toBe(201);
      });

      await test.step("new post has the same title and its own id", () => {
        expect(json.title).toBe(firstPost.title);
        expect(json.id).not.toBe(firstPost.id);
      });

      await test.step("slug of the new post is made unique", () => {
        expect(json.slug).toMatch(new RegExp(`^${firstPost.slug}-\\d+$`));
      });

      const listResponse =
        await test.step("anonymous user requests the post list", () =>
          apiClient.posts.getPosts());

      const list: Post[] = await listResponse.json();

      await test.step("both posts exist and the first one is unchanged", () => {
        expect(list.map(({ id }) => id)).toContain(json.id);
        expect(list.find(({ id }) => id === firstPost.id)).toMatchObject({
          title: firstPost.title,
          slug: firstPost.slug,
        });
      });
    },
  );
});

test.describe("create post - negative scenarios", () => {
  for (const {
    id,
    title,
    caller,
    status,
    error,
  } of unauthorizedCreatePostCallers) {
    test(
      `${id}: ${title} creating a post - should return ${status}`,
      { tag: "@regression" },
      async ({ apiClient, rawApiClient, tokenFor }) => {
        const token = await tokenFor(caller);

        const data = buildPostData({ isPublished: true });

        const response = await test.step(`${title} creates a post`, () =>
          rawApiClient.posts.createPost(token, data));

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

        await test.step("post is not created", () => {
          expect(list.map(({ title }) => title)).not.toContain(data.title);
        });
      },
    );
  }

  for (const { id, title, buildPayload, status, error } of invalidPostData) {
    test(
      `${id}: ${title} - should return ${status}`,
      { tag: "@regression" },
      async ({ rawApiClient, adminToken }) => {
        const payload = buildPayload();

        const response =
          await test.step(`admin creates a post with ${title}`, () =>
            rawApiClient.posts.createPost(adminToken, payload));

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
