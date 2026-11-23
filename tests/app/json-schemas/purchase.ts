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

// One element of GET /api/purchases: the purchase plus a short course card.
export const purchaseListItemSchema = purchaseSchema.extend({
  course: z.strictObject({
    id: z.cuid(),
    title: z.string(),
    slug: z.string(),
    imageUrl: z.string().nullable(),
  }),
});

// Response body of GET /api/purchases
export const purchaseListSchema = z.array(purchaseListItemSchema);

export type PurchaseList = z.infer<typeof purchaseListSchema>;
