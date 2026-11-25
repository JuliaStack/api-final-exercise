import { BaseController } from "./base-controller";

export class YoutubeVideoController extends BaseController {
  async getVideos() {
    return this.request.get("api/youtube-videos");
  }

  async deleteVideo(id: string, accessToken: string | undefined) {
    return this.request.delete(`api/youtube-videos/${id}`, {
      headers: this.authHeaders(accessToken),
    });
  }
}
