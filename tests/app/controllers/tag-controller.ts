import type { CreateTagData } from "../types/tag";
import { BaseController } from "./base-controller";

export class TagController extends BaseController {
  async getTags(accessToken?: string) {
    return this.request.get("api/tags", {
      headers: accessToken
        ? { authorization: `Bearer ${accessToken}` }
        : undefined,
    });
  }

  async createTag(accessToken: string, data: CreateTagData) {
    return this.request.post("api/tags", {
      headers: { authorization: `Bearer ${accessToken}` },
      data,
    });
  }

  async deleteTag(id: string, accessToken: string) {
    return this.request.delete(`api/tags/${id}`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
  }
}
