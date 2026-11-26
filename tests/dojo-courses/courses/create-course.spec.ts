import { courseSchema } from "../../app/json-schemas/course";
import { buildCourseData } from "../../app/test-data/course-data";
import {
  invalidCourseData,
  unauthorizedCreateCourseCallers,
} from "../../app/test-data/invalid-course-data";
import { expect, test } from "../../fixtures";

test.describe("create course", () => {
  test(
    "API-042: admin creating a course with a valid title - should return 201 and a draft course",
    { tag: ["@regression", "@smoke"] },
    async ({ courseController, courseIdsToDelete, adminToken }) => {
      const data = buildCourseData();

      const response = await test.step("admin creates a course", () =>
        courseController.createCourse(adminToken, data));

      const json = await response.json();
      courseIdsToDelete.push(json.id);

      await test.step("status code matches 201", () => {
        expect(response.status()).toBe(201);
      });

      await test.step("response body matches the course schema", () => {
        const result = courseSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("title and slug are built from the sent title", () => {
        expect(json.title).toBe(data.title);
        expect(json.slug).toBe(data.title.toLowerCase().replace(/\s+/g, "-"));
      });

      await test.step("course is a draft", () => {
        expect(json.isPublished).toBe(false);
      });

      const listResponse =
        await test.step("admin searches for the created course", () =>
          courseController.getCourses({ search: data.title }, adminToken));

      const list = await listResponse.json();

      await test.step("course is persisted", () => {
        expect(list.pagination.total).toBe(1);
        expect(list.data[0].id).toBe(json.id);
      });
    },
  );

  test(
    "API-043: admin creating a course with an existing title - should return 201 with a different slug",
    { tag: "@regression" },
    async ({
      courseController,
      createDraftCourse,
      courseIdsToDelete,
      adminToken,
    }) => {
      const firstCourse = await createDraftCourse();

      const response =
        await test.step("admin creates a course with the same title", () =>
          courseController.createCourse(adminToken, {
            title: firstCourse.title,
          }));

      const json = await response.json();
      courseIdsToDelete.push(json.id);

      await test.step("status code matches 201", () => {
        expect(response.status()).toBe(201);
      });

      await test.step("new course has the same title and its own id", () => {
        expect(json.title).toBe(firstCourse.title);
        expect(json.id).not.toBe(firstCourse.id);
      });

      await test.step("slug of the new course is made unique", () => {
        expect(json.slug).toMatch(new RegExp(`^${firstCourse.slug}-\\d+$`));
      });

      const listResponse =
        await test.step("admin searches for the courses by title", () =>
          courseController.getCourses(
            { search: firstCourse.title },
            adminToken,
          ));

      const list = await listResponse.json();

      await test.step("both courses exist", () => {
        expect(list.pagination.total).toBe(2);
      });
    },
  );
});

test.describe("create course - negative scenarios", () => {
  for (const {
    id,
    title,
    caller,
    status,
    error,
  } of unauthorizedCreateCourseCallers) {
    test(
      `${id}: ${title} creating a course - should return ${status}`,
      { tag: "@regression" },
      async ({
        courseController,
        rawCourseController,
        adminToken,
        tokenFor,
      }) => {
        const token = await tokenFor(caller);

        const data = buildCourseData();

        const response = await test.step(`${title} creates a course`, () =>
          rawCourseController.createCourse(token, data));

        await test.step(`status code matches ${status}`, () => {
          expect(response.status()).toBe(status);
        });

        const json = await response.json();
        await test.step("response contains an error", () => {
          expect(json.error).toContain(error);
        });

        const listResponse =
          await test.step("admin searches for the course by title", () =>
            courseController.getCourses({ search: data.title }, adminToken));

        const list = await listResponse.json();

        await test.step("course is not created", () => {
          expect(list.pagination.total).toBe(0);
        });
      },
    );
  }

  for (const { id, title, buildPayload, status, error } of invalidCourseData) {
    test(
      `${id}: ${title} - should return ${status}`,
      { tag: "@regression" },
      async ({ rawCourseController, adminToken }) => {
        const payload = buildPayload();

        const response =
          await test.step(`admin creates a course with ${title}`, () =>
            rawCourseController.createCourse(adminToken, payload));

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
