import {
  courseDetailSchema,
  courseSchema,
  type CourseDetail,
} from "../../app/json-schemas/course";
import { buildUpdateCourseData } from "../../app/test-data/course-data";
import { nonAdminUpdateCourseCallers } from "../../app/test-data/invalid-course-data";
import { expect, test } from "../../fixtures";

test.describe("update course", () => {
  test(
    "API-054: admin updating all content fields of a course - should return 200 and the updated course",
    { tag: ["@regression", "@smoke"] },
    async ({ courseController, draftCourse, createdCategory, adminToken }) => {
      const data = buildUpdateCourseData({
        categoryIds: [createdCategory.id],
      });

      const expectedFields = {
        title: data.title,
        slug: data.title?.toLowerCase().replace(/\s+/g, "-"),
        description: data.description,
        imageUrl: data.imageUrl,
        price: String(data.price),
        outcomes: JSON.stringify(data.outcomes),
        requirements: JSON.stringify(data.requirements),
        authorName: data.authorName,
        authorRole: data.authorRole,
      };

      const response = await test.step("admin updates the course", () =>
        courseController.updateCourse(draftCourse.id, adminToken, data));

      const json = await response.json();

      await test.step("response body matches the course schema", () => {
        const result = courseSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("course has the sent values", () => {
        expect(json).toMatchObject({ id: draftCourse.id, ...expectedFields });
      });

      const detailsResponse =
        await test.step("admin requests the course by id", () =>
          courseController.getCourse(draftCourse.id, adminToken));

      const details: CourseDetail = await detailsResponse.json();

      await test.step("response body matches the course details schema", () => {
        const result = courseDetailSchema.safeParse(details);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("changes are persisted", () => {
        expect(details).toMatchObject({
          id: draftCourse.id,
          ...expectedFields,
          categories: [expect.objectContaining({ id: createdCategory.id })],
        });
      });
    },
  );

  test(
    "API-055: admin updating only the price - should leave the other fields unchanged",
    { tag: "@regression" },
    async ({ courseController, draftCourse, createdCategory, adminToken }) => {
      await test.step("precondition: admin fills in all content fields of the course", () =>
        courseController.updateCourse(
          draftCourse.id,
          adminToken,
          buildUpdateCourseData({ categoryIds: [createdCategory.id] }),
        ));

      const beforeResponse =
        await test.step("precondition: admin requests the course by id", () =>
          courseController.getCourse(draftCourse.id, adminToken));

      const before: CourseDetail = await beforeResponse.json();
      // Outside the builder's price range (1-999), so it always differs from the earlier price.
      const price = 1000.99;

      await test.step("admin updates only the price", () =>
        courseController.updateCourse(draftCourse.id, adminToken, { price }));

      const afterResponse =
        await test.step("admin requests the course by id", () =>
          courseController.getCourse(draftCourse.id, adminToken));

      const after: CourseDetail = await afterResponse.json();

      await test.step("only the price and updatedAt have changed", () => {
        expect(after).toEqual({
          ...before,
          price: String(price),
          updatedAt: expect.any(String),
        });
      });
    },
  );

  test(
    "API-056: admin sending categoryIds - should replace the categories of the course",
    { tag: "@regression" },
    async ({ courseController, draftCourse, createCategory, adminToken }) => {
      const firstCategory = await createCategory();
      const secondCategory = await createCategory();

      await test.step("precondition: admin assigns the course to the first category", () =>
        courseController.updateCourse(draftCourse.id, adminToken, {
          categoryIds: [firstCategory.id],
        }));

      await test.step("admin moves the course to the second category", () =>
        courseController.updateCourse(draftCourse.id, adminToken, {
          categoryIds: [secondCategory.id],
        }));

      const response = await test.step("admin requests the course by id", () =>
        courseController.getCourse(draftCourse.id, adminToken));

      const json: CourseDetail = await response.json();

      await test.step("course has only the second category", () => {
        expect(json.categories.map(({ id }) => id)).toEqual([
          secondCategory.id,
        ]);
      });
    },
  );

  test(
    "API-057: admin renaming a course to the title of another course - should give it a unique slug",
    { tag: "@regression" },
    async ({
      courseController,
      draftCourse,
      createDraftCourse,
      adminToken,
    }) => {
      const renamedCourse = await createDraftCourse();

      const response =
        await test.step("admin renames the new course to the title of the existing course", () =>
          courseController.updateCourse(renamedCourse.id, adminToken, {
            title: draftCourse.title,
          }));

      const json = await response.json();

      await test.step("title is updated and slug is made unique", () => {
        expect(json.title).toBe(draftCourse.title);
        expect(json.slug).toMatch(new RegExp(`^${draftCourse.slug}-\\d+$`));
      });

      const detailsResponse =
        await test.step("admin requests the existing course by id", () =>
          courseController.getCourse(draftCourse.id, adminToken));

      const details: CourseDetail = await detailsResponse.json();

      await test.step("slug of the existing course is not changed", () => {
        expect(details.slug).toBe(draftCourse.slug);
      });
    },
  );
});

test.describe("update course - negative scenarios", () => {
  for (const {
    id,
    title,
    getToken,
    status,
    error,
  } of nonAdminUpdateCourseCallers) {
    test(
      `${id}: ${title} updating a course - should return ${status}`,
      { tag: "@regression" },
      async ({
        courseController,
        rawCourseController,
        draftCourse,
        userToken,
        adminToken,
      }) => {
        const data = buildUpdateCourseData();

        const response = await test.step(`${title} updates the course`, () =>
          rawCourseController.updateCourse(
            draftCourse.id,
            getToken(userToken),
            data,
          ));

        await test.step(`status code matches ${status}`, () => {
          expect(response.status()).toBe(status);
        });

        const json = await response.json();
        await test.step("response contains an error", () => {
          expect(json.error).toContain(error);
        });

        const detailsResponse =
          await test.step("admin requests the course by id", () =>
            courseController.getCourse(draftCourse.id, adminToken));

        const details: CourseDetail = await detailsResponse.json();

        await test.step("course is not changed", () => {
          expect(details.title).toBe(draftCourse.title);
          expect(details.slug).toBe(draftCourse.slug);
        });
      },
    );
  }
});
