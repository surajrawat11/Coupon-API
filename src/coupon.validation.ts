import { z } from "zod";

export const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Coupon code is required")
    .max(50, "Coupon code must be 50 characters or fewer")
    .regex(/^[A-Za-z0-9_-]+$/, "Coupon code contains invalid characters"),

  discountType: z.enum(["percentage", "fixed"]),

  discountValue: z.number().positive("Discount value must be greater than zero"),

  expiryDate: z.coerce.date(),

  isActive: z.boolean().optional().default(true),
}).superRefine((coupon, ctx) => {
  if (coupon.discountType === "percentage" && coupon.discountValue > 100) {
    ctx.addIssue({
      code: "custom",
      path: ["discountValue"],
      message: "Percentage discount cannot exceed 100",
    });
  }

  if (Number.isNaN(coupon.expiryDate.getTime())) {
    ctx.addIssue({
      code: "custom",
      path: ["expiryDate"],
      message: "Expiry date must be a valid date",
    });
  }
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;