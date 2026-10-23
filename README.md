# Coupon API

A REST API for creating, listing, and applying discount coupons. Built with Node.js, Express 5, TypeScript, MongoDB, Mongoose, and Zod.

## Features

- Create coupons with unique, case-insensitive codes
- List coupons, newest first, with an `expired` status
- Apply percentage discounts to purchase amounts
- Validate request data using Zod
- Return consistent JSON error responses
- Handle malformed JSON and oversized request bodies
- Round monetary calculations to the nearest paisa
- Explore endpoints using Swagger UI
- Automated unit tests with Vitest

## Requirements

- Node.js and npm
- MongoDB, either local or hosted on MongoDB Atlas

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/surajrawat11/Coupon-API.git
cd Coupon-API
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create your local `.env` file from the example:

```powershell
Copy-Item .env.example .env
```

Set `MONGODB_URI` in `.env` to your own MongoDB connection string. You can optionally set `PORT`; the default is `3000`.

Keep `.env` private and never commit database credentials.

### 4. Start the development server

```bash
npm run dev
```

The API listens on `http://localhost:3000` by default. MongoDB must be running and accessible using the configured connection string.

## API Documentation

Start the server and open:

**http://localhost:3000/api-docs**

Swagger UI provides interactive API documentation where you can inspect the endpoints, view request and response schemas, and try API requests.

## Endpoints

### 1. Health Check

**GET `/health`**

Checks whether the API is running.

Example response (`200 OK`):

```json
{
  "status": "ok"
}
```

### 2. Create a Coupon

**POST `/coupons`**

Creates a new coupon.

Request body:

```json
{
  "code": "SAVE10",
  "discountPercent": 10,
  "expiresAt": "2099-12-31T23:59:59.000Z"
}
```

Example response (`201 Created`):

```json
{
  "code": "SAVE10",
  "discountPercent": 10,
  "expiresAt": "2099-12-31T23:59:59.000Z"
}
```

The actual response includes the fields returned by the API and database, such as the coupon ID and timestamps.

Validation rules:

- `code`: 3–32 characters using letters, numbers, hyphens, and underscores
- `discountPercent`: number from 1 to 90; decimal percentages are allowed
- `expiresAt`: valid ISO 8601 date-time in the future
- Coupon codes are trimmed and stored in uppercase
- Duplicate coupon codes return `409 Conflict`

### 3. List Coupons

**GET `/coupons`**

Returns coupons sorted newest first. Each coupon includes an `expired` boolean calculated using the current time.

Example request:

```bash
curl http://localhost:3000/coupons
```

### 4. Apply a Coupon

**POST `/coupons/apply`**

Applies a coupon's percentage discount to a purchase amount.

Request body:

```json
{
  "code": "SAVE10",
  "amount": 1000
}
```

Example response (`200 OK`):

```json
{
  "code": "SAVE10",
  "discountPercent": 10,
  "originalAmount": 1000,
  "discount": 100,
  "finalAmount": 900
}
```

The `amount` must be a JSON number that is finite and non-negative. Numeric strings such as `"100"` are rejected.

Currency calculations use integer paise to reduce floating-point rounding errors, and monetary results are rounded to two decimal places.

## Error Responses

Errors use a consistent JSON structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "An explanation of the error"
  }
}
```

Common HTTP status codes:

| Status | Meaning |
| --- | --- |
| `200 OK` | Request completed successfully |
| `201 Created` | Coupon created successfully |
| `400 Bad Request` | Invalid request data or malformed JSON |
| `404 Not Found` | Coupon or route not found |
| `409 Conflict` | Coupon code already exists |
| `410 Gone` | Coupon has expired |
| `413 Payload Too Large` | Request body exceeds 10 KB |
| `500 Internal Server Error` | Unexpected server error |

## Development Commands

```bash
npm run dev
npm test
npm run build
npm start
npm run smoke
```

- `npm run dev`: starts the TypeScript development server
- `npm test`: runs unit tests with Vitest
- `npm run build`: compiles TypeScript into `dist`
- `npm start`: starts the compiled application
- `npm run smoke`: runs endpoint-level smoke tests; start the API first if the script requires a running server

## Project Structure

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
  openapi.ts
vitest.config.ts
README.md
ANSWERS.md
```

## Design Decisions and Assumptions

- **Storage:** MongoDB with Mongoose stores coupon records.
- **Unique codes:** Coupon codes are normalized to uppercase, and a unique database index prevents duplicate codes.
- **Code format:** Codes contain 3–32 letters, numbers, hyphens, or underscores.
- **Discounts:** Percentage discounts can range from 1 to 90, including decimal values.
- **Expiration:** A coupon is expired when the current time is greater than or equal to `expiresAt`.
- **Amounts:** Purchase amounts must be finite, non-negative JSON numbers.
- **Rounding:** Currency calculations use integer paise to reduce floating-point precision errors.
- **Status codes:** Different HTTP status codes distinguish invalid input, missing coupons, duplicate codes, and expired coupons.
- **Usage limits:** Coupon usage limits, authentication, coupon editing, and coupon deletion are not included because they are outside the current scope.

## Repository

https://github.com/surajrawat11/Coupon-API
