import { buildPostData } from "./post-data";
import { expiredToken } from "./invalid-token-data";

// Callers that must not create a post with POST /api/posts.
// `token` is the Authorization token for the case (undefined = no header).
// The regular user (403) is a standalone test: it needs the `userToken` fixture.
export const unauthorizedCreatePostCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-093",
    title: "anonymous user",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-094",
    title: "expired admin token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
  },
];

// Callers that must not update a post with PATCH /api/posts/{postId}.
// `token` is the Authorization token for the case (undefined = no header).
// The regular user (403) is a standalone test: it needs the `userToken` fixture.
export const unauthorizedUpdatePostCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-107",
    title: "anonymous user",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-108",
    title: "expired admin token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
  },
];

// Callers that must not delete a post with DELETE /api/posts/{postId}.
// `token` is the Authorization token for the case (undefined = no header).
// The regular user (403) is a standalone test: it needs the `userToken` fixture.
export const unauthorizedDeletePostCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-111",
    title: "anonymous user",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-112",
    title: "expired admin token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
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
