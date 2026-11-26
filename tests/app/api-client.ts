import type { APIRequestContext } from "@playwright/test";
import { CategoryController } from "./controllers/category-controller";
import { CourseController } from "./controllers/course-controller";
import { LearningPathController } from "./controllers/learning-path-controller";
import { PostController } from "./controllers/post-controller";
import { PromoCodeController } from "./controllers/promo-code-controller";
import { PurchaseController } from "./controllers/purchase-controller";
import { TagController } from "./controllers/tag-controller";
import { UserController } from "./controllers/user-controller";
import { YoutubeVideoController } from "./controllers/youtube-video-controller";

// Single entry point to the API: one controller per resource, all sharing one
// request context. Whether a request throws on non-2xx depends on that context
// (see the `apiClient` and `rawApiClient` fixtures).
export class ApiClient {
  readonly users: UserController;
  readonly courses: CourseController;
  readonly categories: CategoryController;
  readonly purchases: PurchaseController;
  readonly tags: TagController;
  readonly posts: PostController;
  readonly promoCodes: PromoCodeController;
  readonly learningPaths: LearningPathController;
  readonly youtubeVideos: YoutubeVideoController;

  constructor(request: APIRequestContext) {
    this.users = new UserController(request);
    this.courses = new CourseController(request);
    this.categories = new CategoryController(request);
    this.purchases = new PurchaseController(request);
    this.tags = new TagController(request);
    this.posts = new PostController(request);
    this.promoCodes = new PromoCodeController(request);
    this.learningPaths = new LearningPathController(request);
    this.youtubeVideos = new YoutubeVideoController(request);
  }
}
