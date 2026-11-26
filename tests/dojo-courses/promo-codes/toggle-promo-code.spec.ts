import { promoCodeSchema } from "../../app/json-schemas/promo-code";
import { unauthorizedTogglePromoCodeCallers } from "../../app/test-data/invalid-promo-code-data";
import {
  buildPromoCodeData,
  nonExistingPromoCodeId,
} from "../../app/test-data/promo-code-data";
import type { PromoCodeListItem } from "../../app/types/promo-code";
import { expect, test } from "../../fixtures";

test.describe("toggle promo code", () => {
  test(
    "API-148: admin toggling an active promo code - should deactivate it and keep the other fields",
    { tag: ["@regression", "@smoke"] },
    async ({
      promoCodeController,
      createPromoCode,
      draftCourse,
      adminToken,
    }) => {
      const data = buildPromoCodeData();
      const { id } = await createPromoCode(draftCourse.id, data);
      const expectedFields = {
        ...data,
        id,
        courseId: draftCourse.id,
        currentUses: 0,
        isActive: false,
      };

      const response = await test.step("admin toggles the promo code", () =>
        promoCodeController.togglePromoCode(draftCourse.id, id, adminToken));

      const json = await response.json();

      await test.step("response body matches the promo code schema", () => {
        const result = promoCodeSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("promo code is deactivated and has the same values", () => {
        expect(json).toMatchObject(expectedFields);
      });

      const listResponse =
        await test.step("admin requests the promo codes of the course", () =>
          promoCodeController.getPromoCodes(draftCourse.id, adminToken));

      const list: PromoCodeListItem[] = await listResponse.json();

      await test.step("promo code is persisted as deactivated", () => {
        const stored = list.find((item) => item.id === id);
        expect(stored).toMatchObject(expectedFields);
      });
    },
  );

  test(
    "API-149: admin toggling a deactivated promo code - should activate it again",
    { tag: "@regression" },
    async ({
      promoCodeController,
      createPromoCode,
      draftCourse,
      adminToken,
    }) => {
      const { id } = await createPromoCode(draftCourse.id);

      await test.step("precondition: admin deactivates the promo code", () =>
        promoCodeController.togglePromoCode(draftCourse.id, id, adminToken));

      const response =
        await test.step("admin toggles the promo code again", () =>
          promoCodeController.togglePromoCode(draftCourse.id, id, adminToken));

      const json = await response.json();

      await test.step("promo code is active", () => {
        expect(json.isActive).toBe(true);
      });

      const listResponse =
        await test.step("admin requests the promo codes of the course", () =>
          promoCodeController.getPromoCodes(draftCourse.id, adminToken));

      const list: PromoCodeListItem[] = await listResponse.json();

      await test.step("promo code is persisted as active", () => {
        const stored = list.find((item) => item.id === id);
        expect(stored?.isActive).toBe(true);
      });
    },
  );
});

test.describe("toggle promo code - negative scenarios", () => {
  for (const {
    id,
    title,
    caller,
    status,
    error,
  } of unauthorizedTogglePromoCodeCallers) {
    test(
      `${id}: ${title} toggling a promo code - should return ${status}`,
      { tag: "@regression" },
      async ({
        promoCodeController,
        rawPromoCodeController,
        createPromoCode,
        draftCourse,
        adminToken,
        tokenFor,
      }) => {
        const token = await tokenFor(caller);

        const { id: promoCodeId } = await createPromoCode(draftCourse.id);

        const response =
          await test.step(`${title} toggles the promo code`, () =>
            rawPromoCodeController.togglePromoCode(
              draftCourse.id,
              promoCodeId,
              token,
            ));

        await test.step(`status code matches ${status}`, () => {
          expect(response.status()).toBe(status);
        });

        const json = await response.json();
        await test.step("response contains an error", () => {
          expect(json.error).toContain(error);
        });

        const listResponse =
          await test.step("admin requests the promo codes of the course", () =>
            promoCodeController.getPromoCodes(draftCourse.id, adminToken));

        const list: PromoCodeListItem[] = await listResponse.json();

        await test.step("promo code is still active", () => {
          const stored = list.find((item) => item.id === promoCodeId);
          expect(stored?.isActive).toBe(true);
        });
      },
    );
  }

  test(
    "API-153: admin toggling a non-existing promo code - should return 404",
    { tag: "@regression" },
    async ({ rawPromoCodeController, draftCourse, adminToken }) => {
      const response =
        await test.step("admin toggles a non-existing promo code", () =>
          rawPromoCodeController.togglePromoCode(
            draftCourse.id,
            nonExistingPromoCodeId,
            adminToken,
          ));

      await test.step("status code matches 404", () => {
        expect(response.status()).toBe(404);
      });

      const json = await response.json();
      await test.step("response contains an error", () => {
        expect(json.error).toContain("Not found");
      });
    },
  );

  test.fail(
    "API-154: admin toggling a promo code through another course - should return 404 and keep it active",
    {
      tag: "@regression",
      annotation: {
        type: "known bug",
        description:
          "the route ignores courseId from the path and looks the promo code up by id only, so it is toggled with 200",
      },
    },
    async ({
      promoCodeController,
      rawPromoCodeController,
      createPromoCode,
      createDraftCourse,
      draftCourse,
      adminToken,
    }) => {
      const otherCourse = await createDraftCourse();
      const { id } = await createPromoCode(draftCourse.id);

      const response =
        await test.step("admin toggles the promo code through another course", () =>
          rawPromoCodeController.togglePromoCode(
            otherCourse.id,
            id,
            adminToken,
          ));

      await test.step("status code matches 404", () => {
        expect(response.status()).toBe(404);
      });

      const listResponse =
        await test.step("admin requests the promo codes of the owning course", () =>
          promoCodeController.getPromoCodes(draftCourse.id, adminToken));

      const list: PromoCodeListItem[] = await listResponse.json();

      await test.step("promo code is still active", () => {
        const stored = list.find((item) => item.id === id);
        expect(stored?.isActive).toBe(true);
      });
    },
  );
});
