# Production Setup & Configuration Guide

This guide covers environment configuration, service integrations, and local development instructions for the E-Commerce Platform.

## 1. Environment Variables (.env)

Create a `.env` file in the root directory using the template below:

```env
# Server & Port Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres_password@localhost:5432/ecommerce_db?schema=public"

# Firebase Credentials (Auth & FCM)
VITE_FIREBASE_API_KEY="AIzaSyYourFirebaseApiKeyHere"
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-app-id"
VITE_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
VITE_FIREBASE_APP_ID="1:1234567890:web:abcdef123456"

# Google Maps Platform Credentials
VITE_GOOGLE_MAPS_API_KEY="AIzaSyYourGoogleMapsKeyHere"

# Payment Gateway (Razorpay India)
VITE_RAZORPAY_KEY_ID="rzp_test_YourKeyId"
RAZORPAY_KEY_SECRET="YourRazorpaySecretKey"
RAZORPAY_WEBHOOK_SECRET="YourWebhookSecret"

# Permanent Image Storage (S3 / R2)
STORAGE_PROVIDER="r2" # "r2" | "s3" | "firebase"
R2_ACCESS_KEY_ID="your_access_key"
R2_SECRET_ACCESS_KEY="your_secret_key"
R2_BUCKET_NAME="ecommerce-assets"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
```

---

## 2. External Integration Guides

### A. Firebase & Google OAuth
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Authentication** and add **Google Sign-In** as an authorized provider.
3. In **Project Settings**, copy the web configuration keys to `.env`.
4. Ensure your domain (`localhost:3000` or production URL) is listed under **Authorized Domains**.

### B. Google Maps Platform
1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/).
2. Enable **Maps JavaScript API**, **Places API**, **Geocoding API**, and **Routes API**.
3. Create an API key and restrict it by HTTP Referrers (`https://yourdomain.com/*`).
4. Set `VITE_GOOGLE_MAPS_API_KEY` in `.env`.

### C. Payment Gateway (Razorpay India)
1. Sign up on [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Under **Settings -> API Keys**, generate Test Key ID and Secret.
3. Configure Webhook URL (`https://yourdomain.com/api/v1/payments/verify-webhook`) with event `payment.captured`.

---

## 3. Local Development Commands

```bash
# 1. Install dependencies
npm install

# 2. Run database migrations
npx prisma migrate dev --name init

# 3. Seed database with initial products, categories & admin accounts
npx prisma db seed

# 4. Start Vite development server
npm run dev
```

---

## 4. Production Deployment Checklist

- [x] Strict TypeScript validation (`npm run lint`).
- [x] Environment variable isolation (No secret keys exposed in client bundles).
- [x] Automated image optimization targeting ~200 KB.
- [x] Verified payment webhook signature checking.
- [x] Role-Based Access Control enforced on server routes.
- [x] Idempotent order creation and atomic stock deductions.
