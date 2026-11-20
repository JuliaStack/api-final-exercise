import type { CreateCategoryData } from "../types/course";
import { BaseController } from "./base-controller";

export class CategoryController extends BaseController {
  async createCategory(accessToken: string, data: CreateCategoryData) {
    return this.request.post("api/categories", {
      headers: this.authHeaders(accessToken),
      data,
    });
  }

  async deleteCategory(id: string, accessToken: string) {
    return this.request.delete(`api/categories/${id}`, {
      headers: this.authHeaders(accessToken),
    });
  }
}
