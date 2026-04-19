# 🏗️ Stripe Payment Integration - Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         STAYSPACE PAYMENT SYSTEM                         │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React)                               │
│                        http://localhost:5173                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─ PropertyDetail.jsx ────────────────────────────────────────────┐    │
│  │                                                                 │    │
│  │  1️⃣ Book Button Click ──→ Open Modal                          │    │
│  │  2️⃣ Select Dates ──→ Calculate nights                         │    │
│  │  3️⃣ Continue to Payment ──→ Show Form                         │    │
│  │                                                                 │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                  │                                        │
│                                  ▼                                        │
│  ┌─ StripePaymentForm.jsx ────────────────────────────────────────┐    │
│  │                                                                 │    │
│  │  • Stripe Elements Provider ──→ useStripe()                    │    │
│  │  • CardElement ──→ Secure card input                           │    │
│  │  • Calculate Total: nights × pricePerNight                     │    │
│  │                                                                 │    │
│  │  Payment Steps:                                                 │    │
│  │  1. Create Payment Intent ──→ POST /api/payments/create-intent │    │
│  │  2. Get clientSecret + paymentIntentId                         │    │
│  │  3. Confirm Card Payment ──→ stripe.confirmCardPayment()       │    │
│  │  4. Send confirmation ──→ POST /api/payments/confirm           │    │
│  │                                                                 │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                  │                                        │
│                                  ▼                                        │
│                         Stripe Test Server                                │
│                      (Payment Processing)                                 │
│                                                                           │
│                     (4242 4242 4242 4242 → Success)                      │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ clientSecret
                                  │ paymentIntentId
                                  │
                                  ▼

┌──────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Node/Express)                         │
│                        http://localhost:5000                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─ paymentController.js ────────────────────────────────────────┐     │
│  │                                                                │     │
│  │  1. createPaymentIntent()                                      │     │
│  │     • Verify property exists                                   │     │
│  │     • Calculate: nights = checkOut - checkIn                  │     │
│  │     • Calculate: amount = nights × pricePerNight × 100 (cents)│     │
│  │     • stripe.paymentIntents.create()                           │     │
│  │     • Return: clientSecret, paymentIntentId, amount            │     │
│  │                                                                │     │
│  │  2. confirmPayment()                                           │     │
│  │     • stripe.paymentIntents.retrieve()                         │     │
│  │     • Verify status === 'succeeded'                            │     │
│  │     • Check no duplicate booking                               │     │
│  │     • Create Booking with status: 'confirmed'                  │     │
│  │     • Store payment info in booking                            │     │
│  │     • Send confirmation email                                  │     │
│  │     • Return: booking object                                   │     │
│  │                                                                │     │
│  │  3. getPaymentStatus()                                         │     │
│  │     • stripe.paymentIntents.retrieve()                         │     │
│  │     • Return: status, amount, currency                         │     │
│  │                                                                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  ┌─ Routes: /api/payments ───────────────────────────────────────┐     │
│  │                                                                │     │
│  │  POST   /create-intent   ──→ createPaymentIntent()            │     │
│  │  POST   /confirm         ──→ confirmPayment()                 │     │
│  │  GET    /:id/status      ──→ getPaymentStatus()               │     │
│  │                                                                │     │
│  │  All routes require: Authentication + Tenant role             │     │
│  │                                                                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                  │                                        │
│                                  ▼                                        │
│  ┌─ Booking Model ───────────────────────────────────────────────┐     │
│  │                                                                │     │
│  │  New Fields:                                                   │     │
│  │  • paymentId: String (pi_xxxxxx)                               │     │
│  │  • paymentStatus: String ('pending'|'completed'|'failed')     │     │
│  │  • paymentAmount: Number (total paid)                         │     │
│  │  • paymentMethod: String ('card')                              │     │
│  │                                                                │     │
│  │  Existing Fields:                                              │     │
│  │  • property: ObjectId                                          │     │
│  │  • tenant: ObjectId                                            │     │
│  │  • status: String ('confirmed' after payment)                  │     │
│  │  • checkInDate: Date                                           │     │
│  │  • checkOutDate: Date                                          │     │
│  │                                                                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                  │                                        │
│                                  ▼                                        │
│  ┌─ Environment Variables ───────────────────────────────────────┐     │
│  │                                                                │     │
│  │  STRIPE_SECRET_KEY=sk_test_xxxxx                               │     │
│  │  STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx                          │     │
│  │  (From: https://dashboard.stripe.com/apikeys)                 │     │
│  │                                                                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼

┌──────────────────────────────────────────────────────────────────────────┐
│                              MONGODB                                      │
│                      (Booking Collection)                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Booking Document:                                                        │
│  {                                                                        │
│    _id: ObjectId,                                                         │
│    property: ObjectId,                                                    │
│    tenant: ObjectId,                                                      │
│    checkInDate: 2024-04-20,                                               │
│    checkOutDate: 2024-04-25,                                              │
│    status: "confirmed",             ← Changed from "pending"              │
│    paymentId: "pi_1Abc2Def3Ghi4...", ← NEW                                │
│    paymentStatus: "completed",      ← NEW                                 │
│    paymentAmount: 375,              ← NEW                                 │
│    paymentMethod: "card",           ← NEW                                 │
│    createdAt: 2024-04-19T10:30:00Z,                                       │
│    updatedAt: 2024-04-19T10:30:00Z                                        │
│  }                                                                        │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
User Interface Actions:
───────────────────────

[User Views Property]
        ↓
[Click "Book This Property"]
        ↓
[Select Check-in & Check-out Dates]
        ↓
[Click "Continue to Payment"]
        ↓
[StripePaymentForm Rendered]
        │
        ├→ Calculate Nights: (checkOut - checkIn)
        ├→ Calculate Total: nights × property.rent
        ├→ Display: Rate, Nights, Total
        │
        ↓
[Enter Card Details]
        ↓
[Click "Pay $[Amount]"]
        │
        ├→ Frontend: POST /api/payments/create-intent
        │   {propertyId, checkInDate, checkOutDate, pricePerNight}
        │
        ├→ Backend: Create Stripe PaymentIntent
        │   • Verify Property exists
        │   • Validate dates
        │   • Calculate amount in cents
        │   • stripe.paymentIntents.create()
        │
        ├→ Return: clientSecret + paymentIntentId
        │
        ├→ Frontend: stripe.confirmCardPayment(clientSecret)
        │   • Tokenize card via Stripe Elements
        │   • Send to Stripe for processing
        │
        ├→ Stripe: Process Payment
        │   • Validate card
        │   • Process charge
        │   • Return status
        │
        ├→ Frontend: Check payment status
        │   • If succeeded:
        │       └→ POST /api/payments/confirm
        │   • If failed:
        │       └→ Show error message
        │
        ├→ Backend: Create Booking
        │   • Verify payment succeeded on Stripe
        │   • Check no duplicate booking
        │   • Create Booking(status: "confirmed")
        │   • Store paymentId, paymentStatus, paymentAmount
        │   • Send confirmation email
        │   • Return booking
        │
        ├→ MongoDB: Booking Saved
        │   {
        │     property: propertyId,
        │     tenant: userId,
        │     status: "confirmed",
        │     paymentId: "pi_...",
        │     paymentStatus: "completed",
        │     paymentAmount: 375,
        │     checkInDate, checkOutDate
        │   }
        │
        ↓
[Success: Booking Confirmed!]
        ↓
[User Sees Confirmation]
```

---

## Component Interaction

```
App.jsx
│
├─→ Elements Provider (Stripe)
│   │
│   └─→ Router
│       │
│       └─→ PropertyDetail.jsx
│           │
│           ├─→ Modal (Date Selection)
│           │
│           └─→ StripePaymentForm.jsx
│               │
│               ├─→ useStripe() hook
│               ├─→ useElements() hook
│               │
│               └─→ CardElement
│                   │
│                   └─→ Stripe Hosted
```

---

## Environment Configuration

```
Frontend (.env)
──────────────
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_API_URL=http://localhost:5000

Backend (.env)
──────────────
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  (optional, for reference)
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
PORT=5000
EMAIL_USER=...
EMAIL_PASSWORD=...
```

---

## Security Flow

```
┌─ Client Side ─────────────────────┐
│                                   │
│  CardElement (Stripe)             │
│       ↓                           │
│  Tokenize Card                    │
│       ↓                           │
│  NO RAW CARD DATA SENT            │
│       ↓                           │
│  Send: clientSecret               │
│  Send: paymentIntentId            │
│                                   │
└─ Over HTTPS to Server ───────────┘
         ↓
┌─ Server Side ──────────────────────┐
│                                    │
│  Receive: clientSecret             │
│  Receive: paymentIntentId          │
│                                    │
│  NO RAW CARD DATA HERE             │
│                                    │
│  Verify with Stripe:               │
│  stripe.paymentIntents.retrieve()  │
│                                    │
│  Create Booking:                   │
│  Store: paymentId, amount, status  │
│                                    │
└─ Secure Database ──────────────────┘
```

---

## Success Criteria

✅ All checks before creating booking:
1. Payment intent created successfully
2. Payment status is "succeeded" from Stripe
3. Property exists
4. User is authenticated as tenant
5. No duplicate booking for user + property
6. Dates are valid (checkout > checkin)
7. Amount matches expected (nights × rate)

---

## Error Handling

```
Possible Errors:
└─ Frontend Errors:
   ├─ Stripe not loaded
   ├─ Card element missing
   ├─ Invalid dates
   └─ Network error creating intent
│
└─ Stripe Errors:
   ├─ Card declined
   ├─ Insufficient funds
   ├─ Expired card
   ├─ 3D Secure required
   └─ Suspicious activity
│
└─ Backend Errors:
   ├─ Property not found
   ├─ Duplicate booking exists
   ├─ Payment intent invalid
   ├─ Payment not succeeded
   └─ Database save failed

All errors return user-friendly messages
```

---

## Performance Notes

- Payment intent creation: ~200ms
- Card tokenization: ~100ms  
- Payment confirmation: ~500ms
- Booking creation: ~100ms
- **Total flow: ~1 second**

---

## Scalability Considerations

✅ **Stateless design** - Each request can be handled independently
✅ **Webhook support** - Can add Stripe webhooks for production
✅ **Rate limiting** - Can add to prevent abuse
✅ **Payment retry** - Can implement idempotent operations
✅ **Logging** - All payment attempts logged for audit

---

**Architecture Overview Complete! 🏗️**

The system is designed for security, reliability, and user experience.
