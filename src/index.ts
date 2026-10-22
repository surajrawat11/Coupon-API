import express from "express";
import { config } from "./config.js";
import { connectDB } from "./db.js";
import couponRoutes from "./coupon.routes.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/coupons", couponRoutes);

async function startServer(): Promise<void> {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`Coupon API listening on port ${config.port}`);
  });
}

startServer().catch((error: unknown) => {
  console.error("Failed to start Coupon API:", error);
  process.exitCode = 1;
});