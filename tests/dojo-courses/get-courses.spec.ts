import {
  coursesPageSchema,
  type CoursesPage,
} from "../app/json-schemas/course";
import { buildSearchToken } from "../app/test-data/course-data";
import { hiddenDraftCallers } from "../app/test-data/hidden-draft-callers-data";
import { expect, test } from "../fixtures";

test.describe("get courses list", { tag: ["@regression", "@smoke"] }, () => {
  test("API-033: anonymous user gets the catalog with default pagination - should return only published courses", async ({
    courseController,
  }) => {
    const response =
      await test.step("anonymous user requests the course list", () =>
        courseController.getCourses());

    await test.step("status code matches 200", () => {
      expect(response.status()).toBe(200);
    });

    const json = await response.json();

    await test.step("response body matches the courses page schema", () => {
      const result = coursesPageSchema.safeParse(json);
      expect(result.error?.issues ?? []).toEqual([]);
    });

    await test.step("pagination has default values", () => {
      const { page, limit, total, totalPages } = json.pagination;
      expect(page).toBe(1);
      expect(limit).toBe(20);
      expect(totalPages).toBe(Math.ceil(total / limit));
      expect(json.data.length).toBeLessThanOrEqual(limit);
    });

    await test.step("every course is published", () => {
      for (const course of json.data) {
        expect(course.isPublished).toBe(true);
      }
    });
  });

  for (const { id, title, getToken } of hiddenDraftCallers) {
    test(`${id}: ${title} - should not see a draft course in the list`, async ({
      courseController,
      draftCourse,
      userToken,
    }) => {
      const response =
        await test.step(`${title} searches for the draft course`, () =>
          courseController.getCourses(
            { search: draftCourse.title },
            getToken(userToken),
          ));

      await test.step("status code matches 200", () => {
        expect(response.status()).toBe(200);
      });

      const json = await response.json();

      await test.step("draft course is not in the list", () => {
        expect(json.pagination.total).toBe(0);
        expect(json.data).toEqual([]);
      });
    });
  }

  test("API-037: admin should see a draft course in the list", async ({
    courseController,
    draftCourse,
    adminToken,
  }) => {
    const response =
      await test.step("admin searches for the draft course", () =>
        courseController.getCourses({ search: draftCourse.title }, adminToken));

    await test.step("status code matches 200", () => {
      expect(response.status()).toBe(200);
    });

    const json = await response.json();

    await test.step("response body matches the courses page schema", () => {
      const result = coursesPageSchema.safeParse(json);
      expect(result.error?.issues ?? []).toEqual([]);
    });

    await test.step("draft course is in the list", () => {
      expect(json.pagination.total).toBe(1);
      expect(json.data[0].id).toBe(draftCourse.id);
      expect(json.data[0].isPublished).toBe(false);
    });
  });

  test("API-038: published course should appear in the list for anonymous user", async ({
    courseController,
    draftCourse,
    adminToken,
  }) => {
    await test.step("precondition: admin publishes the course", () =>
      courseController.updateCourse(draftCourse.id, adminToken, {
        isPublished: true,
      }));

    const response =
      await test.step("anonymous user searches for the course", () =>
        courseController.getCourses({ search: draftCourse.title }));

    await test.step("status code matches 200", () => {
      expect(response.status()).toBe(200);
    });

    const json = await response.json();

    await test.step("published course is in the list", () => {
      expect(json.pagination.total).toBe(1);
      expect(json.data[0].id).toBe(draftCourse.id);
      expect(json.data[0].isPublished).toBe(true);
    });
  });

  test("API-039: page and limit should split results without loss or overlap", async ({
    courseController,
    createDraftCourse,
    adminToken,
  }) => {
    const token = buildSearchToken();
    const first = await createDraftCourse({ title: `${token} 1` });
    const second = await createDraftCourse({ title: `${token} 2` });
    const third = await createDraftCourse({ title: `${token} 3` });

    const page1Response =
      await test.step("admin requests page 1 with limit 2", () =>
        courseController.getCourses(
          { search: token, page: 1, limit: 2 },
          adminToken,
        ));
    const page1: CoursesPage = await page1Response.json();

    const page2Response =
      await test.step("admin requests page 2 with limit 2", () =>
        courseController.getCourses(
          { search: token, page: 2, limit: 2 },
          adminToken,
        ));
    const page2: CoursesPage = await page2Response.json();

    await test.step("page 1 has two newest courses and correct pagination", () => {
      expect(page1.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
      expect(page1.data.map(({ id }) => id)).toEqual([third.id, second.id]);
    });

    await test.step("page 2 has the remaining course", () => {
      expect(page2.pagination.page).toBe(2);
      expect(page2.data.map(({ id }) => id)).toEqual([first.id]);
    });
  });

  test("API-040: category filter should return only courses of that category", async ({
    courseController,
    draftCourse,
    createdCategory,
    adminToken,
  }) => {
    await test.step("precondition: admin links the course to the category", () =>
      courseController.updateCourse(draftCourse.id, adminToken, {
        categoryIds: [createdCategory.id],
      }));

    const response =
      await test.step("admin filters the list by category slug", () =>
        courseController.getCourses(
          { category: createdCategory.slug },
          adminToken,
        ));

    await test.step("status code matches 200", () => {
      expect(response.status()).toBe(200);
    });

    const json: CoursesPage = await response.json();

    await test.step("only the linked course is returned", () => {
      expect(json.pagination.total).toBe(1);
      expect(json.data[0].id).toBe(draftCourse.id);
      expect(json.data[0].categories.map(({ slug }) => slug)).toContain(
        createdCategory.slug,
      );
    });
  });

  test("API-041: search should match courses by title and by description", async ({
    courseController,
    createDraftCourse,
    adminToken,
  }) => {
    const token = buildSearchToken();
    const titleMatch = await createDraftCourse({ title: `${token} title` });
    const descriptionMatch = await createDraftCourse();

    await test.step("precondition: admin adds the search token to the description", () =>
      courseController.updateCourse(descriptionMatch.id, adminToken, {
        description: `Description with ${token}`,
      }));

    const response = await test.step("admin searches by the token", () =>
      courseController.getCourses({ search: token }, adminToken));

    await test.step("status code matches 200", () => {
      expect(response.status()).toBe(200);
    });

    const json: CoursesPage = await response.json();

    await test.step("both courses are returned", () => {
      expect(json.pagination.total).toBe(2);
      expect(json.data.map(({ id }) => id).sort()).toEqual(
        [titleMatch.id, descriptionMatch.id].sort(),
      );
    });
  });
});
