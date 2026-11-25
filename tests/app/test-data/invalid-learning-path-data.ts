import { buildLearningPathData } from "./learning-path-data";
import { expiredToken } from "./invalid-token-data";

// Callers that must not create a learning path with POST /api/learning-paths.
// `token` is the Authorization token for the case (undefined = no header).
// The regular user (403) is a standalone test: it needs the `userToken` fixture.
export const unauthorizedCreateLearningPathCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-172",
    title: "anonymous user",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-173",
    title: "expired admin token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
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
