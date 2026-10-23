
import { describe, expect, it } from "vitest";
import {
  applyCouponSchema,
  createCouponSchema,
} from "./coupon.validation.js";

describe("createCouponSchema", () => {
  const validCoupon = {
    code: "SAVE10",
    discountPercent: 10,
    expiresAt: "2099-12-31T23:59:59.000Z",
  };

  it("accepts valid coupon input", () => {
    expect(createCouponSchema.safeParse(validCoupon).success).toBe(true);
  });

  it("trims and accepts coupon codes with allowed characters", () => {
    const result = createCouponSchema.safeParse({
      ...validCoupon,
      code: " save-10_ ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("save-10_");
    }
  });

  it("rejects discounts above 90", () => {
    expect(
      createCouponSchema.safeParse({
        ...validCoupon,
        discountPercent: 91,
      }).success
    ).toBe(false);
  });

  it("rejects discounts below 1", () => {
    expect(
      createCouponSchema.safeParse({
        ...validCoupon,
        discountPercent: 0,
      }).success
    ).toBe(false);
  });

  it("rejects invalid coupon code characters", () => {
    expect(
      createCouponSchema.safeParse({
        ...validCoupon,
        code: "SAVE 10",
      }).success
    ).toBe(false);
  });

  it("rejects an expiry date in the past", () => {
    expect(
      createCouponSchema.safeParse({
        ...validCoupon,
        expiresAt: "2020-01-01T00:00:00.000Z",
      }).success
    ).toBe(false);
  });
});

describe("applyCouponSchema", () => {
  const validApplication = {
    code: "SAVE10",
    amount: 100,
  };

  it("accepts a valid application", () => {
    expect(applyCouponSchema.safeParse(validApplication).success).toBe(true);
  });

  it("rejects negative amounts", () => {
    expect(
      applyCouponSchema.safeParse({
        ...validApplication,
        amount: -1,
      }).success
    ).toBe(false);
  });

  it("rejects amount supplied as a string", () => {
    expect(
      applyCouponSchema.safeParse({
        ...validApplication,
        amount: "100",
      }).success
    ).toBe(false);
  });

  it("rejects non-finite amounts", () => {
    expect(
      applyCouponSchema.safeParse({
        ...validApplication,
        amount: Number.POSITIVE_INFINITY,
      }).success
    ).toBe(false);
  });

  it("accepts zero amount", () => {
    expect(
      applyCouponSchema.safeParse({
        ...validApplication,
        amount: 0,
      }).success
    ).toBe(true);
  });

  it("accepts amounts with two decimal places", () => {
    expect(
      applyCouponSchema.safeParse({
        ...validApplication,
        amount: 99.99,
      }).success
    ).toBe(true);
  });

  it("rejects amounts with more than two decimal places", () => {
    expect(
      applyCouponSchema.safeParse({
        ...validApplication,
        amount: 10.126,
      }).success
    ).toBe(false);
  });
});

