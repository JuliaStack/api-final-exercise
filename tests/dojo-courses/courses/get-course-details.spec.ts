import {
  courseDetailSchema,
  type CourseDetail,
} from "../../app/json-schemas/course";
import { nonExistingCourseId } from "../../app/test-data/course-data";
import { unauthorizedGetDraftCourseCallers } from "../../app/test-data/invalid-course-data";
import { expect, test } from "../../fixtures";

test.describe("get course by id", () => {
  test(
    "API-048: anonymous user gets a published course by id - should return 200 and the course",
    { tag: ["@regression", "@smoke"] },
    async ({ courseController, courseWithChapters, adminToken }) => {
      const { course } = courseWithChapters;

      await test.step("precondition: admin publishes the course", () =>
        courseController.updateCourse(course.id, adminToken, {
          isPublished: true,
        }));

      const response =
        await test.step("anonymous user requests the course by id", () =>
          courseController.getCourse(course.id));

      const json: CourseDetail = await response.json();

      await test.step("response body matches the course detail schema", () => {
        const result = courseDetailSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("course is the requested published course", () => {
        expect(json.id).toBe(course.id);
        expect(json.title).toBe(course.title);
        expect(json.isPublished).toBe(true);
      });
    },
  );

  test(
    "API-049: admin should see a draft course with all its chapters in position order",
    { tag: "@regression" },
    async ({ courseController, courseWithChapters, adminToken }) => {
      const { course, publishedChapter, draftChapter } = courseWithChapters;

      const response =
        await test.step("admin requests the draft course by id", () =>
          courseController.getCourse(course.id, adminToken));

      const json: CourseDetail = await response.json();

      await test.step("course is a draft", () => {
        expect(json.id).toBe(course.id);
        expect(json.isPublished).toBe(false);
      });

      await test.step("both chapters are returned in position order", () => {
        expect(json.chapters.map(({ id }) => id)).toEqual([
          publishedChapter.id,
          draftChapter.id,
        ]);
      });
    },
  );
});

test.describe("get course by id - negative scenarios", () => {
  for (const { id, title, token } of unauthorizedGetDraftCourseCallers) {
    test(
      `${id}: ${title} - should get 404 for a draft course`,
      { tag: "@regression" },
      async ({ rawCourseController, draftCourse }) => {
        const response =
          await test.step(`${title} requests the draft course by id`, () =>
            rawCourseController.getCourse(draftCourse.id, token));

        await test.step("status code matches 404", () => {
          expect(response.status()).toBe(404);
        });

        const json = await response.json();
        await test.step("response contains an error", () => {
          expect(json.error).toContain("Course not found");
        });
      },
    );
  }

  test(
    "API-051: regular user - should get 404 for a draft course",
    { tag: "@regression" },
    async ({ rawCourseController, draftCourse, userToken }) => {
      const response =
        await test.step("regular user requests the draft course by id", () =>
          rawCourseController.getCourse(draftCourse.id, userToken));

      await test.step("status code matches 404", () => {
        expect(response.status()).toBe(404);
      });

      const json = await response.json();
      await test.step("response contains an error", () => {
        expect(json.error).toContain("Course not found");
      });
    },
  );

  test(
    "API-053: non-existing course id - should return 404",
    { tag: "@regression" },
    async ({ rawCourseController }) => {
      const response =
        await test.step("anonymous user requests a non-existing course", () =>
          rawCourseController.getCourse(nonExistingCourseId));

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
