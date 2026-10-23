
import express, { type ErrorRequestHandler } from "express";
import swaggerUi from "swagger-ui-express";
import { config } from "./config.js";
import { connectDB } from "./db.js";
import couponRoutes from "./coupon.routes.js";
import openapi from "./openapi.js";

const app = express();

app.use(express.json({ limit: "10kb" }));

// API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapi));

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Coupon routes
app.use("/coupons", couponRoutes);

// Handle malformed JSON and oversized request bodies.
const jsonErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Request body contains invalid JSON",
      },
    });
  }

  if (typeof err === "object" && err !== null && "type" in err) {
    if (err.type === "entity.too.large") {
      return res.status(413).json({
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "Request body must not exceed 10 KB",
        },
      });
    }
  }

  return next(err);
};

app.use(jsonErrorHandler);

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
