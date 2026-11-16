import type {
  TokenRequestData,
  RegisterUserData,
  UpdateUserData,
} from "../types/user";
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

  async updateUser(id: string, accessToken: string, data: UpdateUserData) {
    return this.request.patch(`api/admin/users/${id}`, {
      headers: { authorization: `Bearer ${accessToken}` },
      data,
    });
  }
}
