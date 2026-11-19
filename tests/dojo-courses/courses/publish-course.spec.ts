import { courseSchema, type CourseDetail } from "../../app/json-schemas/course";
import {
  buildChapterData,
  buildUpdateCourseData,
  nonExistingCourseId,
} from "../../app/test-data/course-data";
import {
  incompleteCourseData,
  nonAdminPublishCourseCallers,
} from "../../app/test-data/invalid-course-data";
import { expect, test } from "../../fixtures";

test.describe("publish course", () => {
  test(
    "API-061: admin publishing a complete draft course - should return 200 and make the course public",
    { tag: ["@regression", "@smoke"] },
    async ({ courseController, publishableCourse, adminToken }) => {
      const response = await test.step("admin publishes the course", () =>
        courseController.publishCourse(publishableCourse.id, adminToken));

      const json = await response.json();

      await test.step("response body matches the course schema", () => {
        const result = courseSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("course is published", () => {
        expect(json.id).toBe(publishableCourse.id);
        expect(json.isPublished).toBe(true);
      });

      const detailsResponse =
        await test.step("anonymous user requests the course by id", () =>
          courseController.getCourse(publishableCourse.id));

      const details: CourseDetail = await detailsResponse.json();

      await test.step("course is visible to the anonymous user", () => {
        expect(details.id).toBe(publishableCourse.id);
        expect(details.isPublished).toBe(true);
      });
    },
  );

  test(
    "API-062: admin publishing an already published course - should unpublish it and hide it from the storefront",
    { tag: "@regression" },
    async ({
      courseController,
      rawCourseController,
      publishableCourse,
      adminToken,
    }) => {
      await test.step("precondition: admin publishes the course", () =>
        courseController.publishCourse(publishableCourse.id, adminToken));

      const response = await test.step("admin calls publish again", () =>
        courseController.publishCourse(publishableCourse.id, adminToken));

      const json = await response.json();

      await test.step("response body matches the course schema", () => {
        const result = courseSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("course is not published", () => {
        expect(json.id).toBe(publishableCourse.id);
        expect(json.isPublished).toBe(false);
      });

      const detailsResponse =
        await test.step("anonymous user requests the course by id", () =>
          rawCourseController.getCourse(publishableCourse.id));

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

test.describe("publish course - negative scenarios", () => {
  for (const {
    id,
    title,
    buildPayload,
    status,
    error,
  } of incompleteCourseData) {
    test(
      `${id}: ${title} - should return ${status}`,
      { tag: "@regression" },
      async ({
        courseController,
        rawCourseController,
        courseWithChapters,
        adminToken,
      }) => {
        const { course } = courseWithChapters;
        const data = buildPayload();

        await test.step("precondition: admin fills in the content fields of the course", () =>
          courseController.updateCourse(course.id, adminToken, data));

        const response = await test.step("admin publishes the course", () =>
          rawCourseController.publishCourse(course.id, adminToken));

        await test.step(`status code matches ${status}`, () => {
          expect(response.status()).toBe(status);
        });

        const json = await response.json();
        await test.step("response contains an error", () => {
          expect(json.error).toContain(error);
        });

        const detailsResponse =
          await test.step("admin requests the course by id", () =>
            courseController.getCourse(course.id, adminToken));

        const details: CourseDetail = await detailsResponse.json();

        await test.step("course is not published", () => {
          expect(details.isPublished).toBe(false);
        });
      },
    );
  }

  test(
    "API-066: course without a published chapter - should return 400",
    { tag: "@regression" },
    async ({
      courseController,
      rawCourseController,
      draftCourse,
      adminToken,
    }) => {
      await test.step("precondition: admin fills in all content fields of the course", () =>
        courseController.updateCourse(
          draftCourse.id,
          adminToken,
          buildUpdateCourseData(),
        ));

      await test.step("precondition: admin adds a draft chapter to the course", () =>
        courseController.createChapter(
          draftCourse.id,
          adminToken,
          buildChapterData(),
        ));

      const response = await test.step("admin publishes the course", () =>
        rawCourseController.publishCourse(draftCourse.id, adminToken));

      await test.step("status code matches 400", () => {
        expect(response.status()).toBe(400);
      });

      const json = await response.json();
      await test.step("response contains an error", () => {
        expect(json.error).toContain("At least one published chapter");
      });

      const detailsResponse =
        await test.step("admin requests the course by id", () =>
          courseController.getCourse(draftCourse.id, adminToken));

      const details: CourseDetail = await detailsResponse.json();

      await test.step("course is not published", () => {
        expect(details.isPublished).toBe(false);
      });
    },
  );

  for (const {
    id,
    title,
    getToken,
    status,
    error,
  } of nonAdminPublishCourseCallers) {
    test(
      `${id}: ${title} publishing a course - should return ${status}`,
      { tag: "@regression" },
      async ({
        courseController,
        rawCourseController,
        publishableCourse,
        userToken,
        adminToken,
      }) => {
        const response = await test.step(`${title} publishes the course`, () =>
          rawCourseController.publishCourse(
            publishableCourse.id,
            getToken(userToken),
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
            courseController.getCourse(publishableCourse.id, adminToken));

        const details: CourseDetail = await detailsResponse.json();

        await test.step("course is not published", () => {
          expect(details.isPublished).toBe(false);
        });
      },
    );
  }

  test(
    "API-070: admin publishing a non-existing course - should return 404",
    { tag: "@regression" },
    async ({ rawCourseController, adminToken }) => {
      const response =
        await test.step("admin publishes a non-existing course", () =>
          rawCourseController.publishCourse(nonExistingCourseId, adminToken));

      await test.step("status code matches 404", () => {
        expect(response.status()).toBe(404);
      });

      const json = await response.json();
      await test.step("response contains an error", () => {
        expect(json.error).toContain("Not found");
      });
    },
  );
});
