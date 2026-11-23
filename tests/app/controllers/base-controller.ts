import type { APIRequestContext } from "@playwright/test";

export class BaseController {
  constructor(protected readonly request: APIRequestContext) {}

  // Authorization header for the request; no header only when the token is
  // undefined (an empty string is still sent, as `Bearer `).
  protected authHeaders(accessToken?: string) {
    return accessToken === undefined
      ? undefined
      : { authorization: `Bearer ${accessToken}` };
  }
}
