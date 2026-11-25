import { buildTagData } from "./tag-data";
import { expiredToken } from "./invalid-token-data";
import type { CreatedTag } from "../types/tag";

// Callers that must not create a tag with POST /api/tags.
// `token` is the Authorization token for the case (undefined = no header).
// The regular user (403) is a standalone test: it needs the `userToken` fixture.
export const unauthorizedCreateTagCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-079",
    title: "anonymous user",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-080",
    title: "expired admin token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
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

// Callers that must not delete a tag with DELETE /api/tags/{tagId}.
// `token` is the Authorization token for the case (undefined = no header).
// The regular user (403) is a standalone test: it needs the `userToken` fixture.
export const unauthorizedDeleteTagCallers: {
  id: string;
  title: string;
  token: string | undefined;
  status: number;
  error: string;
}[] = [
  {
    id: "API-087",
    title: "anonymous user",
    token: undefined,
    status: 401,
    error: "Unauthorized",
  },
  {
    id: "API-088",
    title: "expired admin token",
    token: expiredToken,
    status: 401,
    error: "Unauthorized",
  },
];
