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

  // Flips `isActive`; the route looks the promo code up by id only.
  async togglePromoCode(
    courseId: string,
    promoCodeId: string,
    accessToken: string | undefined,
  ) {
    return this.request.patch(
      `api/admin/courses/${courseId}/promo-codes/${promoCodeId}`,
      { headers: this.authHeaders(accessToken) },
    );
  }

  // Deletes by promo code id only; the route ignores `courseId`.
  async deletePromoCode(
    courseId: string,
    promoCodeId: string,
    accessToken: string | undefined,
  ) {
    return this.request.delete(
      `api/admin/courses/${courseId}/promo-codes/${promoCodeId}`,
      { headers: this.authHeaders(accessToken) },
    );
  }
}
