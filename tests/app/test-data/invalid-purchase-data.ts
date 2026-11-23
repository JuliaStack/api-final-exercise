import { expiredToken } from "./invalid-token-data";

// Callers that must not purchase a course with POST /api/courses/{courseId}/purchase.
// `getToken` picks the Authorization token for the case (undefined = no header).
export const unauthenticatedPurchaseCallers = [
  {
    id: "API-122",
    title: "anonymous user",
    getToken: (): string | undefined => undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-123",
    title: "expired token",
    getToken: (): string | undefined => expiredToken,
    status: 401,
    error: "Unauthorized",
  },
];

// Callers that must not read purchases with GET /api/purchases.
// `getToken` picks the Authorization token for the case
// (undefined = no header, "" = header `Bearer ` without a token).
export const unauthenticatedPurchasesListCallers = [
  {
    id: "API-126",
    title: "anonymous user",
    getToken: (): string | undefined => undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-127",
    title: "empty token",
    getToken: (): string | undefined => "",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-128",
    title: "expired token",
    getToken: (): string | undefined => expiredToken,
    status: 401,
    error: "Unauthorized",
  },
];
