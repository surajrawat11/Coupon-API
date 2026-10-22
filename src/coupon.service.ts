
import { CouponModel } from "./coupon.model.js";
import type {
  ApplyCouponInput,
  CreateCouponInput,
} from "./coupon.validation.js";
import { roundToPaisa } from "./money.js";

export async function createCoupon(input: CreateCouponInput) {
  return CouponModel.create({
    ...input,
    code: input.code.toUpperCase(),
  });
}

export async function applyCoupon(input: ApplyCouponInput) {
  const coupon = await CouponModel.findOne({
    code: input.code.toUpperCase(),
  });

  if (!coupon) {
    throw Object.assign(new Error("Coupon not found"), {
      statusCode: 404,
      code: "COUPON_NOT_FOUND",
    });
  }

  if (coupon.expiresAt.getTime() <= Date.now()) {
    throw Object.assign(new Error("Coupon has expired"), {
      statusCode: 410,
      code: "COUPON_EXPIRED",
    });
  }

  const amountInPaise = Math.round(input.amount * 100);
  const discountInPaise = Math.round(
    (amountInPaise * coupon.discountPercent) / 100
  );

  const discount = discountInPaise / 100;
  const finalAmount = roundToPaisa(
    (amountInPaise - discountInPaise) / 100
  );

  return {
    code: coupon.code,
    discountPercent: coupon.discountPercent,
    originalAmount: roundToPaisa(amountInPaise / 100),
    discount,
    finalAmount,
  };
}
