import type {
  CourseListQuery,
  CreateCourseData,
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

  async createCourse(accessToken: string | undefined, data: CreateCourseData) {
    return this.request.post("api/courses", {
      headers: accessToken
        ? { authorization: `Bearer ${accessToken}` }
        : undefined,
      data,
    });
  }

  async updateCourse(id: string, accessToken: string, data: UpdateCourseData) {
    return this.request.patch(`api/courses/${id}`, {
      headers: { authorization: `Bearer ${accessToken}` },
      data,
    });
  }

  async deleteCourse(id: string, accessToken: string) {
    return this.request.delete(`api/courses/${id}`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
  }
}
