import type {
  CourseListQuery,
  CreateChapterData,
  CreateCourseData,
  PurchaseCourseData,
  UpdateChapterData,
  UpdateCourseData,
} from "../types/course";
import type { ValidatePromoCodeData } from "../types/promo-code";
import { BaseController } from "./base-controller";

export class CourseController extends BaseController {
  async getCourses(params?: CourseListQuery, accessToken?: string) {
    return this.request.get("api/courses", {
      params,
      headers: this.authHeaders(accessToken),
    });
  }

  async getCourse(id: string, accessToken?: string) {
    return this.request.get(`api/courses/${id}`, {
      headers: this.authHeaders(accessToken),
    });
  }

  async createCourse(accessToken: string | undefined, data: CreateCourseData) {
    return this.request.post("api/courses", {
      headers: this.authHeaders(accessToken),
      data,
    });
  }

  async updateCourse(
    id: string,
    accessToken: string | undefined,
    data: UpdateCourseData,
  ) {
    return this.request.patch(`api/courses/${id}`, {
      headers: this.authHeaders(accessToken),
      data,
    });
  }

  async publishCourse(id: string, accessToken: string | undefined) {
    return this.request.patch(`api/courses/${id}/publish`, {
      headers: this.authHeaders(accessToken),
    });
  }

  // The route reads the body with `req.json()`, so a body is always sent (no body → 500).
  async purchaseCourse(
    id: string,
    accessToken: string | undefined,
    data: PurchaseCourseData = {},
  ) {
    return this.request.post(`api/courses/${id}/purchase`, {
      headers: this.authHeaders(accessToken),
      data,
    });
  }

  // The route reads the body with `req.json()`, so a body is always sent (no body → 500).
  async validatePromoCode(
    id: string,
    accessToken: string | undefined,
    data: ValidatePromoCodeData,
  ) {
    return this.request.post(`api/courses/${id}/validate-promo`, {
      headers: this.authHeaders(accessToken),
      data,
    });
  }

  async deleteCourse(id: string, accessToken: string | undefined) {
    return this.request.delete(`api/courses/${id}`, {
      headers: this.authHeaders(accessToken),
    });
  }

  async createChapter(
    courseId: string,
    accessToken: string,
    data: CreateChapterData,
  ) {
    return this.request.post(`api/courses/${courseId}/chapters`, {
      headers: this.authHeaders(accessToken),
      data,
    });
  }

  async updateChapter(
    courseId: string,
    chapterId: string,
    accessToken: string,
    data: UpdateChapterData,
  ) {
    return this.request.patch(`api/courses/${courseId}/chapters/${chapterId}`, {
      headers: this.authHeaders(accessToken),
      data,
    });
  }
}
