import { buildCourseData, buildUpdateCourseData } from "./course-data";
import type { HiddenResourceCaller, UnauthorizedCaller } from "../types/caller";

// Callers that must not create a course with POST /api/courses.
export const unauthorizedCreateCourseCallers: UnauthorizedCaller[] = [
  {
    id: "API-044",
    title: "anonymous user",
    caller: "anonymous",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-045",
    title: "expired admin token",
    caller: "expiredToken",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-046",
    title: "regular user",
    caller: "regularUser",
    status: 403,
    error: "Forbidden",
  },
];

// Callers that must not update a course with PATCH /api/courses/{courseId}.
export const unauthorizedUpdateCourseCallers: UnauthorizedCaller[] = [
  {
    id: "API-058",
    title: "anonymous user",
    caller: "anonymous",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-059",
    title: "expired admin token",
    caller: "expiredToken",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-060",
    title: "regular user",
    caller: "regularUser",
    status: 403,
    error: "Forbidden",
  },
];

// Callers that must not publish a course with PATCH /api/courses/{courseId}/publish.
export const unauthorizedPublishCourseCallers: UnauthorizedCaller[] = [
  {
    id: "API-067",
    title: "anonymous user",
    caller: "anonymous",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-068",
    title: "expired admin token",
    caller: "expiredToken",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-069",
    title: "regular user",
    caller: "regularUser",
    status: 403,
    error: "Forbidden",
  },
];

// Callers that must not delete a course with DELETE /api/courses/{courseId}.
export const unauthorizedDeleteCourseCallers: UnauthorizedCaller[] = [
  {
    id: "API-072",
    title: "anonymous user",
    caller: "anonymous",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-073",
    title: "expired admin token",
    caller: "expiredToken",
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-074",
    title: "regular user",
    caller: "regularUser",
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
export const unauthorizedListDraftCoursesCallers: HiddenResourceCaller[] = [
  {
    id: "API-034",
    title: "anonymous user",
    caller: "anonymous",
  },
  {
    id: "API-035",
    title: "regular user",
    caller: "regularUser",
  },
  {
    id: "API-036",
    title: "expired admin token",
    caller: "expiredToken",
  },
];

// Callers that must not get a draft course by id from GET /api/courses/{courseId}.
export const unauthorizedGetDraftCourseCallers: HiddenResourceCaller[] = [
  {
    id: "API-050",
    title: "anonymous user",
    caller: "anonymous",
  },
  {
    id: "API-051",
    title: "regular user",
    caller: "regularUser",
  },
  {
    id: "API-052",
    title: "expired admin token",
    caller: "expiredToken",
  },
];
