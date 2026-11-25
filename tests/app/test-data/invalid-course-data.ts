import { buildCourseData, buildUpdateCourseData } from "./course-data";
import { expiredToken } from "./invalid-token-data";

// Callers that must not create a course with POST /api/courses.
// `token` is the Authorization token for the case (undefined = no header).
// The regular user (403) is a standalone test: it needs the `userToken` fixture.
export const unauthorizedCreateCourseCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-044",
    title: "anonymous user",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-045",
    title: "expired admin token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
  },
];

// Callers that must not update a course with PATCH /api/courses/{courseId}.
// `token` is the Authorization token for the case (undefined = no header).
// The regular user (403) is a standalone test: it needs the `userToken` fixture.
export const unauthorizedUpdateCourseCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-058",
    title: "anonymous user",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-059",
    title: "expired admin token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
  },
];

// Callers that must not publish a course with PATCH /api/courses/{courseId}/publish.
// `token` is the Authorization token for the case (undefined = no header).
// The regular user (403) is a standalone test: it needs the `userToken` fixture.
export const unauthorizedPublishCourseCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-067",
    title: "anonymous user",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-068",
    title: "expired admin token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
  },
];

// Callers that must not delete a course with DELETE /api/courses/{courseId}.
// `token` is the Authorization token for the case (undefined = no header).
// The regular user (403) is a standalone test: it needs the `userToken` fixture.
export const unauthorizedDeleteCourseCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-072",
    title: "anonymous user",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-073",
    title: "expired admin token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
  },
];

// Courses with one required content field left empty (a fresh course has them all null).
export const incompleteCourseData = [
  {
    id: "API-063",
    title: "course without a description",
    buildPayload: () => buildUpdateCourseData({ description: undefined }),
    status: 400,
    error: "Missing required fields (title, description, image, price)",
  },
  {
    id: "API-064",
    title: "course without an image",
    buildPayload: () => buildUpdateCourseData({ imageUrl: undefined }),
    status: 400,
    error: "Missing required fields (title, description, image, price)",
  },
  {
    id: "API-065",
    title: "course without a price",
    buildPayload: () => buildUpdateCourseData({ price: undefined }),
    status: 400,
    error: "Missing required fields (title, description, image, price)",
  },
];

export const invalidCourseData = [
  {
    id: "API-047",
    title: "title shorter than 3 characters",
    buildPayload: () => buildCourseData({ title: "ab" }),
    status: 400,
    error: "Title must be at least 3 characters",
  },
];

// Callers that must not see unpublished courses in GET /api/courses.
// `token` is the Authorization token for the case (undefined = no header).
// The regular user is a standalone test: it needs the `userToken` fixture.
export const unauthorizedListDraftCoursesCallers: {
  id: string;
  title: string;
  token: string | undefined;
}[] = [
  {
    id: "API-034",
    title: "anonymous user",
    token: undefined,
  },
  {
    id: "API-036",
    title: "expired admin token",
    token: expiredToken,
  },
];

// Callers that must not get a draft course by id from GET /api/courses/{courseId}.
// `token` is the Authorization token for the case (undefined = no header).
// The regular user is a standalone test: it needs the `userToken` fixture.
export const unauthorizedGetDraftCourseCallers: {
  id: string;
  title: string;
  token: string | undefined;
}[] = [
  {
    id: "API-050",
    title: "anonymous user",
    token: undefined,
  },
  {
    id: "API-052",
    title: "expired admin token",
    token: expiredToken,
  },
];
