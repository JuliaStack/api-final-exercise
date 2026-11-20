import type { CreatePostData, UpdatePostData } from "../types/post";
import { BaseController } from "./base-controller";

export class PostController extends BaseController {
  async getPosts(accessToken?: string) {
    return this.request.get("api/posts", {
      headers: accessToken
        ? { authorization: `Bearer ${accessToken}` }
        : undefined,
    });
  }

  async createPost(accessToken: string | undefined, data: CreatePostData) {
    return this.request.post("api/posts", {
      headers: accessToken
        ? { authorization: `Bearer ${accessToken}` }
        : undefined,
      data,
    });
  }

  async updatePost(
    id: string,
    accessToken: string | undefined,
    data: UpdatePostData,
  ) {
    return this.request.patch(`api/posts/${id}`, {
      headers: accessToken
        ? { authorization: `Bearer ${accessToken}` }
        : undefined,
      data,
    });
  }

  async deletePost(id: string, accessToken: string | undefined) {
    return this.request.delete(`api/posts/${id}`, {
      headers: accessToken
        ? { authorization: `Bearer ${accessToken}` }
        : undefined,
    });
  }
}
