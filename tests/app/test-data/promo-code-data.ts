import { faker } from "@faker-js/faker";
import type { CreatePromoCodeData } from "../types/promo-code";

// The code is unique across all courses, so every built code is random.
export function buildPromoCodeData(
  overrides: Partial<CreatePromoCodeData> = {},
): CreatePromoCodeData {
  return {
    code: `PROMO-${faker.string.alphanumeric({ length: 8, casing: "upper" })}`,
    discountPercent: 50,
    maxUses: 100,
    expiresAt: faker.date.future().toISOString(),
    ...overrides,
  };
}

// Well-formed code that buildPromoCodeData never generates, so it never exists.
export const nonExistingPromoCode = "NO-SUCH-CODE";
