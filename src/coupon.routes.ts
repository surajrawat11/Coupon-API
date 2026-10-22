
import { Router } from "express";
import { CouponModel } from "./coupon.model.js";
import { applyCoupon, createCoupon } from "./coupon.service.js";
import {
  applyCouponSchema,
  createCouponSchema,
} from "./coupon.validation.js";

const router = Router();

// Create a coupon
router.post("/", async (req, res) => {
  const result = createCouponSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues
          .map((issue) => issue.message)
          .join(", "),
      },
    });
  }

  try {
    const coupon = await createCoupon(result.data);
    return res.status(201).json({ coupon });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return res.status(409).json({
        error: {
          code: "COUPON_ALREADY_EXISTS",
          message: "A coupon with this code already exists",
        },
      });
    }

    console.error("Failed to create coupon:", error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
});

// List coupons, newest first
router.get("/", async (_req, res) => {
  try {
    const coupons = await CouponModel.find()
      .sort({ createdAt: -1 })
      .lean();

    const now = Date.now();

    const results = coupons.map((coupon) => ({
      ...coupon,
      expired: new Date(coupon.expiresAt).getTime() <= now,
    }));

    return res.status(200).json({ coupons: results });
  } catch (error: unknown) {
    console.error("Failed to list coupons:", error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
});

// Apply a coupon
router.post("/apply", async (req, res) => {
  const result = applyCouponSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues
          .map((issue) => issue.message)
          .join(", "),
      },
    });
  }

  try {
    const applied = await applyCoupon(result.data);
    return res.status(200).json(applied);
  } catch (error: unknown) {
    if (error instanceof Error && "statusCode" in error && "code" in error) {
      const statusCode = error.statusCode;
      const errorCode = error.code;

      if (
        typeof statusCode === "number" &&
        (statusCode === 404 || statusCode === 410) &&
        typeof errorCode === "string"
      ) {
        return res.status(statusCode).json({
          error: {
            code: errorCode,
            message: error.message,
          },
        });
      }
    }

    console.error("Failed to apply coupon:", error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
});

export default router;
