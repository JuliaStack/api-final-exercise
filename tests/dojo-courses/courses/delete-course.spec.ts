import {
  buildChapterData,
  buildCourseData,
  nonExistingCourseId,
} from "../../app/test-data/course-data";
import { unauthorizedDeleteCourseCallers } from "../../app/test-data/invalid-course-data";
import { expect, test } from "../../fixtures";

test.describe("delete course", () => {
  test(
    "API-071: admin deleting a draft course with a chapter - should return 200 and remove the course",
    { tag: ["@regression", "@smoke"] },
    async ({ courseController, rawCourseController, adminToken }) => {
      const createResponse =
        await test.step("precondition: admin creates a course", () =>
          courseController.createCourse(adminToken, buildCourseData()));
      const { id } = await createResponse.json();

      await test.step("precondition: admin adds a chapter to the course", () =>
        courseController.createChapter(id, adminToken, buildChapterData()));

      const response = await test.step("admin deletes the course", () =>
        courseController.deleteCourse(id, adminToken));

      const json = await response.json();

      await test.step("response confirms the deletion", () => {
        expect(json).toEqual({ success: true });
      });

      const detailsResponse =
        await test.step("admin requests the deleted course by id", () =>
          rawCourseController.getCourse(id, adminToken));

      await test.step("status code matches 404", () => {
        expect(detailsResponse.status()).toBe(404);
      });

      const detailsJson = await detailsResponse.json();
      await test.step("response contains an error", () => {
        expect(detailsJson.error).toContain("Course not found");
      });
    },
  );
});

test.describe("delete course - negative scenarios", () => {
  for (const {
    id,
    title,
    caller,
    status,
    error,
  } of unauthorizedDeleteCourseCallers) {
    test(
      `${id}: ${title} deleting a course - should return ${status}`,
      { tag: "@regression" },
      async ({
        courseController,
        rawCourseController,
        draftCourse,
        adminToken,
        tokenFor,
      }) => {
        const token = await tokenFor(caller);

        const response = await test.step(`${title} deletes the course`, () =>
          rawCourseController.deleteCourse(draftCourse.id, token));

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

        const details = await detailsResponse.json();

        await test.step("course still exists", () => {
          expect(details.id).toBe(draftCourse.id);
        });
      },
    );
  }

  test.fail(
    "API-118: admin deleting a non-existing course - should return 404",
    {
      tag: "@regression",
      annotation: {
        type: "known bug",
        description:
          "the route calls prisma.course.delete without a lookup and returns 500 for a missing id",
      },
    },
    async ({ rawCourseController, adminToken }) => {
      const response =
        await test.step("admin deletes a non-existing course", () =>
          rawCourseController.deleteCourse(nonExistingCourseId, adminToken));

      await test.step("status code matches 404", () => {
        expect(response.status()).toBe(404);
      });

      const json = await response.json();
      await test.step("response contains an error", () => {
        expect(json.error).toContain("Course not found");
      });
    },
  );
});
