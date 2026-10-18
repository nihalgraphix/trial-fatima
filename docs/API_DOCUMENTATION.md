# REST API Specification & Service Schema

This document describes the API contract for the E-Commerce Platform backend.

## Base URL & Headers

```
Base URL: /api/v1
Headers:
  Content-Type: application/json
  Authorization: Bearer <FIREBASE_ID_TOKEN>
```

---

## 1. Authentication & User Management

### `POST /api/v1/auth/google`
Authenticates a user with a verified Firebase Google OAuth ID token.
- **Request Body**:
  ```json
  {
    "idToken": "string",
    "email": "string",
    "name": "string",
    "photoUrl": "string"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "customer"
    },
    "token": "session_jwt"
  }
  ```

---

## 2. Product Catalog & Search

### `GET /api/v1/products`
Retrieves paginated products with filtering and sorting.
- **Query Parameters**:
  - `category`: string (optional)
  - `search`: string (optional)
  - `minPrice`: number, `maxPrice`: number (optional)
  - `sort`: `price_asc` | `price_desc` | `newest` | `popular`
  - `page`: number, `limit`: number

### `POST /api/v1/products/upload-image`
Uploads and automatically compresses a product image to ~200 KB.
- **Form Data**: `file` (Image binary)
- **Response**:
  ```json
  {
    "success": true,
    "url": "https://cdn.storefront.com/media/products/img_98231.webp",
    "originalSizeKb": 1820,
    "compressedSizeKb": 184,
    "format": "webp"
  }
  ```

---

## 3. Checkout & Payment Gateway

### `POST /api/v1/checkout/create-order`
Creates a pending order, calculates taxes and shipping, and initializes payment.
- **Request Body**:
  ```json
  {
    "items": [{ "productId": "uuid", "quantity": 2 }],
    "shippingAddress": {
      "fullName": "Jane Doe",
      "phone": "+91 98450 12345",
      "house": "House 12",
      "street": "MG Road",
      "city": "Trivandrum",
      "pinCode": "695001",
      "lat": 8.5241,
      "lng": 76.9366
    },
    "paymentMethod": "UPI",
    "couponCode": "WELCOME10"
  }
  ```

### `POST /api/v1/payments/verify-webhook`
Handles Razorpay/Gateway signed webhook notifications for payment capture and stock reservation.

---

## 4. Delivery Personnel & Live Tracking

### `GET /api/v1/delivery/active-assignments`
Returns active jobs assigned to the authenticated delivery worker.

### `POST /api/v1/delivery/update-location`
Transmits live GPS coordinates during an active delivery session.
- **Request Body**:
  ```json
  {
    "assignmentId": "uuid",
    "lat": 8.5255,
    "lng": 76.9380
  }
  ```

### `POST /api/v1/delivery/complete`
Completes delivery with customer OTP or photo signature proof.

---

## 5. Admin Analytics & Reporting

### `GET /api/v1/admin/analytics/overview`
Returns sales, gross profit, net profit, COGS, customer metrics, and delivery SLA statistics over custom date ranges.
