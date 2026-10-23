
import { z } from "zod";

export const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Coupon code must be at least 3 characters")
    .max(32, "Coupon code must be 32 characters or fewer")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Coupon code may contain only letters, numbers, hyphens, and underscores"
    ),

  discountPercent: z
    .number({
      error: "Discount percent must be a number",
    })
    .min(1, "Discount percent must be at least 1")
    .max(90, "Discount percent cannot exceed 90"),

  expiresAt: z
    .iso.datetime({
      message: "Expiry must be a valid ISO 8601 date-time",
    })
    .refine(
      (value) => new Date(value).getTime() > Date.now(),
      "Expiry date must be in the future"
    ),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;

export const applyCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Coupon code must be at least 3 characters")
    .max(32, "Coupon code must be 32 characters or fewer")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Coupon code contains invalid characters"
    ),

  amount: z
    .number({
      error: "Amount must be a number",
    })
    .finite("Amount must be finite")
    .min(0, "Amount cannot be negative")
    .refine(
      (value) =>
        Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
      "Amount must have at most two decimal places"
    ),
});

export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
