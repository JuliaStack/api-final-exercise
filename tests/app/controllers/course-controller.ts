import type {
  CourseListQuery,
  CreateChapterData,
  CreateCourseData,
  UpdateChapterData,
  UpdateCourseData,
} from "../types/course";
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
