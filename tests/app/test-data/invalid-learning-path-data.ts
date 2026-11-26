import { buildLearningPathData } from "./learning-path-data";
import type { UnauthorizedCaller } from "../types/caller";

// Callers that must not create a learning path with POST /api/learning-paths.
export const unauthorizedCreateLearningPathCallers: UnauthorizedCaller[] = [
  {
    id: "API-172",
    title: "anonymous user",
    caller: "anonymous",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-173",
    title: "expired admin token",
    caller: "expiredToken",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-174",
    title: "regular user",
    caller: "regularUser",
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
