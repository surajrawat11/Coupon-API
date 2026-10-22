import { Router } from "express";
import { CouponModel } from "./coupon.model.js";
import { createCouponSchema } from "./coupon.validation.js";

const router = Router();

// Create a coupon
router.post("/", async (req, res) => {
  const result = createCouponSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.issues,
    });
  }

  try {
    const coupon = await CouponModel.create({
      ...result.data,
      code: result.data.code.toUpperCase(),
    });

    return res.status(201).json({ coupon });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return res.status(409).json({ error: "Coupon code already exists" });
    }

    console.error("Failed to create coupon:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;