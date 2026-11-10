import type { RegisterUserData } from "../types/user";
import { BaseController } from "./base-controller";

export class UserController extends BaseController {
  async registerUser(data: Partial<RegisterUserData>) {
    return this.request.post("api/auth/register", { data });
  }
}
