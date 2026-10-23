
const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Coupon API",
    version: "1.0.0",
    description:
      "REST API for creating coupons, listing coupons, and applying percentage discounts.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Health", description: "API health status" },
    { name: "Coupons", description: "Coupon management and application" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API health",
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                  },
                  required: ["status"],
                },
              },
            },
          },
        },
      },
    },
    "/coupons": {
      get: {
        tags: ["Coupons"],
        summary: "List coupons",
        description: "Returns coupons ordered by creation date, newest first.",
        responses: {
          "200": {
            description: "Coupon list returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    coupons: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Coupon" },
                    },
                  },
                  required: ["coupons"],
                },
              },
            },
          },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
      post: {
        tags: ["Coupons"],
        summary: "Create a coupon",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCouponInput" },
              example: {
                code: "SAVE10",
                discountPercent: 10,
                expiresAt: "2099-12-31T23:59:59.000Z",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Coupon created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    coupon: { $ref: "#/components/schemas/Coupon" },
                  },
                  required: ["coupon"],
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "409": {
            description: "A coupon with this code already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "COUPON_ALREADY_EXISTS",
                    message: "A coupon with this code already exists",
                  },
                },
              },
            },
          },
          "413": { $ref: "#/components/responses/PayloadTooLarge" },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/coupons/apply": {
      post: {
        tags: ["Coupons"],
        summary: "Apply a coupon to a purchase amount",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApplyCouponInput" },
              example: { code: "SAVE10", amount: 100 },
            },
          },
        },
        responses: {
          "200": {
            description: "Coupon applied successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApplyCouponResult" },
                example: {
                  code: "SAVE10",
                  discountPercent: 10,
                  originalAmount: 100,
                  discount: 10,
                  finalAmount: 90,
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "404": {
            description: "Coupon not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "COUPON_NOT_FOUND",
                    message: "Coupon not found",
                  },
                },
              },
            },
          },
          "410": {
            description: "Coupon has expired",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "COUPON_EXPIRED",
                    message: "Coupon has expired",
                  },
                },
              },
            },
          },
          "413": { $ref: "#/components/responses/PayloadTooLarge" },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
  },
  components: {
    schemas: {
      CreateCouponInput: {
        type: "object",
        required: ["code", "discountPercent", "expiresAt"],
        properties: {
          code: {
            type: "string",
            minLength: 3,
            maxLength: 32,
            pattern: "^[A-Za-z0-9_-]+$",
            example: "SAVE10",
          },
          discountPercent: {
            type: "number",
            minimum: 1,
            maximum: 90,
            example: 10,
          },
          expiresAt: {
            type: "string",
            format: "date-time",
            description: "Must be a future ISO 8601 date-time.",
            example: "2099-12-31T23:59:59.000Z",
          },
        },
      },
      ApplyCouponInput: {
        type: "object",
        required: ["code", "amount"],
        properties: {
          code: {
            type: "string",
            minLength: 3,
            maxLength: 32,
            pattern: "^[A-Za-z0-9_-]+$",
            example: "SAVE10",
          },
          amount: {
            type: "number",
            minimum: 0,
            description: "Purchase amount with at most two decimal places.",
            example: 100,
          },
        },
      },
      Coupon: {
        type: "object",
        properties: {
          _id: { type: "string", example: "671234567890abcdef123456" },
          code: { type: "string", example: "SAVE10" },
          discountPercent: { type: "number", example: 10 },
          expiresAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          expired: {
            type: "boolean",
            description: "Included in coupon listing responses.",
          },
        },
      },
      ApplyCouponResult: {
        type: "object",
        required: [
          "code",
          "discountPercent",
          "originalAmount",
          "discount",
          "finalAmount",
        ],
        properties: {
          code: { type: "string", example: "SAVE10" },
          discountPercent: { type: "number", example: 10 },
          originalAmount: { type: "number", example: 100 },
          discount: { type: "number", example: 10 },
          finalAmount: { type: "number", example: 90 },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: {
                type: "string",
                example: "Coupon code must be at least 3 characters",
              },
            },
          },
        },
      },
    },
    responses: {
      ValidationError: {
        description: "Request validation failed",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              error: {
                code: "VALIDATION_ERROR",
                message: "Amount cannot be negative",
              },
            },
          },
        },
      },
      PayloadTooLarge: {
        description: "Request body exceeds 10 KB",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              error: {
                code: "PAYLOAD_TOO_LARGE",
                message: "Request body must not exceed 10 KB",
              },
            },
          },
        },
      },
      InternalServerError: {
        description: "Unexpected server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An unexpected error occurred",
              },
            },
          },
        },
      },
    },
  },
} as const;

export default openapi;
