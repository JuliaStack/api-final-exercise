import { buildPostData } from "./post-data";
import type { UnauthorizedCaller } from "../types/caller";

// Callers that must not create a post with POST /api/posts.
export const unauthorizedCreatePostCallers: UnauthorizedCaller[] = [
  {
    id: "API-093",
    title: "anonymous user",
    caller: "anonymous",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-094",
    title: "expired admin token",
    caller: "expiredToken",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-095",
    title: "regular user",
    caller: "regularUser",
    status: 403,
    error: "Forbidden",
  },
];

// Callers that must not update a post with PATCH /api/posts/{postId}.
export const unauthorizedUpdatePostCallers: UnauthorizedCaller[] = [
  {
    id: "API-107",
    title: "anonymous user",
    caller: "anonymous",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-108",
    title: "expired admin token",
    caller: "expiredToken",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-109",
    title: "regular user",
    caller: "regularUser",
    status: 403,
    error: "Forbidden",
  },
];

// Callers that must not delete a post with DELETE /api/posts/{postId}.
export const unauthorizedDeletePostCallers: UnauthorizedCaller[] = [
  {
    id: "API-111",
    title: "anonymous user",
    caller: "anonymous",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-112",
    title: "expired admin token",
    caller: "expiredToken",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-113",
    title: "regular user",
    caller: "regularUser",
    status: 403,
    error: "Forbidden",
  },
];

export const invalidPostData = [
  {
    id: "API-096",
    title: "title shorter than 3 characters",
    buildPayload: () => buildPostData({ title: "ab", isPublished: true }),
    status: 400,
    error: "Title must be at least 3 characters",
  },
  {
    id: "API-097",
    title: "missing title",
    buildPayload: () => buildPostData({ title: undefined, isPublished: true }),
    status: 400,
    error: "Title must be at least 3 characters",
  },
];
