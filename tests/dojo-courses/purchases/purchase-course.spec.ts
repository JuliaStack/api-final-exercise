import {
  purchaseSchema,
  type Purchase,
  type PurchaseList,
} from "../../app/json-schemas/purchase";
import { unauthenticatedPurchaseCallers } from "../../app/test-data/invalid-purchase-data";
import { expect, test } from "../../fixtures";

test.describe("purchase course", () => {
  test(
    "API-119: user buying a published course - should return 201 and record the purchase",
    { tag: ["@regression", "@smoke"] },
    async ({
      courseController,
      purchaseController,
      publishedCourse,
      registeredUser,
      userToken,
    }) => {
      const response = await test.step("user purchases the course", () =>
        courseController.purchaseCourse(publishedCourse.id, userToken));

      await test.step("status code matches 201", () => {
        expect(response.status()).toBe(201);
      });

      const json: Purchase = await response.json();

      await test.step("response body matches the purchase schema", () => {
        const result = purchaseSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("purchase belongs to the user and is charged the course price", () => {
        expect(json).toMatchObject({
          courseId: publishedCourse.id,
          userId: registeredUser.id,
          amount: String(publishedCourse.price),
          promoCode: null,
        });
      });

      const purchasesResponse =
        await test.step("user requests their purchases", () =>
          purchaseController.getPurchases(userToken));

      const purchases: PurchaseList = await purchasesResponse.json();

      await test.step("purchase is listed once", () => {
        expect(purchases.map(({ id }) => id)).toEqual([json.id]);
      });
    },
  );
});

test.describe("purchase course - negative scenarios", () => {
  test(
    "API-120: user buying the same course twice - should return 409",
    { tag: "@regression" },
    async ({
      courseController,
      rawCourseController,
      purchaseController,
      publishedCourse,
      userToken,
    }) => {
      await test.step("precondition: user purchases the course", () =>
        courseController.purchaseCourse(publishedCourse.id, userToken));

      const response = await test.step("user purchases the course again", () =>
        rawCourseController.purchaseCourse(publishedCourse.id, userToken));

      await test.step("status code matches 409", () => {
        expect(response.status()).toBe(409);
      });

      const json = await response.json();
      await test.step("response contains an error", () => {
        expect(json.error).toContain("Already purchased");
      });

      const purchasesResponse =
        await test.step("user requests their purchases", () =>
          purchaseController.getPurchases(userToken));

      const purchases: PurchaseList = await purchasesResponse.json();

      await test.step("course is still purchased once", () => {
        expect(purchases).toHaveLength(1);
      });
    },
  );

  test(
    "API-121: user buying a draft course - should return 404",
    { tag: "@regression" },
    async ({
      rawCourseController,
      purchaseController,
      draftCourse,
      userToken,
    }) => {
      const response = await test.step("user purchases the draft course", () =>
        rawCourseController.purchaseCourse(draftCourse.id, userToken));

      await test.step("status code matches 404", () => {
        expect(response.status()).toBe(404);
      });

      const json = await response.json();
      await test.step("response contains an error", () => {
        expect(json.error).toContain("Course not found");
      });

      const purchasesResponse =
        await test.step("user requests their purchases", () =>
          purchaseController.getPurchases(userToken));

      const purchases: PurchaseList = await purchasesResponse.json();

      await test.step("course is not purchased", () => {
        expect(purchases).toEqual([]);
      });
    },
  );

  for (const {
    id,
    title,
    token,
    status,
    error,
  } of unauthenticatedPurchaseCallers) {
    test(
      `${id}: ${title} - should return ${status}`,
      { tag: "@regression" },
      async ({ rawCourseController, publishedCourse }) => {
        const response =
          await test.step(`purchase the course with ${title}`, () =>
            rawCourseController.purchaseCourse(publishedCourse.id, token));

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
