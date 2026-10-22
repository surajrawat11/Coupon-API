
const baseUrl = process.env.API_URL || "http://localhost:3000";

function jsonRequest(method, body) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function main() {
  let passed = 0;
  let failed = 0;

  async function test(
    name,
    path,
    options = {},
    expectedStatus = 200,
    validate = null
  ) {
    try {
      const response = await fetch(`${baseUrl}${path}`, options);
      const body = await response.json().catch(() => ({}));

      const ok =
        response.status === expectedStatus &&
        (!validate || validate(body));

      console.log(
        `${ok ? "PASS" : "FAIL"} ${name} (HTTP ${response.status})`
      );

      if (!ok) {
        console.error("  Response:", JSON.stringify(body));
      }

      if (ok) passed++;
      else failed++;

      return { ok, body };
    } catch (error) {
      console.error(`FAIL ${name}: ${error.message}`);
      failed++;
      return null;
    }
  }

  // 1. Health check
  await test("Health check", "/health");

  const smokeCode = `SMOKE${Date.now()}`;
  const expiry = "2099-12-31T23:59:59.000Z";

  // 2. Create a valid coupon
  const created = await test(
    "Create a valid coupon",
    "/coupons",
    jsonRequest("POST", {
      code: smokeCode,
      discountPercent: 10,
      expiresAt: expiry,
    }),
    201,
    (body) => body.coupon?.code === smokeCode
  );

  if (created?.ok) {
    // 3. Apply a 10% coupon
    await test(
      "Apply 10% coupon",
      "/coupons/apply",
      jsonRequest("POST", {
        code: smokeCode,
        amount: 1000,
      }),
      200,
      (body) => body.discount === 100 && body.finalAmount === 900
    );

    // 4. Accept lowercase coupon codes
    await test(
      "Lowercase coupon code accepted",
      "/coupons/apply",
      jsonRequest("POST", {
        code: smokeCode.toLowerCase(),
        amount: 100,
      }),
      200,
      (body) => body.discount === 10 && body.finalAmount === 90
    );

    // 5. Reject duplicate coupons
    await test(
      "Duplicate coupon rejected",
      "/coupons",
      jsonRequest("POST", {
        code: smokeCode,
        discountPercent: 10,
        expiresAt: expiry,
      }),
      409
    );

    // 6. Reject negative purchase amounts
    await test(
      "Negative amount rejected",
      "/coupons/apply",
      jsonRequest("POST", {
        code: smokeCode,
        amount: -100,
      }),
      400
    );

    // 7. Reject string purchase amounts
    await test(
      "String purchase amount rejected",
      "/coupons/apply",
      jsonRequest("POST", {
        code: smokeCode,
        amount: "1000",
      }),
      400
    );
  }

  // 8. Reject malformed JSON
  await test(
    "Malformed JSON rejected",
    "/coupons",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"code":',
    },
    400
  );

  // 9. Reject oversized JSON
  await test(
    "Oversized JSON rejected",
    "/coupons",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: "x".repeat(12000),
      }),
    },
    413
  );

  // 10. Reject invalid discount percentages
  await test(
    "Invalid discount rejected",
    "/coupons",
    jsonRequest("POST", {
      code: "BAD10",
      discountPercent: 150,
      expiresAt: expiry,
    }),
    400
  );

  // 11. Reject coupon codes with invalid characters
  await test(
    "Coupon code with invalid characters rejected",
    "/coupons",
    jsonRequest("POST", {
      code: "BAD@10",
      discountPercent: 10,
      expiresAt: expiry,
    }),
    400
  );

  // 12. Reject discounts below the minimum
  await test(
    "Discount below minimum rejected",
    "/coupons",
    jsonRequest("POST", {
      code: "LOW10",
      discountPercent: 0,
      expiresAt: expiry,
    }),
    400
  );

  // 13. Reject unknown coupons
  await test(
    "Unknown coupon rejected",
    "/coupons/apply",
    jsonRequest("POST", {
      code: "UNKNOWN999",
      amount: 1000,
    }),
    404
  );

  // 14. List coupons
  await test(
    "Coupon listing",
    "/coupons",
    {},
    200,
    (body) => Array.isArray(body.coupons)
  );

  console.log(`\nSmoke tests: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Smoke test runner failed:", error);
  process.exitCode = 1;
});
