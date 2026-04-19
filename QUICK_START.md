# 🚀 QUICK START - Stripe Payment Integration

## ⚡ 5-Minute Setup

### Step 1: Get Stripe Keys (2 minutes)
1. Visit: https://dashboard.stripe.com/apikeys
2. Log in to your Stripe account
3. Copy the **Secret Key** (sk_test_...)
4. Copy the **Publishable Key** (pk_test_...)

### Step 2: Update Backend .env (1 minute)
File: `backend/.env`

Add/Update these lines:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
CLIENT_URL=http://localhost:5173
```

### Step 3: Update Frontend .env (1 minute)
File: `frontend/.env`

Add/Update this line:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

### Step 4: Restart Servers (1 minute)

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## ✅ Test the Integration

### Quick Test Flow:
1. Open http://localhost:5173
2. Find any property
3. Click **"Book This Property"**
4. Select dates → Click **"Continue to Payment"**
5. Enter test card: **4242 4242 4242 4242**
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
6. Click **"Pay $..."**
7. ✅ **Success!** Booking created with payment confirmed

---

## 📱 What Changed in the App

### User Experience (UX):
- **Before:** Select dates → Click "Confirm Booking" → Pending status
- **After:** Select dates → Payment form → Instant confirmation

### Database:
Bookings now have:
- `paymentId` - Stripe payment reference
- `paymentStatus` - "completed" for paid bookings
- `paymentAmount` - Total paid
- `paymentMethod` - "card"

### Status Flow:
- ✅ Payment succeeds → Booking created with "confirmed" status
- ❌ Payment fails → User sees error, no booking created

---

## 🧪 Test Cards

For testing different scenarios:

```
✅ Success:        4242 4242 4242 4242
❌ Declined:       4000 0000 0000 0002
⚠️  Auth Required:  4000 0025 0000 3155
💳 Mastercard:     5555 5555 5555 4444
```

Use any future expiry and any 3-digit CVC.

---

## 🔍 Troubleshooting

### Issue: "Payment initialization failed"
**Solution:** 
- Check `STRIPE_SECRET_KEY` is set in `backend/.env`
- Restart backend server
- Check network tab in browser DevTools

### Issue: "Stripe is not loaded yet"
**Solution:**
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is in `frontend/.env`
- Restart frontend server
- Clear browser cache

### Issue: Card element not visible
**Solution:**
- Check that both servers are running
- Open browser console for errors
- Verify Stripe.js is loading (Network tab)

### Issue: "Access denied: Tenants only"
**Solution:**
- Make sure you're logged in as a tenant
- Logout and login again
- Check that user has `role: 'tenant'`

---

## 📞 Need the Stripe Keys?

Your Stripe account is here:
- **Live URL:** https://buy.stripe.com/test_dRm14oeuDauDe9f1V0fw400
- **Dashboard:** https://dashboard.stripe.com
- **API Keys:** https://dashboard.stripe.com/apikeys

---

## ✨ Features Now Available

✅ Secure online booking payments  
✅ Instant payment confirmation  
✅ Real booking status tracking  
✅ Payment details in database  
✅ No direct card processing on server  
✅ Test mode for development  
✅ All existing features preserved  

---

## 📁 Files Changed

**New:**
- `backend/controllers/paymentController.js`
- `backend/routes/payment.js`
- `frontend/src/components/StripePaymentForm.jsx`
- `frontend/.env`

**Updated:**
- `backend/models/Booking.js` (+ payment fields)
- `backend/server.js` (+ payment routes)
- `backend/.env` (+ Stripe keys)
- `frontend/src/App.jsx` (+ Stripe provider)
- `frontend/src/pages/PropertyDetail.jsx` (+ payment flow)
- `frontend/src/index.css` (+ payment styling)

**Untouched:**
- All other controllers, models, routes, pages
- All existing features (chat, wishlist, reviews, etc.)

---

## 🔐 Security Guarantee

✅ **Card data never touches your server**
- Stripe Elements tokenizes cards client-side
- Only tokens sent to backend
- PCI compliant automatically

---

## 📊 What's Next?

1. ✅ Add Stripe keys → Restart servers
2. ✅ Test with test card
3. ✅ Check MongoDB for payment data
4. ✅ Ready for production! (just use live keys later)

---

**🎉 Setup Complete! Your payment integration is live!**

Questions? Check `STRIPE_PAYMENT_SETUP.md` or `INTEGRATION_SUMMARY.md` for detailed docs.
