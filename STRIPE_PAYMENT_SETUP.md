# Stripe Payment Integration Guide - Stayspace

## ✅ Completed Implementation

Your Stayspace project now has full Stripe payment integration! Here's what has been added:

### Backend Changes:
1. ✅ **Updated Models**: Booking model now includes payment fields (`paymentId`, `paymentStatus`, `paymentAmount`, `paymentMethod`)
2. ✅ **Payment Controller** (`controllers/paymentController.js`): 
   - `createPaymentIntent` - Creates Stripe payment intent
   - `confirmPayment` - Confirms payment and creates booking
   - `getPaymentStatus` - Retrieves payment status
3. ✅ **Payment Routes** (`routes/payment.js`): Registered payment endpoints
4. ✅ **Stripe Package**: Installed `stripe` npm package

### Frontend Changes:
1. ✅ **Stripe React Integration**: 
   - Installed `@stripe/react-stripe-js` and `stripe` packages
   - Added `Elements` provider to `App.jsx` that wraps all routes
2. ✅ **Payment Component** (`components/StripePaymentForm.jsx`):
   - Uses Stripe Elements for secure card input
   - Loads publishable key from `.env` variable
   - Shows payment summary (nights, rate, total)
   - Handles payment confirmation flow
3. ✅ **Updated PropertyDetail**: 
   - Integrated payment form into booking modal
   - New flow: Select dates → Payment form → Confirm booking
   - Shows "Continue to Payment" instead of direct booking
4. ✅ **Styling**: Added CSS for payment form components

---

## 🔑 IMPORTANT: Setup Your Stripe Keys

### Step 1: Get Your Keys from Stripe
1. Visit https://dashboard.stripe.com/apikeys
2. Log in with your Stripe account
3. Copy your **Secret Key** (starts with `sk_test_`)
4. Copy your **Publishable Key** (starts with `pk_test_`)

### Step 2: Update Backend .env
Edit `backend/.env` and replace the placeholder values:

```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
CLIENT_URL=http://localhost:5173
```

### Step 3: Update Frontend .env
Edit `frontend/.env` and replace the placeholder value:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
VITE_API_URL=http://localhost:5000
```

---

## 🧪 Testing with Stripe Test Cards

Use these test card numbers in development:

| Card Number | Expiry | CVC | Description |
|---|---|---|---|
| `4242 4242 4242 4242` | Any future date | Any 3 digits | ✅ Successful payment |
| `4000 0000 0000 0002` | Any future date | Any 3 digits | ❌ Card declined |
| `4000 0025 0000 3155` | Any future date | Any 3 digits | ⚠️ Requires authentication |

---

## 🔄 New Booking Flow

Users will now experience this flow:

1. **Click "Book This Property"** button
2. **Select Check-in & Check-out Dates**
3. **Click "Continue to Payment"**
4. **Payment Modal Opens** showing:
   - Nightly rate
   - Number of nights
   - Total amount to pay
5. **Enter Card Information** using secure Stripe Elements
6. **Click "Pay [Amount]"**
7. **Payment Processing** - Stripe handles payment securely
8. **Booking Confirmation** - On success:
   - Booking created with `confirmed` status
   - Payment details stored in database
   - Success message shown to user

---

## 📋 Database Changes

The Booking collection now stores:

```javascript
{
  ...existing_fields,
  paymentId: "pi_1Abc2Def3Ghi4Jkl5Mno6Pqr", // Stripe payment intent ID
  paymentStatus: "completed",                 // pending | completed | failed
  paymentAmount: 250.00,                      // Total paid amount
  paymentMethod: "card"                       // Payment method used
}
```

---

## 🔐 Security Notes

✅ **Card Details Never Touch Your Server**:
- Card data is tokenized by Stripe directly from the frontend
- Your backend never sees raw card details
- Uses `confirmCardPayment` for secure client-side confirmation

✅ **PCI Compliance**:
- Stripe handles all PCI compliance requirements
- No manual card storage needed

---

## 🚀 Running the Project

### Start Backend:
```bash
cd backend
npm run dev
```

### Start Frontend:
```bash
cd frontend
npm run dev
```

The payment integration is now live on `http://localhost:5173`

---

## 📝 API Endpoints

### Create Payment Intent
**POST** `/api/payments/create-intent`
```json
{
  "propertyId": "property_id",
  "checkInDate": "2024-01-15",
  "checkOutDate": "2024-01-20",
  "pricePerNight": 50
}
```

Response:
```json
{
  "clientSecret": "pi_1...#secret_...",
  "paymentIntentId": "pi_1...",
  "amount": 25000,
  "nights": 5
}
```

### Confirm Payment & Create Booking
**POST** `/api/payments/confirm`
```json
{
  "paymentIntentId": "pi_1...",
  "propertyId": "property_id",
  "checkInDate": "2024-01-15",
  "checkOutDate": "2024-01-20",
  "pricePerNight": 50
}
```

Response:
```json
{
  "message": "Booking confirmed successfully!",
  "booking": {
    "_id": "booking_id",
    "status": "confirmed",
    "paymentId": "pi_1...",
    "paymentStatus": "completed",
    ...
  }
}
```

---

## ✨ Features

✅ Secure card tokenization via Stripe Elements
✅ Real-time payment amount calculation
✅ Payment status tracking in database
✅ Automatic booking creation on successful payment
✅ Email notifications sent after booking
✅ Beautiful payment UI matching app design
✅ Error handling and user feedback
✅ Responsive design for all devices

---

## 🐛 Troubleshooting

### Payment Form Not Showing?
- Check that Stripe publishable key is set in `.env`
- Verify `Elements` wrapper is in `App.jsx`
- Check browser console for errors

### "Payment intent initialization failed"?
- Verify backend is running (`npm run dev` in backend folder)
- Check network tab in browser DevTools
- Ensure `STRIPE_SECRET_KEY` is set correctly in backend `.env`

### Cards Declined in Test Mode?
- Use test cards from the table above
- Ensure you're using the **test** mode keys (start with `test_`)
- Check for any SSL/HTTPS warnings

---

## 📞 Need Help?

For Stripe issues:
- Visit https://stripe.com/docs
- Check dashboard for payment logs
- Review test card documentation

For integration questions:
- Verify all environment variables are set
- Check console logs (browser and server)
- Ensure both frontend and backend are running

---

## ✅ Implementation Checklist

- [ ] Add Stripe keys to `backend/.env`
- [ ] Add Stripe publishable key to `frontend/.env`
- [ ] Restart backend server (`npm run dev`)
- [ ] Restart frontend dev server (`npm run dev`)
- [ ] Test booking flow with test card `4242 4242 4242 4242`
- [ ] Verify booking is created with `confirmed` status
- [ ] Check MongoDB for payment fields in booking document

---

**Your Stripe payment integration is complete! All existing features remain untouched. Happy booking! 🎉**
