const baseUrl = process.env.API_URL || "http://localhost:3000";

async function check(name, path, options = {}, expectedStatus = 200) {
  try {
    const response = await fetch(`${baseUrl}${path}`, options);
    const body = await response.json().catch(() => ({}));
    const passed = response.status === expectedStatus;

    console.log(`${passed ? "PASS" : "FAIL"} ${name} (HTTP ${response.status})`);

    if (!passed) {
      console.error("  Response:", JSON.stringify(body));
    }

    return passed;
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`);
    return false;
  }
}

async function main() {
  let passed = 0;
  let failed = 0;

  async function test(...args) {
    if (await check(...args)) passed++;
    else failed++;
  }

  await test("Health check", "/health");

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

  await test(
    "Oversized JSON rejected",
    "/coupons",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: "x".repeat(12000) }),
    },
    413
  );

  await test(
    "Invalid coupon input rejected",
    "/coupons",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "BAD10",
        discountPercent: 150,
        expiresAt: "2099-12-31T23:59:59.000Z",
      }),
    },
    400
  );

  await test("Coupon listing", "/coupons");

  console.log(`\nSmoke tests: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main();
