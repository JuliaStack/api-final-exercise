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
      headers: accessToken
        ? { authorization: `Bearer ${accessToken}` }
        : undefined,
    });
  }

  async getCourse(id: string, accessToken?: string) {
    return this.request.get(`api/courses/${id}`, {
      headers: accessToken
        ? { authorization: `Bearer ${accessToken}` }
        : undefined,
    });
  }

  async createCourse(accessToken: string | undefined, data: CreateCourseData) {
    return this.request.post("api/courses", {
      headers: accessToken
        ? { authorization: `Bearer ${accessToken}` }
        : undefined,
      data,
    });
  }

  async updateCourse(
    id: string,
    accessToken: string | undefined,
    data: UpdateCourseData,
  ) {
    return this.request.patch(`api/courses/${id}`, {
      headers: accessToken
        ? { authorization: `Bearer ${accessToken}` }
        : undefined,
      data,
    });
  }

  async deleteCourse(id: string, accessToken: string) {
    return this.request.delete(`api/courses/${id}`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
  }

  async createChapter(
    courseId: string,
    accessToken: string,
    data: CreateChapterData,
  ) {
    return this.request.post(`api/courses/${courseId}/chapters`, {
      headers: { authorization: `Bearer ${accessToken}` },
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
      headers: { authorization: `Bearer ${accessToken}` },
      data,
    });
  }
}
