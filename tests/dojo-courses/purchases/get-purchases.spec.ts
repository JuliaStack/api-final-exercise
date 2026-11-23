import { purchaseListSchema } from "../../app/json-schemas/purchase";
import { unauthenticatedPurchasesListCallers } from "../../app/test-data/invalid-purchase-data";
import { expect, test } from "../../fixtures";

test.describe("get purchases", () => {
  test(
    "API-124: user who bought a course - should see it in the purchases with amount and course card",
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

      const json = await response.json();

      await test.step("response body matches the purchase list schema", () => {
        const result = purchaseListSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("list contains only the new purchase", () => {
        expect(json).toHaveLength(1);
      });

      await test.step("purchase belongs to the user, is charged the course price and has the course card", () => {
        expect({ ...json[0], amount: Number(json[0].amount) }).toMatchObject({
          id: purchase.id,
          userId: registeredUser.id,
          courseId: publishedCourse.id,
          amount: publishedCourse.price,
          promoCode: null,
          course: {
            id: publishedCourse.id,
            title: publishedCourse.title,
            slug: publishedCourse.slug,
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

      const json = await response.json();

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
    getToken,
    status,
    error,
  } of unauthenticatedPurchasesListCallers) {
    test(
      `${id}: ${title} requesting purchases - should return ${status}`,
      { tag: "@regression" },
      async ({ rawPurchaseController }) => {
        const response = await test.step(`${title} requests purchases`, () =>
          rawPurchaseController.getPurchases(getToken()));

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
