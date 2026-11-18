import { expiredToken } from "./invalid-token-data";

// Callers that must not see unpublished courses in GET /api/courses.
// `getToken` picks the Authorization token for the case (undefined = no header).
export const hiddenDraftCallers = [
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
