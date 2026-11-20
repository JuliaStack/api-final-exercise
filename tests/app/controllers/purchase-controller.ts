import { BaseController } from "./base-controller";

export class PurchaseController extends BaseController {
  async getPurchases(accessToken?: string) {
    return this.request.get("api/purchases", {
      headers: this.authHeaders(accessToken),
    });
  }
}
