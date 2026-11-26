import { buildPromoCodeData } from "./promo-code-data";
import type { UnauthorizedCaller } from "../types/caller";

// Callers rejected by POST /api/admin/courses/{courseId}/promo-codes.
export const unauthorizedCreatePromoCodeCallers: UnauthorizedCaller[] = [
  {
    id: "API-131",
    title: "anonymous user",
    caller: "anonymous",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-132",
    title: "expired admin token",
    caller: "expiredToken",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-133",
    title: "regular user",
    caller: "regularUser",
    status: 403,
    error: "Forbidden",
  },
];

// Callers rejected by PATCH /api/admin/courses/{courseId}/promo-codes/{promoCodeId}.
export const unauthorizedTogglePromoCodeCallers: UnauthorizedCaller[] = [
  {
    id: "API-150",
    title: "anonymous user",
    caller: "anonymous",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-151",
    title: "expired admin token",
    caller: "expiredToken",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-152",
    title: "regular user",
    caller: "regularUser",
    status: 403,
    error: "Forbidden",
  },
];

// Callers rejected by DELETE /api/admin/courses/{courseId}/promo-codes/{promoCodeId}.
export const unauthorizedDeletePromoCodeCallers: UnauthorizedCaller[] = [
  {
    id: "API-156",
    title: "anonymous user",
    caller: "anonymous",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-157",
    title: "expired admin token",
    caller: "expiredToken",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-158",
    title: "regular user",
    caller: "regularUser",
    status: 403,
    error: "Forbidden",
  },
];

// Each case breaks exactly one field, because the API returns only the first validation error.
export const invalidPromoCodeData = [
  {
    id: "API-136",
    title: "code with a space and a special character",
    buildPayload: () => buildPromoCodeData({ code: "SUMMER 50!" }),
    status: 400,
    error: "Code may only contain uppercase letters, digits, and hyphens",
  },
  {
    id: "API-137",
    title: "discount above 100%",
    buildPayload: () => buildPromoCodeData({ discountPercent: 101 }),
    status: 400,
    error: "Discount cannot exceed 100%",
  },
  {
    id: "API-138",
    title: "expiration date in the past",
    buildPayload: () =>
      buildPromoCodeData({
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      }),
    status: 400,
    error: "Expiration date must be in the future",
  },
];

// Callers rejected with 401 by POST /api/courses/{courseId}/validate-promo.
export const unauthorizedValidatePromoCodeCallers: UnauthorizedCaller[] = [
  {
    id: "API-145",
    title: "no token",
    caller: "anonymous",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-146",
    title: "expired token",
    caller: "expiredToken",
    status: 401,
    error: "Unauthorized",
  },
];
