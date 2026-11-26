import { promoCodeSchema } from "../../app/json-schemas/promo-code";
import { nonExistingCourseId } from "../../app/test-data/course-data";
import {
  invalidPromoCodeData,
  unauthorizedCreatePromoCodeCallers,
} from "../../app/test-data/invalid-promo-code-data";
import { buildPromoCodeData } from "../../app/test-data/promo-code-data";
import type { PromoCodeListItem } from "../../app/types/promo-code";
import { expect, test } from "../../fixtures";

test.describe("create promo code", () => {
  test(
    "API-129: admin creating a promo code with all fields - should return 201 and the stored promo code",
    { tag: ["@regression", "@smoke"] },
    async ({ apiClient, draftCourse, adminToken }) => {
      const data = buildPromoCodeData();
      const expectedFields = {
        ...data,
        courseId: draftCourse.id,
        currentUses: 0,
        isActive: true,
      };

      const response = await test.step("admin creates a promo code", () =>
        apiClient.promoCodes.createPromoCode(draftCourse.id, adminToken, data));

      await test.step("status code matches 201", () => {
        expect(response.status()).toBe(201);
      });

      const json = await response.json();

      await test.step("response body matches the promo code schema", () => {
        const result = promoCodeSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("promo code has the sent values, no uses and is active", () => {
        expect(json).toMatchObject(expectedFields);
      });

      const listResponse =
        await test.step("admin requests the promo codes of the course", () =>
          apiClient.promoCodes.getPromoCodes(draftCourse.id, adminToken));

      const list: PromoCodeListItem[] = await listResponse.json();

      await test.step("promo code is persisted", () => {
        const stored = list.find(({ id }) => id === json.id);
        expect(stored).toMatchObject(expectedFields);
      });
    },
  );

  test(
    "API-130: admin creating a promo code without maxUses - should return 201 with unlimited uses",
    { tag: "@regression" },
    async ({ apiClient, draftCourse, adminToken }) => {
      const data = buildPromoCodeData({ maxUses: undefined });

      const response =
        await test.step("admin creates a promo code without maxUses", () =>
          apiClient.promoCodes.createPromoCode(
            draftCourse.id,
            adminToken,
            data,
          ));

      await test.step("status code matches 201", () => {
        expect(response.status()).toBe(201);
      });

      const json = await response.json();

      await test.step("promo code has no use limit", () => {
        expect(json).toMatchObject({
          ...data,
          courseId: draftCourse.id,
          maxUses: null,
        });
      });
    },
  );
});

test.describe("create promo code - negative scenarios", () => {
  for (const {
    id,
    title,
    caller,
    status,
    error,
  } of unauthorizedCreatePromoCodeCallers) {
    test(
      `${id}: ${title} creating a promo code - should return ${status}`,
      { tag: "@regression" },
      async ({
        apiClient,
        rawApiClient,
        draftCourse,
        adminToken,
        tokenFor,
      }) => {
        const token = await tokenFor(caller);

        const data = buildPromoCodeData();

        const response = await test.step(`${title} creates a promo code`, () =>
          rawApiClient.promoCodes.createPromoCode(draftCourse.id, token, data));

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

        await test.step("promo code is not created", () => {
          expect(list).toEqual([]);
        });
      },
    );
  }

  test(
    "API-134: admin creating a promo code for a non-existing course - should return 404",
    { tag: "@regression" },
    async ({ rawApiClient, adminToken }) => {
      const data = buildPromoCodeData();

      const response =
        await test.step("admin creates a promo code for a non-existing course", () =>
          rawApiClient.promoCodes.createPromoCode(
            nonExistingCourseId,
            adminToken,
            data,
          ));

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
    "API-135: admin creating a promo code with an existing code - should return 409 and keep the original",
    { tag: "@regression" },
    async ({
      apiClient,
      rawApiClient,
      draftCourse,
      adminToken,
    }) => {
      const data = buildPromoCodeData({ discountPercent: 50 });
      const duplicateData = { ...data, discountPercent: 10 };

      const originalResponse =
        await test.step("precondition: admin creates a promo code", () =>
          apiClient.promoCodes.createPromoCode(
            draftCourse.id,
            adminToken,
            data,
          ));
      const original = await originalResponse.json();

      const response =
        await test.step("admin creates a promo code with the same code", () =>
          rawApiClient.promoCodes.createPromoCode(
            draftCourse.id,
            adminToken,
            duplicateData,
          ));

      await test.step("status code matches 409", () => {
        expect(response.status()).toBe(409);
      });

      const json = await response.json();
      await test.step("response contains an error", () => {
        expect(json.error).toContain(
          "Promo code with this code already exists",
        );
      });

      const listResponse =
        await test.step("admin requests the promo codes of the course", () =>
          apiClient.promoCodes.getPromoCodes(draftCourse.id, adminToken));

      const list: PromoCodeListItem[] = await listResponse.json();

      await test.step("the original promo code is kept unchanged", () => {
        expect(list).toHaveLength(1);
        expect(list[0]).toMatchObject(original);
      });
    },
  );

  for (const {
    id,
    title,
    buildPayload,
    status,
    error,
  } of invalidPromoCodeData) {
    test(
      `${id}: ${title} - should return ${status}`,
      { tag: "@regression" },
      async ({ rawApiClient, draftCourse, adminToken }) => {
        const payload = buildPayload();

        const response =
          await test.step(`admin creates a promo code with ${title}`, () =>
            rawApiClient.promoCodes.createPromoCode(
              draftCourse.id,
              adminToken,
              payload,
            ));

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
