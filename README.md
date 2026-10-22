# Coupon API

A REST API for creating, listing, and applying discount coupons. Built with Express 5, TypeScript, MongoDB, Mongoose, and Zod.

## Features

- Create coupons with unique, case-insensitive codes
- List coupons, newest first, with an `expired` status
- Apply percentage discounts to amounts
- Validate requests and return consistent JSON errors
- Round currency calculations to the nearest paisa
- Automated unit tests with Vitest

## Requirements

- Node.js and npm
- MongoDB, either local or hosted on MongoDB Atlas

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/surajrawat11/Coupon-API.git
   cd Coupon-API
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your local environment file:

   ```bash
   Copy-Item .env.example .env
   ```

   Set `MONGODB_URI` in `.env` to your own MongoDB connection string. Keep `.env` private and never commit credentials.

4. Start the development server:

   ```bash
   npm run dev
   ```

The API listens on port `3000` by default. Set `PORT` to use another port.

## Endpoints

### Health check

`GET /health`

Example response:

```json
{
  "status": "ok"
}
```

### Create a coupon

`POST /coupons`

Request:

```json
{
  "code": "SAVE10",
  "discountPercent": 10,
  "expiresAt": "2099-12-31T23:59:59.000Z"
}
```

Returns `201 Created` with the created coupon. Coupon codes are trimmed and stored in uppercase.

Rules:
- Code: 3–32 characters, using letters, numbers, hyphens, and underscores
- Discount: number from 1 to 90; decimal percentages are allowed
- Expiry: valid ISO 8601 date-time in the future
- Duplicate codes return `409 Conflict`

### List coupons

`GET /coupons`

Returns coupons sorted newest first. Each coupon includes an `expired` boolean, calculated using the current time.

### Apply a coupon

`POST /coupons/apply`

Request:

```json
{
  "code": "SAVE10",
  "amount": 1000
}
```

Example response:

```json
{
  "code": "SAVE10",
  "discountPercent": 10,
  "originalAmount": 1000,
  "discount": 100,
  "finalAmount": 900
}
```

The amount must be a JSON number that is finite and non-negative. Currency calculations use integer paise to reduce floating-point rounding errors.

## Error responses

Errors use this structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "An explanation of the error"
  }
}
```

Common status codes:
- `400` — invalid request data
- `404` — coupon not found
- `409` — duplicate coupon code
- `410` — coupon expired
- `500` — unexpected server error

## Development commands

```bash
npm run dev
npm test
npm run build
npm start
```

- `npm run dev`: run the TypeScript development server
- `npm test`: execute Vitest tests
- `npm run build`: compile TypeScript into `dist`
- `npm start`: run the compiled application

## Project structure

```text
src/
  config.ts
  db.ts
  index.ts
  coupon.model.ts
  coupon.routes.ts
  coupon.service.ts
  coupon.validation.ts
  money.ts
  money.test.ts
  coupon.validation.test.ts
```

## Assumptions

- Coupon codes are case-insensitive.
- Expiration occurs when the current time is equal to or later than `expiresAt`.
- Discounts are percentage-based.
- Monetary results are rounded to two decimal places.
- MongoDB enforces uniqueness for coupon codes.

## Repository

https://github.com/surajrawat11/Coupon-API
