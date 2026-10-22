
import { Router } from "express";
import { createCoupon } from "./coupon.service.js";
import { createCouponSchema } from "./coupon.validation.js";

const router = Router();

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

export default router;
