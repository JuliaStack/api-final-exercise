import { z } from "zod";

// Response body of POST /api/admin/courses/{courseId}/promo-codes
// and PATCH /api/admin/courses/{courseId}/promo-codes/{promoCodeId}
export const promoCodeSchema = z.strictObject({
  id: z.cuid(),
  code: z.string(),
  courseId: z.cuid(),
  discountPercent: z.int(),
  maxUses: z.int().nullable(),
  currentUses: z.int(),
  expiresAt: z.iso.datetime(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
});

export type PromoCode = z.infer<typeof promoCodeSchema>;

// Response body of POST /api/courses/{courseId}/validate-promo for an applicable code
export const promoValidationSchema = z.strictObject({
  valid: z.literal(true),
  discountPercent: z.int(),
  originalPrice: z.number(),
  finalPrice: z.number(),
});

export type PromoValidation = z.infer<typeof promoValidationSchema>;
