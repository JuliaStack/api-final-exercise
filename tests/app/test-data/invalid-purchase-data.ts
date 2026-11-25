import { expiredToken } from "./invalid-token-data";

// Callers that must not purchase a course with POST /api/courses/{courseId}/purchase.
// `token` is the Authorization token for the case (undefined = no header).
export const unauthorizedPurchaseCourseCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-122",
    title: "no token",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-123",
    title: "expired token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
  },
];

// Callers that must not read purchases with GET /api/purchases.
// `token` is the Authorization token for the case (undefined = no header).
export const unauthorizedListPurchasesCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-126",
    title: "no token",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-128",
    title: "expired token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
  },
];
