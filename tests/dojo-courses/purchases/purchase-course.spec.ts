import {
  purchaseSchema,
  type Purchase,
  type PurchaseList,
} from "../../app/json-schemas/purchase";
import { unauthenticatedPurchaseCallers } from "../../app/test-data/invalid-purchase-data";
import { nonExistingPromoCode } from "../../app/test-data/promo-code-data";
import type { PromoCodeListItem } from "../../app/types/promo-code";
import { expect, test, type Fixtures } from "../../fixtures";

type ArrangeFixtures = Pick<
  Fixtures,
  | "publishedCourse"
  | "createDraftCourse"
  | "createPromoCode"
  | "promoCodeController"
  | "courseController"
  | "adminToken"
>;

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

  test(
    "API-162: user buying a course with a valid promo code - should return 201 at the discounted price",
    { tag: "@regression" },
    async ({
      courseController,
      promoCodeController,
      createPromoCode,
      publishedCourse,
      registeredUser,
      userToken,
      adminToken,
    }) => {
      const discountPercent = 25;
      const { id, code } = await createPromoCode(publishedCourse.id, {
        discountPercent,
      });

      const response =
        await test.step("user purchases the course with the promo code", () =>
          courseController.purchaseCourse(publishedCourse.id, userToken, {
            promoCode: code,
          }));

      await test.step("status code matches 201", () => {
        expect(response.status()).toBe(201);
      });

      const json: Purchase = await response.json();

      await test.step("purchase is charged the discounted price and records the promo code", () => {
        expect(json).toMatchObject({
          courseId: publishedCourse.id,
          userId: registeredUser.id,
          amount: String(
            (publishedCourse.price * (100 - discountPercent)) / 100,
          ),
          promoCode: code,
        });
      });

      const listResponse =
        await test.step("admin requests the promo codes of the course", () =>
          promoCodeController.getPromoCodes(publishedCourse.id, adminToken));

      const list: PromoCodeListItem[] = await listResponse.json();

      await test.step("promo code usage is counted once", () => {
        const stored = list.find((promoCode) => promoCode.id === id);
        expect(stored).toMatchObject({
          currentUses: 1,
          _count: { usages: 1 },
        });
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

  // Promo codes that cannot be applied: the route still sells the course (201)
  // at full price and ignores the code. `arrange` returns the code to use and
  // the course whose promo codes are checked afterwards; `expectedUses` is the
  // `currentUses` of each promo code of that course (none for a code that never existed).
  // The cases live here (not in test-data/) because the arrange steps use fixtures.
  const inapplicablePromoCodeCases: {
    id: string;
    title: string;
    expectedUses: number[];
    arrange: (
      fixtures: ArrangeFixtures,
    ) => Promise<{ code: string; promoCourseId: string }>;
  }[] = [
    {
      id: "API-163",
      title: "non-existing promo code",
      expectedUses: [],
      arrange: async ({ publishedCourse }) => ({
        code: nonExistingPromoCode,
        promoCourseId: publishedCourse.id,
      }),
    },
    {
      id: "API-164",
      title: "promo code of another course",
      expectedUses: [0],
      arrange: async ({ createDraftCourse, createPromoCode }) => {
        const otherCourse = await createDraftCourse();
        const { code } = await createPromoCode(otherCourse.id);
        return { code, promoCourseId: otherCourse.id };
      },
    },
    {
      id: "API-165",
      title: "deactivated promo code",
      expectedUses: [0],
      arrange: async ({
        publishedCourse,
        createPromoCode,
        promoCodeController,
        adminToken,
      }) => {
        const { id, code } = await createPromoCode(publishedCourse.id);
        await test.step("precondition: admin deactivates the promo code", () =>
          promoCodeController.togglePromoCode(
            publishedCourse.id,
            id,
            adminToken,
          ));
        return { code, promoCourseId: publishedCourse.id };
      },
    },
    {
      id: "API-166",
      title: "promo code with all uses taken",
      expectedUses: [1],
      arrange: async ({
        publishedCourse,
        createPromoCode,
        courseController,
        adminToken,
      }) => {
        const { code } = await createPromoCode(publishedCourse.id, {
          maxUses: 1,
        });
        await test.step("precondition: admin purchases the course with the promo code", () =>
          courseController.purchaseCourse(publishedCourse.id, adminToken, {
            promoCode: code,
          }));
        return { code, promoCourseId: publishedCourse.id };
      },
    },
    {
      id: "API-167",
      title: "promo code that has expired",
      expectedUses: [0],
      arrange: async ({
        publishedCourse,
        createPromoCode,
        courseController,
        adminToken,
      }) => {
        // A short margin, because the server compares with its own clock.
        const { code } = await createPromoCode(publishedCourse.id, {
          expiresAt: new Date(Date.now() + 5000).toISOString(),
        });
        // A purchase made before the expiry would apply the code, so wait until
        // validate-promo reports it as expired.
        await test.step("precondition: promo code expires", () =>
          expect
            .poll(
              async () => {
                const response = await courseController.validatePromoCode(
                  publishedCourse.id,
                  adminToken,
                  { code },
                );
                return (await response.json()).error;
              },
              { timeout: 15_000, intervals: [1_000] },
            )
            .toBeTruthy());
        return { code, promoCourseId: publishedCourse.id };
      },
    },
  ];

  for (const {
    id,
    title,
    expectedUses,
    arrange,
  } of inapplicablePromoCodeCases) {
    test(
      `${id}: user buying a course with a ${title} - should return 201 at full price`,
      { tag: "@regression" },
      async ({
        courseController,
        promoCodeController,
        createDraftCourse,
        createPromoCode,
        publishedCourse,
        userToken,
        adminToken,
      }) => {
        const { code, promoCourseId } = await arrange({
          publishedCourse,
          createDraftCourse,
          createPromoCode,
          promoCodeController,
          courseController,
          adminToken,
        });

        const response =
          await test.step(`user purchases the course with a ${title}`, () =>
            courseController.purchaseCourse(publishedCourse.id, userToken, {
              promoCode: code,
            }));

        await test.step("status code matches 201", () => {
          expect(response.status()).toBe(201);
        });

        const json: Purchase = await response.json();

        await test.step("purchase is charged the full price without a promo code", () => {
          expect(json).toMatchObject({
            amount: String(publishedCourse.price),
            promoCode: null,
          });
        });

        const listResponse =
          await test.step("admin requests the promo codes of the course", () =>
            promoCodeController.getPromoCodes(promoCourseId, adminToken));

        const list: PromoCodeListItem[] = await listResponse.json();

        await test.step("promo code usage is not counted", () => {
          expect(list.map(({ currentUses }) => currentUses)).toEqual(
            expectedUses,
          );
        });
      },
    );
  }
});
