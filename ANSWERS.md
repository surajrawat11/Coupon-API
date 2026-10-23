# Part 2: Bugs in the Coupon Apply Route

The original route provided in the task is:

```ts
app.post("/apply", async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.body.code });

  if (coupon.expiresAt < new Date()) {
    return res.status(400).json({ message: "Expired" });
  }

  const finalAmount =
    req.body.amount -
    (req.body.amount * coupon.discount) / 100;

  res.json({ finalAmount });
});
```

I identified the following ten problems and their fixes.

## 1. An Unknown Coupon Code Can Crash the Route

**What goes wrong:**

`Coupon.findOne()` returns `null` when no matching coupon exists. The next line tries to access `coupon.expiresAt`, which throws a `TypeError`. The client may receive a `500 Internal Server Error` instead of a useful response.

**Fix:**

Check whether the coupon exists before accessing its properties. If it does not exist, return `404 Not Found` with a clear message such as `"Coupon not found"`.

## 2. The Purchase Amount Is Not Validated

**What goes wrong:**

The route uses `req.body.amount` without checking whether it exists or is a valid number. Missing values and invalid strings can produce `NaN`, which JSON serialization converts to `null`. Negative amounts can also produce incorrect results.

**Fix:**

Validate the amount before calculating the discount. Require a JSON number that is finite and non-negative. Return `400 Bad Request` if the value is missing or invalid.

## 3. The Coupon Code Is Used Directly in the Database Query

**What goes wrong:**

The route passes unvalidated user input directly into a MongoDB query. An attacker could send an object instead of a string, potentially changing the query's meaning if the database query accepts that object.

**Fix:**

Validate the coupon code as a string before querying the database. Restrict it to the expected format and normalize it consistently. Never allow arbitrary objects supplied by the client to become query conditions.

## 4. Expiration Is Not Checked Safely or Consistently

**What goes wrong:**

The route checks expiration only after accessing the coupon, without first confirming that the coupon exists. It also uses a `400` response for an expired coupon, which does not clearly distinguish expiration from invalid input.

**Fix:**

First check that the coupon exists. Then compare its expiry date with the current time. Treat the coupon as expired when the current time is greater than or equal to `expiresAt`, and return `410 Gone`.

## 5. Floating-Point Arithmetic Can Produce Inaccurate Currency Values

**What goes wrong:**

JavaScript uses binary floating-point numbers for ordinary arithmetic. Calculations such as `19.99 - (19.99 * 15) / 100` can produce a result with extra decimal digits rather than an exact currency value.

**Fix:**

Convert the purchase amount to integer paise, calculate the discount in paise, and round the result to the nearest paisa. Convert the values back to rupees for the response.

## 6. Errors Are Not Handled Explicitly

**What goes wrong:**

The route does not include explicit error handling for database failures or other unexpected problems. Without consistent error handling, clients may receive unclear or inconsistent responses.

**Fix:**

Use the application's error-handling middleware and return a consistent JSON error structure. Unexpected failures should be logged on the server and returned as a generic `500 Internal Server Error`, without exposing sensitive internal details.

## 7. The Response Does Not Provide Enough Information

**What goes wrong:**

The route returns only `finalAmount`. The client cannot easily see the original amount, the discount percentage, or how much money was discounted.

**Fix:**

Return useful fields such as the coupon code, discount percentage, original amount, discount amount, and final amount. This makes the result easier for the client to display and verify.

## 8. Coupon Code Matching Is Not Normalized

**What goes wrong:**

A database lookup using the code exactly as supplied may fail when the stored code is `SAVE10` but the customer submits `save10` or includes surrounding whitespace.

**Fix:**

Trim the code and normalize it to uppercase before storing and looking it up. Use a unique database index so that duplicate normalized codes cannot be created.

## 9. The Route Does Not Validate the Request Body Structure

**What goes wrong:**

The route assumes that `req.body`, `req.body.code`, and `req.body.amount` contain the expected values. Missing fields, incorrect types, or malformed input can cause invalid calculations or unclear failures.

**Fix:**

Validate the request body with a schema before performing database operations. Return `400 Bad Request` with a clear validation error when the request does not match the expected structure.

## 10. There Is No Coupon Usage-Limit Logic

**What goes wrong:**

The route does not track how many times a coupon has been used. If the business requires a maximum number of uses, the same coupon could be applied repeatedly without restriction.

**Fix:**

If usage limits are part of the requirements, add a usage counter or redemption records and enforce the limit during redemption. Concurrent requests may require an atomic database update to prevent the limit from being exceeded.

Usage limits are a design gap rather than a confirmed requirement of the current task, so they are not implemented in this API.

## Summary

The main problems are the missing coupon-existence check, lack of input validation, unsafe use of user input in database queries, insufficient expiry handling, floating-point currency calculations, and inconsistent error responses.

The implemented API addresses these problems through Zod validation, normalized coupon codes, Mongoose database constraints, integer-paise calculations, explicit status codes, and centralized error handling.
