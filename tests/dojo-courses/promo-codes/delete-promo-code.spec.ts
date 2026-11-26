import { nonExistingCourseId } from "../../app/test-data/course-data";
import { unauthorizedDeletePromoCodeCallers } from "../../app/test-data/invalid-promo-code-data";
import { nonExistingPromoCodeId } from "../../app/test-data/promo-code-data";
import type { PromoCodeListItem } from "../../app/types/promo-code";
import { expect, test } from "../../fixtures";

test.describe("delete promo code", () => {
  test(
    "API-155: admin deleting an existing promo code - should remove the promo code",
    { tag: ["@regression", "@smoke"] },
    async ({
      apiClient,
      createPromoCode,
      draftCourse,
      adminToken,
    }) => {
      const { id } = await createPromoCode(draftCourse.id);

      const response = await test.step("admin deletes the promo code", () =>
        apiClient.promoCodes.deletePromoCode(draftCourse.id, id, adminToken));

      const json = await response.json();

      await test.step("response confirms the deletion", () => {
        expect(json).toEqual({ success: true });
      });

      const listResponse =
        await test.step("admin requests the promo codes of the course", () =>
          apiClient.promoCodes.getPromoCodes(draftCourse.id, adminToken));

      const list: PromoCodeListItem[] = await listResponse.json();

      await test.step("promo code is removed from the list", () => {
        expect(list.map((item) => item.id)).not.toContain(id);
      });
    },
  );
});

test.describe("delete promo code - negative scenarios", () => {
  for (const {
    id,
    title,
    caller,
    status,
    error,
  } of unauthorizedDeletePromoCodeCallers) {
    test(
      `${id}: ${title} deleting a promo code - should return ${status}`,
      { tag: "@regression" },
      async ({
        apiClient,
        rawApiClient,
        createPromoCode,
        draftCourse,
        adminToken,
        tokenFor,
      }) => {
        const token = await tokenFor(caller);

        const { id: promoCodeId } = await createPromoCode(draftCourse.id);

        const response =
          await test.step(`${title} deletes the promo code`, () =>
            rawApiClient.promoCodes.deletePromoCode(
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
            apiClient.promoCodes.getPromoCodes(draftCourse.id, adminToken));

        const list: PromoCodeListItem[] = await listResponse.json();

        await test.step("promo code is still in the list", () => {
          expect(list.map((item) => item.id)).toContain(promoCodeId);
        });
      },
    );
  }

  test.fail(
    "API-159: admin deleting a non-existing promo code - should return 404",
    {
      tag: "@regression",
      annotation: {
        type: "known bug",
        description:
          "the route calls prisma.promoCode.delete without a lookup and returns 500 with an empty body for a missing id",
      },
    },
    async ({ rawApiClient, draftCourse, adminToken }) => {
      const response =
        await test.step("admin deletes a non-existing promo code", () =>
          rawApiClient.promoCodes.deletePromoCode(
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
    "API-160: admin deleting a promo code through a non-existing course - should return 404 and keep it",
    {
      tag: "@regression",
      annotation: {
        type: "known bug",
        description:
          "the route ignores courseId from the path and deletes the promo code by id only",
      },
    },
    async ({
      apiClient,
      rawApiClient,
      createPromoCode,
      draftCourse,
      adminToken,
    }) => {
      const { id } = await createPromoCode(draftCourse.id);

      const response =
        await test.step("admin deletes the promo code through a non-existing course", () =>
          rawApiClient.promoCodes.deletePromoCode(
            nonExistingCourseId,
            id,
            adminToken,
          ));

      await test.step("status code matches 404", () => {
        expect(response.status()).toBe(404);
      });

      const listResponse =
        await test.step("admin requests the promo codes of the owning course", () =>
          apiClient.promoCodes.getPromoCodes(draftCourse.id, adminToken));

      const list: PromoCodeListItem[] = await listResponse.json();

      await test.step("promo code is still in the list", () => {
        expect(list.map((item) => item.id)).toContain(id);
      });
    },
  );

  test.fail(
    "API-161: admin deleting a promo code through another course - should return 404 and keep it",
    {
      tag: "@regression",
      annotation: {
        type: "known bug",
        description:
          "the route ignores courseId from the path and deletes the promo code by id only",
      },
    },
    async ({
      apiClient,
      rawApiClient,
      createPromoCode,
      createDraftCourse,
      draftCourse,
      adminToken,
    }) => {
      const otherCourse = await createDraftCourse();
      const { id } = await createPromoCode(draftCourse.id);

      const response =
        await test.step("admin deletes the promo code through another course", () =>
          rawApiClient.promoCodes.deletePromoCode(
            otherCourse.id,
            id,
            adminToken,
          ));

      await test.step("status code matches 404", () => {
        expect(response.status()).toBe(404);
      });

      const listResponse =
        await test.step("admin requests the promo codes of the owning course", () =>
          apiClient.promoCodes.getPromoCodes(draftCourse.id, adminToken));

      const list: PromoCodeListItem[] = await listResponse.json();

      await test.step("promo code is still in the list", () => {
        expect(list.map((item) => item.id)).toContain(id);
      });
    },
  );
});
