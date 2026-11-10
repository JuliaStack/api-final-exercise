import type { APIRequestContext } from "@playwright/test";

export class BaseController {
  constructor(protected readonly request: APIRequestContext) {}
}
