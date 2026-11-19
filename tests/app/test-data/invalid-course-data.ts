import { buildCourseData } from "./course-data";
import { expiredToken } from "./invalid-token-data";

// Callers that must not create a course with POST /api/courses.
// `getToken` picks the Authorization token for the case (undefined = no header).
export const nonAdminCreateCourseCallers = [
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
export const nonAdminUpdateCourseCallers = [
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

export const invalidCourseData = [
  {
    id: "API-047",
    title: "title shorter than 3 characters",
    buildPayload: () => buildCourseData({ title: "ab" }),
    status: 400,
    error: "Title must be at least 3 characters",
  },
];
