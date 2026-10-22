
import mongoose, { Schema, type InferSchemaType } from "mongoose";

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 32,
      match: /^[A-Z0-9_-]+$/,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 90,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export type Coupon = InferSchemaType<typeof couponSchema>;

export const CouponModel = mongoose.model("Coupon", couponSchema);
