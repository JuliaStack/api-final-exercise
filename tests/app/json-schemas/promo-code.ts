import { z } from "zod";

// Response body of POST /api/admin/courses/{courseId}/promo-codes
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
