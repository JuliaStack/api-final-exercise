import { buildPromoCodeData } from "./promo-code-data";
import { expiredToken } from "./invalid-token-data";

// Callers rejected with 401 by POST /api/admin/courses/{courseId}/promo-codes.
// `token` is the Authorization token for the case (undefined = no header).
// The regular user (403) is a standalone test: it needs the `userToken` fixture.
export const unauthorizedCreatePromoCodeCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-131",
    title: "anonymous user",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-132",
    title: "expired admin token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
  },
];

// Callers rejected with 401 by PATCH /api/admin/courses/{courseId}/promo-codes/{promoCodeId}.
// `token` is the Authorization token for the case (undefined = no header).
// The regular user (403) is a standalone test: it needs the `userToken` fixture.
export const unauthorizedTogglePromoCodeCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-150",
    title: "anonymous user",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-151",
    title: "expired admin token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
  },
];

// Callers rejected with 401 by DELETE /api/admin/courses/{courseId}/promo-codes/{promoCodeId}.
// `token` is the Authorization token for the case (undefined = no header).
// The regular user (403) is a standalone test: it needs the `userToken` fixture.
export const unauthorizedDeletePromoCodeCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-156",
    title: "anonymous user",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-157",
    title: "expired admin token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
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
// `token` is the Authorization token for the case (undefined = no header).
export const unauthorizedValidatePromoCodeCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-145",
    title: "no token",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-146",
    title: "expired token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
  },
];
