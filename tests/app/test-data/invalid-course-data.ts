import { buildCourseData, buildUpdateCourseData } from "./course-data";
import { expiredToken } from "./invalid-token-data";

// Callers that must not create a course with POST /api/courses.
// `getToken` picks the Authorization token for the case (undefined = no header).
export const unauthorizedCreateCourseCallers = [
  {
    id: "API-044",
    title: "anonymous user",
    getToken: (): string | undefined => undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-045",
    title: "expired admin token",
    getToken: (): string | undefined => expiredToken,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-046",
    title: "regular user",
    getToken: (userToken: string): string | undefined => userToken,
    status: 403,
    error: "Forbidden",
  },
];

// Callers that must not update a course with PATCH /api/courses/{courseId}.
export const unauthorizedUpdateCourseCallers = [
  {
    id: "API-058",
    title: "anonymous user",
    getToken: (): string | undefined => undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-059",
    title: "expired admin token",
    getToken: (): string | undefined => expiredToken,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-060",
    title: "regular user",
    getToken: (userToken: string): string | undefined => userToken,
    status: 403,
    error: "Forbidden",
  },
];

// Callers that must not publish a course with PATCH /api/courses/{courseId}/publish.
export const unauthorizedPublishCourseCallers = [
  {
    id: "API-067",
    title: "anonymous user",
    getToken: (): string | undefined => undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-068",
    title: "expired admin token",
    getToken: (): string | undefined => expiredToken,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-069",
    title: "regular user",
    getToken: (userToken: string): string | undefined => userToken,
    status: 403,
    error: "Forbidden",
  },
];

// Callers that must not delete a course with DELETE /api/courses/{courseId}.
export const unauthorizedDeleteCourseCallers = [
  {
    id: "API-072",
    title: "anonymous user",
    getToken: (): string | undefined => undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-073",
    title: "expired admin token",
    getToken: (): string | undefined => expiredToken,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-074",
    title: "regular user",
    getToken: (userToken: string): string | undefined => userToken,
    status: 403,
    error: "Forbidden",
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
// `getToken` picks the Authorization token for the case (undefined = no header).
export const unauthorizedListDraftCoursesCallers = [
  {
    id: "API-034",
    title: "anonymous",
    getToken: (): string | undefined => undefined,
  },
  {
    id: "API-035",
    title: "regular user",
    getToken: (userToken: string): string | undefined => userToken,
  },
  {
    id: "API-036",
    title: "expired admin token",
    getToken: (): string | undefined => expiredToken,
  },
];

// Callers that must not get a draft course by id from GET /api/courses/{courseId}.
export const unauthorizedGetDraftCourseCallers = [
  {
    id: "API-050",
    title: "anonymous user",
    getToken: (): string | undefined => undefined,
  },
  {
    id: "API-051",
    title: "regular user",
    getToken: (userToken: string): string | undefined => userToken,
  },
  {
    id: "API-052",
    title: "expired admin token",
    getToken: (): string | undefined => expiredToken,
  },
];
