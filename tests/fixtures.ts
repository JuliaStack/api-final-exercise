import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { test as base, expect, APIRequestContext } from "@playwright/test";
import { ApiClient } from "./app/api-client";
import type {
  CourseWithChapters,
  CreatedCategory,
  CreatedChapter,
  CreatedCourse,
  CreateCourseData,
  PublishedCourse,
} from "./app/types/course";
import type { CreatedPost, CreatePostData } from "./app/types/post";
import type {
  CreatedPromoCode,
  CreatePromoCodeData,
} from "./app/types/promo-code";
import type { CreatedTag, CreateTagData } from "./app/types/tag";
import type { CreatedUser } from "./app/types/user";
import type { Caller } from "./app/types/caller";
import { expiredToken } from "./app/test-data/invalid-token-data";
import {
  buildCategoryData,
  buildChapterData,
  buildCourseData,
  buildUpdateCourseData,
  purchasableCoursePrice,
} from "./app/test-data/course-data";
import { buildPostData } from "./app/test-data/post-data";
import { buildPromoCodeData } from "./app/test-data/promo-code-data";
import { buildTagData } from "./app/test-data/tag-data";
import {
  adminCredentials,
  buildUserData,
  buildTokenRequestData,
} from "./app/test-data/user-data";
import { adminTokenFile, isTokenExpired } from "./app/utils";

// Teardown: tries to delete every id, even when one deletion fails,
// then fails the test if any deletion failed so leftovers are not hidden.
async function deleteEach(
  ids: string[],
  remove: (id: string) => Promise<unknown>,
) {
  const errors: unknown[] = [];
  for (const id of ids) {
    try {
      await remove(id);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length) {
    throw new AggregateError(
      errors,
      `teardown: ${errors.length} of ${ids.length} deletions failed`,
    );
  }
}

export type Fixtures = {
  // Request context that throws on any non-2xx/3xx response; `apiClient` runs on it.
  // baseURL and extraHTTPHeaders come from the current project's `use` config.
  api: APIRequestContext;
  // All controllers on `api`: throws on non-2xx. Use it for Arrange steps and happy paths.
  apiClient: ApiClient;
  // All controllers on the default `request`: never throws.
  // Use it for the request under test in negative scenarios.
  rawApiClient: ApiClient;
  registeredUser: CreatedUser;
  userToken: string;
  // Returns the Authorization token for a caller (undefined = no header).
  // A user is registered only for "regularUser", so the other cases stay cheap.
  tokenFor: (caller: Caller) => Promise<string | undefined>;
  adminToken: string;
  // Ids pushed here are deleted as admin in teardown, even if the test fails.
  courseIdsToDelete: string[];
  // Creates a draft course as admin; every created course is deleted in teardown.
  createDraftCourse: (
    overrides?: Partial<CreateCourseData>,
  ) => Promise<CreatedCourse>;
  draftCourse: CreatedCourse;
  // A draft course with one published and one draft chapter.
  courseWithChapters: CourseWithChapters;
  // A draft course with all content fields filled in and one published chapter.
  publishableCourse: CreatedCourse;
  // A published course with a known price (`purchasableCoursePrice`), ready to be bought.
  // It is the same course as `draftCourse` and `courseWithChapters`.
  publishedCourse: PublishedCourse;
  // Creates a category as admin; every created category is deleted in teardown.
  createCategory: () => Promise<CreatedCategory>;
  createdCategory: CreatedCategory;
  // Ids pushed here are deleted as admin in teardown, even if the test fails.
  tagIdsToDelete: string[];
  // Creates a tag as admin; every created tag is deleted in teardown.
  createTag: (overrides?: Partial<CreateTagData>) => Promise<CreatedTag>;
  createdTag: CreatedTag;
  // Ids pushed here are deleted as admin in teardown, even if the test fails.
  postIdsToDelete: string[];
  // Creates a post as admin; every created post is deleted in teardown.
  createPost: (overrides?: Partial<CreatePostData>) => Promise<CreatedPost>;
  // Creates a promo code as admin; it goes away with its course (cascade), so there is no teardown.
  createPromoCode: (
    courseId: string,
    overrides?: Partial<CreatePromoCodeData>,
  ) => Promise<CreatedPromoCode>;
  // Video ids pushed here are deleted as admin in teardown, even if the test fails.
  // Learning paths themselves cannot be deleted through the API.
  videoIdsToDelete: string[];
};

export const test = base.extend<Fixtures>({
  api: async ({ playwright, baseURL }, use) => {
    const api = await playwright.request.newContext({
      baseURL,
      failOnStatusCode: true,
    });
    await use(api);
    await api.dispose();
  },

  apiClient: async ({ api }, use) => {
    await use(new ApiClient(api));
  },

  rawApiClient: async ({ request }, use) => {
    await use(new ApiClient(request));
  },

  registeredUser: async ({ apiClient }, use) => {
    const user = buildUserData();
    const response = await base.step("precondition: register a new user", () =>
      apiClient.users.registerUser(user),
    );
    const { id } = await response.json();

    await use({ ...user, id });
  },

  userToken: async ({ apiClient, registeredUser }, use) => {
    const response = await base.step(
      "precondition: get user access token",
      () => apiClient.users.getToken(buildTokenRequestData(registeredUser)),
    );
    const { access_token: userToken } = await response.json();
    await use(userToken);
  },

  tokenFor: async ({ apiClient }, use) => {
    await use(async (caller) => {
      if (caller === "anonymous") return undefined;
      if (caller === "expiredToken") return expiredToken;

      const user = buildUserData();
      await base.step("precondition: register a new user", () =>
        apiClient.users.registerUser(user),
      );
      const response = await base.step(
        "precondition: get user access token",
        () => apiClient.users.getToken(buildTokenRequestData(user)),
      );
      const { access_token } = await response.json();
      return access_token as string;
    });
  },

  // The admin token is requested in global setup and stored in a file;
  // it lives 15 minutes, so when it has expired (e.g. the IDE skipped global
  // setup) a fresh one is requested and written back to the file.
  adminToken: async ({ apiClient }, use) => {
    let adminToken: string | undefined;
    try {
      adminToken = JSON.parse(
        readFileSync(adminTokenFile, "utf-8"),
      ).access_token;
    } catch {
      // missing or unreadable file: request a new token below
    }
    if (!adminToken || isTokenExpired(adminToken)) {
      adminToken = await base.step(
        "precondition: admin access token is missing or expired, request a new one",
        async () => {
          const response = await apiClient.users.getToken(
            buildTokenRequestData(adminCredentials),
          );
          const { access_token } = await response.json();
          // Write and rename, so parallel workers never read a half-written file.
          mkdirSync(dirname(adminTokenFile), { recursive: true });
          const tmpFile = `${adminTokenFile}.${process.pid}.tmp`;
          writeFileSync(tmpFile, JSON.stringify({ access_token }));
          renameSync(tmpFile, adminTokenFile);
          return access_token as string;
        },
      );
    }
    await use(adminToken);
  },

  courseIdsToDelete: async ({ apiClient, adminToken }, use) => {
    const ids: string[] = [];
    await use(ids);
    await deleteEach(ids, (id) =>
      apiClient.courses.deleteCourse(id, adminToken),
    );
  },

  createDraftCourse: async (
    { apiClient, adminToken, courseIdsToDelete },
    use,
  ) => {
    await use(async (overrides) => {
      const data = buildCourseData(overrides);
      const response = await base.step(
        "precondition: admin creates a draft course",
        () => apiClient.courses.createCourse(adminToken, data),
      );
      const { id, slug } = await response.json();
      courseIdsToDelete.push(id);
      return { id, title: data.title, slug };
    });
  },

  draftCourse: async ({ createDraftCourse }, use) => {
    await use(await createDraftCourse());
  },

  courseWithChapters: async (
    { apiClient, adminToken, draftCourse },
    use,
  ) => {
    const addChapter = async (): Promise<CreatedChapter> => {
      const data = buildChapterData();
      const response = await base.step(
        "precondition: admin adds a chapter to the course",
        () => apiClient.courses.createChapter(draftCourse.id, adminToken, data),
      );
      const { id } = await response.json();
      return { id, title: data.title };
    };

    const publishedChapter = await addChapter();
    const draftChapter = await addChapter();
    await base.step("precondition: admin publishes the first chapter", () =>
      apiClient.courses.updateChapter(
        draftCourse.id,
        publishedChapter.id,
        adminToken,
        { isPublished: true },
      ),
    );

    await use({ course: draftCourse, publishedChapter, draftChapter });
  },

  publishableCourse: async (
    { apiClient, adminToken, courseWithChapters },
    use,
  ) => {
    const { course } = courseWithChapters;
    const response = await base.step(
      "precondition: admin fills in all content fields of the course",
      () =>
        apiClient.courses.updateCourse(
          course.id,
          adminToken,
          buildUpdateCourseData(),
        ),
    );
    const { id, title, slug } = await response.json();

    await use({ id, title, slug });
  },

  publishedCourse: async (
    { apiClient, adminToken, courseWithChapters },
    use,
  ) => {
    const { course } = courseWithChapters;
    const response = await base.step(
      "precondition: admin fills in all content fields of the course",
      () =>
        apiClient.courses.updateCourse(
          course.id,
          adminToken,
          buildUpdateCourseData({ price: purchasableCoursePrice }),
        ),
    );
    const { id, title, slug, imageUrl } = await response.json();

    await base.step("precondition: admin publishes the course", () =>
      apiClient.courses.publishCourse(id, adminToken),
    );

    await use({ id, title, slug, imageUrl, price: purchasableCoursePrice });
  },

  createCategory: async ({ apiClient, adminToken }, use) => {
    const ids: string[] = [];
    await use(async () => {
      const response = await base.step(
        "precondition: admin creates a category",
        () =>
          apiClient.categories.createCategory(adminToken, buildCategoryData()),
      );
      const { id, slug } = await response.json();
      ids.push(id);
      return { id, slug };
    });
    await deleteEach(ids, (id) =>
      apiClient.categories.deleteCategory(id, adminToken),
    );
  },

  createdCategory: async ({ createCategory }, use) => {
    await use(await createCategory());
  },

  tagIdsToDelete: async ({ apiClient, adminToken }, use) => {
    const ids: string[] = [];
    await use(ids);
    await deleteEach(ids, (id) => apiClient.tags.deleteTag(id, adminToken));
  },

  createTag: async ({ apiClient, adminToken, tagIdsToDelete }, use) => {
    await use(async (overrides) => {
      const response = await base.step(
        "precondition: admin creates a tag",
        () => apiClient.tags.createTag(adminToken, buildTagData(overrides)),
      );
      const tag: CreatedTag = await response.json();
      tagIdsToDelete.push(tag.id);
      return tag;
    });
  },

  createdTag: async ({ createTag }, use) => {
    await use(await createTag());
  },

  postIdsToDelete: async ({ apiClient, adminToken }, use) => {
    const ids: string[] = [];
    await use(ids);
    await deleteEach(ids, (id) => apiClient.posts.deletePost(id, adminToken));
  },

  createPost: async ({ apiClient, adminToken, postIdsToDelete }, use) => {
    await use(async (overrides) => {
      const data = buildPostData(overrides);
      const response = await base.step(
        "precondition: admin creates a post",
        () => apiClient.posts.createPost(adminToken, data),
      );
      const { id, slug } = await response.json();
      postIdsToDelete.push(id);
      return { id, title: data.title, slug };
    });
  },

  createPromoCode: async ({ apiClient, adminToken }, use) => {
    await use(async (courseId, overrides) => {
      const response = await base.step(
        "precondition: admin creates a promo code",
        () =>
          apiClient.promoCodes.createPromoCode(
            courseId,
            adminToken,
            buildPromoCodeData(overrides),
          ),
      );
      const { id, code } = await response.json();
      return { id, code };
    });
  },

  videoIdsToDelete: async ({ apiClient, adminToken }, use) => {
    const ids: string[] = [];
    await use(ids);
    await deleteEach(ids, (id) =>
      apiClient.youtubeVideos.deleteVideo(id, adminToken),
    );
  },
});

export { expect };
