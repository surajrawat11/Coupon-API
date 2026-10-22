# Coupon API — Design Answers

## 1. Coupon code handling

Coupon codes are trimmed and converted to uppercase so that codes such as `SAVE10` and `save10` refer to the same coupon. MongoDB's unique index prevents duplicate codes.

## 2. Input validation

Zod validates incoming request data before database operations. Coupon codes must contain only letters, numbers, hyphens, and underscores. Discount percentages must be between 1 and 90, and expiry dates must be valid future ISO 8601 date-times.

## 3. Expiry handling

A coupon is expired when the current time is greater than or equal to its expiry time. Expired coupons cannot be applied.

## 4. Monetary calculations

Amounts are converted to integer paise for discount calculations to reduce floating-point precision errors. Returned monetary values are rounded to two decimal places.

## 5. HTTP status codes

- `201 Created`: Coupon created successfully.
- `200 OK`: Coupons listed or a coupon applied successfully.
- `400 Bad Request`: Invalid request data.
- `404 Not Found`: Coupon does not exist.
- `409 Conflict`: Coupon code already exists.
- `410 Gone`: Coupon has expired.
- `500 Internal Server Error`: Unexpected server error.

## 6. Database and configuration

MongoDB stores coupon records. Environment variables configure the database connection and server port. The `.env` file is excluded from version control to protect credentials.

## 7. Testing

Vitest unit tests cover currency rounding and request validation. The project should also be checked with `npm run build` and endpoint-level smoke tests before submission.
