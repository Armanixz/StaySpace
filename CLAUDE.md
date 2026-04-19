# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StaySpace is a property rental platform (Airbnb-style) with a React frontend and Node/Express backend. Users have one of three roles: `tenant`, `admin`, or landlord (property owners who create listings).

## Development Commands

### Backend (port 5000)
```bash
cd backend
npm run dev       # Start with nodemon (auto-reload)
npm start         # Start without auto-reload
npm run seed      # Seed the database
```

### Frontend (port 5173)
```bash
cd frontend
npm run dev       # Vite dev server
npm run build     # Production build
npm run preview   # Preview production build
```

Both servers must run concurrently during development.

## Environment Setup

**backend/.env**
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
PORT=5000
CLIENT_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
EMAIL_USER=...
EMAIL_PASSWORD=...
```

**frontend/.env**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:5000
```

## Architecture

### Backend (`backend/`)
- **server.js** — Express app + Socket.io setup; mounts all routes under `/api/*`
- **routes/** — One file per feature, mirrors controllers
- **controllers/** — Business logic: `authController`, `propertyController`, `tenantController`, `paymentController`, `chatController`, `reviewController`, `appointmentController`, `reportController`, `adminController`
- **models/** — Mongoose schemas: `User`, `Property`, `Booking`, `Message`, `Review`, `Appointment`, `Report`, `History`
- **middleware/authMiddleware.js** — `protect` (JWT verification) and `adminOnly` role guards; attach to routes as needed
- **services/notificationService.js** — Email notifications via Nodemailer
- **config/emailConfig.js** — Nodemailer transport configuration
- Uses **CommonJS** (`require`/`module.exports`)

### Frontend (`frontend/src/`)
- **App.jsx** — Router setup; wraps everything in Stripe `<Elements>` provider; `PrivateRoute` handles auth + admin guards
- **context/AuthContext.jsx** — Global auth state (user, token, loading); consumed via `useAuth()`
- **pages/** — Full-page views: `Home`, `PropertyDetail`, `CreateListing`, `AdminDashboard`, `Profile`, `Wishlist`, `History`, `Compare`, `Messages`, `Login`, `Register`
- **components/** — Reusable: `Navbar`, `ChatWindow`, `StripePaymentForm`
- Uses **ES modules** (`import`/`export`)

### Key Data Flows

**Authentication:** JWT token stored client-side, sent as `Authorization: Bearer <token>` header. Backend `protect` middleware decodes it and attaches `req.user`.

**Payment:** Frontend creates a PaymentIntent via `POST /api/payments/create-intent`, Stripe Elements tokenizes the card client-side, then `POST /api/payments/confirm` verifies with Stripe and creates a `Booking` with `status: "confirmed"`. Raw card data never reaches the server.

**Real-time Chat:** Socket.io on the same HTTP server as Express. User socket IDs tracked in a `Map`. Events: `user-connected`, `send-message`, `receive-message`.

**Stripe test card:** `4242 4242 4242 4242` (any future expiry, any CVC)

# Use the file formats and exiting UI format 