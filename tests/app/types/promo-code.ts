export type PromoCodeFields = {
  id: string;
  code: string;
  courseId: string;
  discountPercent: number;
  maxUses: number | null;
  currentUses: number;
  expiresAt: string;
  isActive: boolean;
};

export type CreatePromoCodeData = Pick<
  PromoCodeFields,
  "code" | "discountPercent" | "expiresAt"
> &
  Partial<Pick<PromoCodeFields, "maxUses">>;

// One element of GET /api/admin/courses/{courseId}/promo-codes (only the fields the tests read).
export type PromoCodeListItem = Pick<
  PromoCodeFields,
  | "id"
  | "code"
  | "courseId"
  | "discountPercent"
  | "maxUses"
  | "currentUses"
  | "expiresAt"
  | "isActive"
>;
