import { test as base, expect, APIRequestContext } from "@playwright/test";
import { CategoryController } from "./app/controllers/category-controller";
import { CourseController } from "./app/controllers/course-controller";
import { TagController } from "./app/controllers/tag-controller";
import { UserController } from "./app/controllers/user-controller";
import type {
  CourseWithChapters,
  CreatedCategory,
  CreatedChapter,
  CreatedCourse,
  CreateCourseData,
} from "./app/types/course";
import type { CreatedTag, CreateTagData } from "./app/types/tag";
import type { CreatedUser } from "./app/types/user";
import {
  buildCategoryData,
  buildChapterData,
  buildCourseData,
  buildUpdateCourseData,
} from "./app/test-data/course-data";
import { buildTagData } from "./app/test-data/tag-data";
import {
  adminCredentials,
  buildUserData,
  buildTokenRequestData,
} from "./app/test-data/user-data";

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
  // Creates a category as admin; every created category is deleted in teardown.
  createCategory: () => Promise<CreatedCategory>;
  createdCategory: CreatedCategory;
  tagController: TagController;
  // Creates a tag as admin; every created tag is deleted in teardown.
  createTag: (overrides?: Partial<CreateTagData>) => Promise<CreatedTag>;
  createdTag: CreatedTag;
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
    for (const id of ids) {
      await courseController.deleteCourse(id, adminToken);
    }
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
    for (const id of ids) {
      await categoryController.deleteCategory(id, adminToken);
    }
  },

  createdCategory: async ({ createCategory }, use) => {
    await use(await createCategory());
  },

  tagController: async ({ api }, use) => {
    await use(new TagController(api));
  },

  createTag: async ({ tagController, adminToken }, use) => {
    const ids: string[] = [];
    await use(async (overrides) => {
      const response = await base.step(
        "precondition: admin creates a tag",
        () => tagController.createTag(adminToken, buildTagData(overrides)),
      );
      const tag: CreatedTag = await response.json();
      ids.push(tag.id);
      return tag;
    });
    for (const id of ids) {
      await tagController.deleteTag(id, adminToken);
    }
  },

  createdTag: async ({ createTag }, use) => {
    await use(await createTag());
  },
});

export { expect };
