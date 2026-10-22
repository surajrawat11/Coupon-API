import { CouponModel } from "./coupon.model.js";
import type { CreateCouponInput } from "./coupon.validation.js";

export async function createCoupon(input: CreateCouponInput) {
  return CouponModel.create({
    ...input,
    code: input.code.toUpperCase(),
  });
}