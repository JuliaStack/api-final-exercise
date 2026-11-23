import {
  promoValidationSchema,
  type PromoValidation,
} from "../../app/json-schemas/promo-code";
import {
  nonExistingCourseId,
  purchasableCoursePrice,
} from "../../app/test-data/course-data";
import { unauthenticatedValidatePromoCallers } from "../../app/test-data/invalid-promo-code-data";
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

test.describe("validate promo code", () => {
  test(
    "API-139: user validating a promo code of the course - should return the discount and the final price",
    { tag: ["@regression", "@smoke"] },
    async ({
      courseController,
      promoCodeController,
      createPromoCode,
      publishedCourse,
      userToken,
      adminToken,
    }) => {
      const discountPercent = 25;
      const { id, code } = await createPromoCode(publishedCourse.id, {
        discountPercent,
      });

      const response = await test.step("user validates the promo code", () =>
        courseController.validatePromoCode(publishedCourse.id, userToken, {
          code,
        }));

      const json: PromoValidation = await response.json();

      await test.step("response body matches the promo validation schema", () => {
        const result = promoValidationSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("promo code is valid and the final price has the discount applied", () => {
        expect(json).toMatchObject({
          valid: true,
          discountPercent,
          originalPrice: purchasableCoursePrice,
          finalPrice: (purchasableCoursePrice * (100 - discountPercent)) / 100,
        });
      });

      const listResponse =
        await test.step("admin requests the promo codes of the course", () =>
          promoCodeController.getPromoCodes(publishedCourse.id, adminToken));

      const list: PromoCodeListItem[] = await listResponse.json();

      await test.step("validating did not use up the promo code", () => {
        const stored = list.find((promoCode) => promoCode.id === id);
        expect(stored?.currentUses).toBe(0);
      });
    },
  );
});

test.describe("validate promo code - negative scenarios", () => {
  // Cases where the code is not applicable: the route answers 200 with
  // `valid: false` and the reason. `arrange` returns the code to validate.
  // The cases live here (not in test-data/) because the arrange steps use fixtures.
  const inapplicablePromoCodeCases: {
    id: string;
    title: string;
    error: string;
    arrange: (fixtures: ArrangeFixtures) => Promise<string>;
  }[] = [
    {
      id: "API-140",
      title: "promo code of another course",
      error: "Promo code not found",
      arrange: async ({ createDraftCourse, createPromoCode }) => {
        const otherCourse = await createDraftCourse();
        const { code } = await createPromoCode(otherCourse.id);
        return code;
      },
    },
    {
      id: "API-141",
      title: "non-existing promo code",
      error: "Promo code not found",
      arrange: async () => nonExistingPromoCode,
    },
    {
      id: "API-142",
      title: "deactivated promo code",
      error: "Promo code is deactivated",
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
        return code;
      },
    },
    {
      id: "API-143",
      title: "promo code with all uses taken",
      error: "Promo code usage limit reached",
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
        return code;
      },
    },
  ];

  for (const { id, title, error, arrange } of inapplicablePromoCodeCases) {
    test(
      `${id}: ${title} - should not be valid`,
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
        const code = await arrange({
          publishedCourse,
          createDraftCourse,
          createPromoCode,
          promoCodeController,
          courseController,
          adminToken,
        });

        const response = await test.step(`user validates the ${title}`, () =>
          courseController.validatePromoCode(publishedCourse.id, userToken, {
            code,
          }));

        const json = await response.json();

        await test.step("promo code is not valid", () => {
          expect(json.valid).toBe(false);
        });

        await test.step("response contains an error", () => {
          expect(json.error).toContain(error);
        });
      },
    );
  }

  test(
    "API-144: empty promo code - should return 400",
    { tag: "@regression" },
    async ({ rawCourseController, publishedCourse, userToken }) => {
      const response =
        await test.step("user validates an empty promo code", () =>
          rawCourseController.validatePromoCode(publishedCourse.id, userToken, {
            code: "",
          }));

      await test.step("status code matches 400", () => {
        expect(response.status()).toBe(400);
      });

      const json = await response.json();

      await test.step("promo code is not valid", () => {
        expect(json.valid).toBe(false);
      });

      await test.step("response contains an error", () => {
        expect(json.error).toContain("Enter a promo code");
      });
    },
  );

  for (const {
    id,
    title,
    token,
    status,
    error,
  } of unauthenticatedValidatePromoCallers) {
    test(
      `${id}: ${title} - should return ${status}`,
      { tag: "@regression" },
      async ({ rawCourseController }) => {
        const response =
          await test.step(`validate a promo code with ${title}`, () =>
            rawCourseController.validatePromoCode(nonExistingCourseId, token, {
              code: nonExistingPromoCode,
            }));

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

  test(
    "API-147: expired promo code - should not be valid",
    { tag: "@regression" },
    async ({
      courseController,
      createPromoCode,
      publishedCourse,
      userToken,
    }) => {
      // A short margin, because the server compares with its own clock.
      const { code } = await createPromoCode(publishedCourse.id, {
        expiresAt: new Date(Date.now() + 5000).toISOString(),
      });

      // The response is 200 both before and after the expiry, so poll until the
      // error appears and keep the last body for the assertions below.
      let last: { valid?: boolean; error?: string } = {};
      await test.step("user validates the promo code until it expires", () =>
        expect
          .poll(
            async () => {
              const response = await courseController.validatePromoCode(
                publishedCourse.id,
                userToken,
                { code },
              );
              last = await response.json();
              return last.error;
            },
            { timeout: 15_000, intervals: [1_000] },
          )
          .toBeTruthy());

      await test.step("promo code is not valid", () => {
        expect(last.valid).toBe(false);
      });

      await test.step("response contains an error", () => {
        expect(last.error).toContain("Promo code has expired");
      });
    },
  );
});
