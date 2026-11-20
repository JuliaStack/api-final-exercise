import { z } from "zod";

// Response body of POST /api/courses/{courseId}/purchase
export const purchaseSchema = z.strictObject({
  id: z.cuid(),
  userId: z.cuid(),
  courseId: z.cuid(),
  amount: z.string(),
  promoCode: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export type Purchase = z.infer<typeof purchaseSchema>;
