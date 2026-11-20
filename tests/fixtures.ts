import { test as base, expect, APIRequestContext } from "@playwright/test";
import { CategoryController } from "./app/controllers/category-controller";
import { CourseController } from "./app/controllers/course-controller";
import { PostController } from "./app/controllers/post-controller";
import { PurchaseController } from "./app/controllers/purchase-controller";
import { TagController } from "./app/controllers/tag-controller";
import { UserController } from "./app/controllers/user-controller";
import type {
  CourseWithChapters,
  CreatedCategory,
  CreatedChapter,
  CreatedCourse,
  CreateCourseData,
  PublishedCourse,
} from "./app/types/course";
import type { CreatedPost, CreatePostData } from "./app/types/post";
import type { CreatedTag, CreateTagData } from "./app/types/tag";
import type { CreatedUser } from "./app/types/user";
import {
  buildCategoryData,
  buildChapterData,
  buildCourseData,
  buildUpdateCourseData,
  purchasableCoursePrice,
} from "./app/test-data/course-data";
import { buildPostData } from "./app/test-data/post-data";
import { buildTagData } from "./app/test-data/tag-data";
import {
  adminCredentials,
  buildUserData,
  buildTokenRequestData,
} from "./app/test-data/user-data";

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

type Fixtures = {
  // Request context that throws on any non-2xx/3xx response.
  // Use it for Arrange steps and happy paths; use the default `request`
  // fixture for the request under test in negative scenarios.
  // baseURL and extraHTTPHeaders come from the current project's `use` config.
  api: APIRequestContext;
  userController: UserController;
  rawUserController: UserController;
  registeredUser: CreatedUser;
  userToken: string;
  adminToken: string;
  courseController: CourseController;
  rawCourseController: CourseController;
  categoryController: CategoryController;
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
  purchaseController: PurchaseController;
  // Creates a category as admin; every created category is deleted in teardown.
  createCategory: () => Promise<CreatedCategory>;
  createdCategory: CreatedCategory;
  tagController: TagController;
  rawTagController: TagController;
  // Ids pushed here are deleted as admin in teardown, even if the test fails.
  tagIdsToDelete: string[];
  // Creates a tag as admin; every created tag is deleted in teardown.
  createTag: (overrides?: Partial<CreateTagData>) => Promise<CreatedTag>;
  createdTag: CreatedTag;
  postController: PostController;
  rawPostController: PostController;
  // Ids pushed here are deleted as admin in teardown, even if the test fails.
  postIdsToDelete: string[];
  // Creates a post as admin; every created post is deleted in teardown.
  createPost: (overrides?: Partial<CreatePostData>) => Promise<CreatedPost>;
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

  userController: async ({ api }, use) => {
    await use(new UserController(api));
  },

  rawUserController: async ({ request }, use) => {
    await use(new UserController(request));
  },

  registeredUser: async ({ userController }, use) => {
    const user = buildUserData();
    const response = await base.step("precondition: register a new user", () =>
      userController.registerUser(user),
    );
    const { id } = await response.json();

    await use({ ...user, id });
  },

  userToken: async ({ userController, registeredUser }, use) => {
    const response = await base.step(
      "precondition: get user access token",
      () => userController.getToken(buildTokenRequestData(registeredUser)),
    );
    const { access_token: userToken } = await response.json();
    await use(userToken);
  },

  adminToken: async ({ userController }, use) => {
    const response = await base.step(
      "precondition: get admin access token",
      () => userController.getToken(buildTokenRequestData(adminCredentials)),
    );
    const { access_token: adminToken } = await response.json();
    await use(adminToken);
  },

  courseController: async ({ api }, use) => {
    await use(new CourseController(api));
  },

  rawCourseController: async ({ request }, use) => {
    await use(new CourseController(request));
  },

  categoryController: async ({ api }, use) => {
    await use(new CategoryController(api));
  },

  courseIdsToDelete: async ({ courseController, adminToken }, use) => {
    const ids: string[] = [];
    await use(ids);
    await deleteEach(ids, (id) =>
      courseController.deleteCourse(id, adminToken),
    );
  },

  createDraftCourse: async (
    { courseController, adminToken, courseIdsToDelete },
    use,
  ) => {
    await use(async (overrides) => {
      const data = buildCourseData(overrides);
      const response = await base.step(
        "precondition: admin creates a draft course",
        () => courseController.createCourse(adminToken, data),
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
    { courseController, adminToken, draftCourse },
    use,
  ) => {
    const addChapter = async (): Promise<CreatedChapter> => {
      const data = buildChapterData();
      const response = await base.step(
        "precondition: admin adds a chapter to the course",
        () => courseController.createChapter(draftCourse.id, adminToken, data),
      );
      const { id } = await response.json();
      return { id, title: data.title };
    };

    const publishedChapter = await addChapter();
    const draftChapter = await addChapter();
    await base.step("precondition: admin publishes the first chapter", () =>
      courseController.updateChapter(
        draftCourse.id,
        publishedChapter.id,
        adminToken,
        { isPublished: true },
      ),
    );

    await use({ course: draftCourse, publishedChapter, draftChapter });
  },

  publishableCourse: async (
    { courseController, adminToken, courseWithChapters },
    use,
  ) => {
    const { course } = courseWithChapters;
    const response = await base.step(
      "precondition: admin fills in all content fields of the course",
      () =>
        courseController.updateCourse(
          course.id,
          adminToken,
          buildUpdateCourseData(),
        ),
    );
    const { id, title, slug } = await response.json();

    await use({ id, title, slug });
  },

  publishedCourse: async (
    { courseController, adminToken, courseWithChapters },
    use,
  ) => {
    const { course } = courseWithChapters;
    const response = await base.step(
      "precondition: admin fills in all content fields of the course",
      () =>
        courseController.updateCourse(
          course.id,
          adminToken,
          buildUpdateCourseData({ price: purchasableCoursePrice }),
        ),
    );
    const { id, title, slug } = await response.json();

    await base.step("precondition: admin publishes the course", () =>
      courseController.publishCourse(id, adminToken),
    );

    await use({ id, title, slug, price: purchasableCoursePrice });
  },

  purchaseController: async ({ api }, use) => {
    await use(new PurchaseController(api));
  },

  createCategory: async ({ categoryController, adminToken }, use) => {
    const ids: string[] = [];
    await use(async () => {
      const response = await base.step(
        "precondition: admin creates a category",
        () =>
          categoryController.createCategory(adminToken, buildCategoryData()),
      );
      const { id, slug } = await response.json();
      ids.push(id);
      return { id, slug };
    });
    await deleteEach(ids, (id) =>
      categoryController.deleteCategory(id, adminToken),
    );
  },

  createdCategory: async ({ createCategory }, use) => {
    await use(await createCategory());
  },

  tagController: async ({ api }, use) => {
    await use(new TagController(api));
  },

  rawTagController: async ({ request }, use) => {
    await use(new TagController(request));
  },

  tagIdsToDelete: async ({ tagController, adminToken }, use) => {
    const ids: string[] = [];
    await use(ids);
    await deleteEach(ids, (id) => tagController.deleteTag(id, adminToken));
  },

  createTag: async ({ tagController, adminToken, tagIdsToDelete }, use) => {
    await use(async (overrides) => {
      const response = await base.step(
        "precondition: admin creates a tag",
        () => tagController.createTag(adminToken, buildTagData(overrides)),
      );
      const tag: CreatedTag = await response.json();
      tagIdsToDelete.push(tag.id);
      return tag;
    });
  },

  createdTag: async ({ createTag }, use) => {
    await use(await createTag());
  },

  postController: async ({ api }, use) => {
    await use(new PostController(api));
  },

  rawPostController: async ({ request }, use) => {
    await use(new PostController(request));
  },

  postIdsToDelete: async ({ postController, adminToken }, use) => {
    const ids: string[] = [];
    await use(ids);
    await deleteEach(ids, (id) => postController.deletePost(id, adminToken));
  },

  createPost: async ({ postController, adminToken, postIdsToDelete }, use) => {
    await use(async (overrides) => {
      const data = buildPostData(overrides);
      const response = await base.step(
        "precondition: admin creates a post",
        () => postController.createPost(adminToken, data),
      );
      const { id, slug } = await response.json();
      postIdsToDelete.push(id);
      return { id, title: data.title, slug };
    });
  },
});

export { expect };
