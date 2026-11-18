import { test as base, expect, APIRequestContext } from "@playwright/test";
import { CategoryController } from "./app/controllers/category-controller";
import { CourseController } from "./app/controllers/course-controller";
import { UserController } from "./app/controllers/user-controller";
import type {
  CreatedCategory,
  CreatedCourse,
  CreateCourseData,
} from "./app/types/course";
import type { CreatedUser } from "./app/types/user";
import {
  buildCategoryData,
  buildCourseData,
} from "./app/test-data/course-data";
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
  categoryController: CategoryController;
  // Creates a draft course as admin; every created course is deleted in teardown.
  createDraftCourse: (
    overrides?: Partial<CreateCourseData>,
  ) => Promise<CreatedCourse>;
  draftCourse: CreatedCourse;
  createdCategory: CreatedCategory;
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

  categoryController: async ({ api }, use) => {
    await use(new CategoryController(api));
  },

  createDraftCourse: async ({ courseController, adminToken }, use) => {
    const createdIds: string[] = [];
    await use(async (overrides) => {
      const data = buildCourseData(overrides);
      const response = await base.step(
        "precondition: admin creates a draft course",
        () => courseController.createCourse(adminToken, data),
      );
      const { id } = await response.json();
      createdIds.push(id);
      return { id, title: data.title };
    });
    for (const id of createdIds) {
      await courseController.deleteCourse(id, adminToken);
    }
  },

  draftCourse: async ({ createDraftCourse }, use) => {
    await use(await createDraftCourse());
  },

  createdCategory: async ({ categoryController, adminToken }, use) => {
    const response = await base.step(
      "precondition: admin creates a category",
      () => categoryController.createCategory(adminToken, buildCategoryData()),
    );
    const { id, slug } = await response.json();
    await use({ id, slug });
    await categoryController.deleteCategory(id, adminToken);
  },
});

export { expect };
