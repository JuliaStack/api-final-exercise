import type { CreatePromoCodeData } from "../types/promo-code";
import { BaseController } from "./base-controller";

export class PromoCodeController extends BaseController {
  async createPromoCode(
    courseId: string,
    accessToken: string | undefined,
    data: CreatePromoCodeData,
  ) {
    return this.request.post(`api/admin/courses/${courseId}/promo-codes`, {
      headers: this.authHeaders(accessToken),
      data,
    });
  }

  async getPromoCodes(courseId: string, accessToken: string | undefined) {
    return this.request.get(`api/admin/courses/${courseId}/promo-codes`, {
      headers: this.authHeaders(accessToken),
    });
  }
}
