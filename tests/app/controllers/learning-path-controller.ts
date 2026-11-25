import type { CreateLearningPathData } from "../types/learning-path";
import { BaseController } from "./base-controller";

export class LearningPathController extends BaseController {
  async createLearningPath(
    accessToken: string | undefined,
    data: CreateLearningPathData,
  ) {
    return this.request.post("api/learning-paths", {
      headers: this.authHeaders(accessToken),
      data,
    });
  }
}
