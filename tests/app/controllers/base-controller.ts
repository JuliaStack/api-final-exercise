import type { APIRequestContext } from "@playwright/test";

export class BaseController {
  constructor(protected readonly request: APIRequestContext) {}

  // Authorization header for the request; no header when there is no token.
  protected authHeaders(accessToken?: string) {
    return accessToken ? { authorization: `Bearer ${accessToken}` } : undefined;
  }
}
