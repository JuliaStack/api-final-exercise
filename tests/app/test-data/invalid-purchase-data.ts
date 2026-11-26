import type { UnauthorizedCaller } from "../types/caller";

// Callers that must not purchase a course with POST /api/courses/{courseId}/purchase.
export const unauthorizedPurchaseCourseCallers: UnauthorizedCaller[] = [
  {
    id: "API-122",
    title: "no token",
    caller: "anonymous",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-123",
    title: "expired token",
    caller: "expiredToken",
    status: 401,
    error: "Unauthorized",
  },
];

// Callers that must not read purchases with GET /api/purchases.
export const unauthorizedListPurchasesCallers: UnauthorizedCaller[] = [
  {
    id: "API-126",
    title: "no token",
    caller: "anonymous",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-128",
    title: "expired token",
    caller: "expiredToken",
    status: 401,
    error: "Unauthorized",
  },
];
