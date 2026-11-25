import { buildLearningPathData } from "./learning-path-data";
import { expiredToken } from "./invalid-token-data";

// Callers that must not create a learning path with POST /api/learning-paths.
// `getToken` picks the Authorization token for the case (undefined = no header).
export const unauthorizedCreateLearningPathCallers = [
  {
    id: "API-172",
    title: "anonymous user",
    getToken: (): string | undefined => undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-173",
    title: "expired admin token",
    getToken: (): string | undefined => expiredToken,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-174",
    title: "regular user",
    getToken: (userToken: string): string | undefined => userToken,
    status: 403,
    error: "Forbidden",
  },
];

export const invalidLearningPathData = [
  {
    id: "API-175",
    title: "title shorter than 3 characters",
    buildPayload: () => buildLearningPathData({ title: "ab" }),
    status: 400,
    error: "Title must be at least 3 characters",
  },
  {
    id: "API-176",
    title: "missing instructor",
    buildPayload: () => buildLearningPathData({ instructor: undefined }),
    status: 400,
    error: "Instructor is required with at least a name",
  },
];
