import {
  purchaseListSchema,
  type PurchaseList,
} from "../../app/json-schemas/purchase";
import { unauthorizedListPurchasesCallers } from "../../app/test-data/invalid-purchase-data";
import { expect, test } from "../../fixtures";

test.describe("get purchases", () => {
  test(
    "API-124: user who bought a course - should see it in their purchases with amount and course card",
    { tag: ["@regression", "@smoke"] },
    async ({
      courseController,
      purchaseController,
      publishedCourse,
      registeredUser,
      userToken,
    }) => {
      const purchaseResponse =
        await test.step("precondition: user purchases the course", () =>
          courseController.purchaseCourse(publishedCourse.id, userToken));
      const purchase = await purchaseResponse.json();

      const response = await test.step("user requests their purchases", () =>
        purchaseController.getPurchases(userToken));

      const json: PurchaseList = await response.json();

      await test.step("response body matches the purchase list schema", () => {
        const result = purchaseListSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("list contains exactly one purchase", () => {
        expect(json).toHaveLength(1);
      });

      await test.step("purchase belongs to the user, is charged the course price and has the course card", () => {
        expect(json[0]).toMatchObject({
          id: purchase.id,
          userId: registeredUser.id,
          courseId: publishedCourse.id,
          amount: String(publishedCourse.price),
          promoCode: null,
          course: {
            id: publishedCourse.id,
            title: publishedCourse.title,
            slug: publishedCourse.slug,
            imageUrl: publishedCourse.imageUrl,
          },
        });
      });
    },
  );

  test(
    "API-125: user without purchases - should not see purchases of another account",
    { tag: "@regression" },
    async ({
      courseController,
      purchaseController,
      publishedCourse,
      adminToken,
      userToken,
    }) => {
      await test.step("precondition: admin purchases the course", () =>
        courseController.purchaseCourse(publishedCourse.id, adminToken));

      const response = await test.step("user requests their purchases", () =>
        purchaseController.getPurchases(userToken));

      const json: PurchaseList = await response.json();

      await test.step("list is empty", () => {
        expect(json).toEqual([]);
      });
    },
  );
});

test.describe("get purchases - negative scenarios", () => {
  for (const {
    id,
    title,
    caller,
    status,
    error,
  } of unauthorizedListPurchasesCallers) {
    test(
      `${id}: ${title} - should return ${status}`,
      { tag: "@regression" },
      async ({ rawPurchaseController, tokenFor }) => {
        const token = await tokenFor(caller);

        const response =
          await test.step(`request purchases with ${title}`, () =>
            rawPurchaseController.getPurchases(token));

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
