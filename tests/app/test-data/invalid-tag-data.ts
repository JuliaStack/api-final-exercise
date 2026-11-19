import { buildTagData } from "./tag-data";
import { expiredToken } from "./invalid-token-data";
import type { CreatedTag } from "../types/tag";

// Callers that must not create a tag with POST /api/tags.
// `getToken` picks the Authorization token for the case (undefined = no header).
export const nonAdminCreateTagCallers = [
  {
    id: "API-079",
    title: "anonymous user",
    getToken: (): string | undefined => undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-080",
    title: "expired admin token",
    getToken: (): string | undefined => expiredToken,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-081",
    title: "regular user",
    getToken: (userToken: string): string | undefined => userToken,
    status: 403,
    error: "Forbidden",
  },
];

// Names whose slug equals the slug of an already existing tag.
export const duplicateTagNameData = [
  {
    id: "API-082",
    title: "name of an existing tag",
    buildName: (tag: CreatedTag) => tag.name,
    status: 409,
    error: "Tag already exists",
  },
  {
    id: "API-083",
    title: "name of an existing tag in upper case",
    buildName: (tag: CreatedTag) => tag.name.toUpperCase(),
    status: 409,
    error: "Tag already exists",
  },
];

export const invalidTagData = [
  {
    id: "API-084",
    title: "name shorter than 2 characters",
    buildPayload: () => buildTagData({ name: "a" }),
    status: 400,
    error: "Name must be at least 2 characters",
  },
  {
    id: "API-085",
    title: "missing name",
    buildPayload: () => buildTagData({ name: undefined }),
    status: 400,
    error: "Name must be at least 2 characters",
  },
];
