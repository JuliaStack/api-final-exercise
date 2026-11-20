import type { CreateTagData } from "../types/tag";
import { BaseController } from "./base-controller";

export class TagController extends BaseController {
  async getTags(accessToken?: string) {
    return this.request.get("api/tags", {
      headers: this.authHeaders(accessToken),
    });
  }

  async createTag(accessToken: string | undefined, data: CreateTagData) {
    return this.request.post("api/tags", {
      headers: this.authHeaders(accessToken),
      data,
    });
  }

  async deleteTag(id: string, accessToken: string | undefined) {
    return this.request.delete(`api/tags/${id}`, {
      headers: this.authHeaders(accessToken),
    });
  }
}
