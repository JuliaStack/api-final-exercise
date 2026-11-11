import type { TokenRequestData, RegisterUserData } from "../types/user";
import { BaseController } from "./base-controller";

export class UserController extends BaseController {
  async registerUser(data: Partial<RegisterUserData>) {
    return this.request.post("api/auth/register", { data });
  }

  async getToken(data: Partial<TokenRequestData>) {
    return this.request.post("api/oauth/token", { data });
  }

  async getUserInfo(accessToken: string) {
    return this.request.get("api/oauth/userinfo", {
      headers: { authorization: `Bearer ${accessToken}` },
    });
  }
}
