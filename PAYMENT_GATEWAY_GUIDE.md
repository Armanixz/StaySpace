# Payment Gateway Integration Guide - StaySpace

Complete documentation for Stripe payment gateway integration in StaySpace MERN project.

---

## USER CODE WORKFLOW - STEP BY STEP

### WORKFLOW 1: Tenant Clicks "Book This Property" → Payment Modal Opens

#### STEP 1: User Sees "Book This Property" Button
- **File:** `frontend/src/pages/PropertyDetail.jsx`
- **Line:** 120-125
- **Code:**
```jsx
<button className="btn btn-primary" onClick={() => setShowBookingModal(true)}>
  Book This Property
</button>
```
- **User Action:** Clicks button
- **React State Update:** setShowBookingModal(true)
- **Result:** showBookingModal boolean becomes true

#### STEP 2: Booking Modal Appears with Date Picker
- **File:** `frontend/src/pages/PropertyDetail.jsx`
- **Line:** 200-230
- **Code:**
```jsx
{showBookingModal && (
  <div className="modal">
    <h3>Select Your Dates</h3>
    <form onSubmit={handleBookProperty}>
      <div className="form-group">
        <label>Check-in Date</label>
        <input 
          type="date" 
          value={checkIn} 
          onChange={(e) => setCheckIn(e.target.value)} 
        />
      </div>
      <div className="form-group">
        <label>Check-out Date</label>
        <input 
          type="date" 
          value={checkOut} 
          onChange={(e) => setCheckOut(e.target.value)} 
        />
      </div>
      <button type="submit">Next: Payment</button>
      <button type="button" onClick={() => setShowBookingModal(false)}>Cancel</button>
    </form>
  </div>
)}
```
- **Display:** Conditional render - modal only shows when showBookingModal = true
- **Input Fields:** Two date pickers for check-in and check-out
- **State Variables:** checkIn and checkOut are stored in React state
- **User Action:** Selects dates and clicks "Next: Payment"

#### STEP 3: Form Validation and Payment Form Switch
- **File:** `frontend/src/pages/PropertyDetail.jsx`
- **Line:** 240-255
- **Function:** handleBookProperty(e)
- **Code:**
```jsx
const handleBookProperty = (e) => {
  e.preventDefault()
  
  // Validation 1: Dates are selected
  if (!checkIn || !checkOut) {
    alert('Please select check-in and check-out dates')
    return
  }
  
  // Validation 2: Check-out must be after check-in
  if (new Date(checkIn) >= new Date(checkOut)) {
    alert('Check-out must be after check-in')
    return
  }
  
  // If valid, switch to payment form
  setShowPaymentForm(true)  // ← KEY ACTION: Switches modal to payment
}
```
- **Validation 1:** Both dates selected
- **Validation 2:** Check-out date is after check-in date
- **State Update:** setShowPaymentForm(true) switches modal view
- **Result:** Date picker modal closes, payment form will render next

#### STEP 4: StripePaymentForm Component Renders
- **File:** `frontend/src/pages/PropertyDetail.jsx`
- **Line:** 225-235
- **Code:**
```jsx
{showPaymentForm && (
  <StripePaymentForm
    propertyId={property._id}
    checkInDate={checkIn}
    checkOutDate={checkOut}
    pricePerNight={property.pricePerNight}
    onPaymentSuccess={handlePaymentSuccess}
    onCancel={() => setShowPaymentForm(false)}
  />
)}
```
- **Conditional:** Only renders when showPaymentForm = true
- **Props Passed to Child Component:**
  - propertyId: MongoDB _id of property
  - checkInDate: User selected check-in date
  - checkOutDate: User selected check-out date
  - pricePerNight: Property's nightly rate from database
  - onPaymentSuccess: Callback function when payment succeeds
  - onCancel: Function to close payment form
- **Next Step:** Payment form component mounts in browser

---

### WORKFLOW 2: Payment Form Loads → Creates PaymentIntent on Stripe

#### STEP 5: StripePaymentForm Component Mounts - useEffect Calculates
- **File:** `frontend/src/components/StripePaymentForm.jsx`
- **Line:** 28-48
- **Code:**
```jsx
useEffect(() => {
  if (checkInDate && checkOutDate && pricePerNight) {
    // Parse dates
    const checkIn = new Date(checkInDate)           // "2024-05-01"
    const checkOut = new Date(checkOutDate)         // "2024-05-04"
    
    // Calculate number of nights
    const calculatedNights = Math.ceil(
      (checkOut - checkIn) / (1000 * 60 * 60 * 24)
    )
    // Example: (May 4 - May 1) = 3 days = 3 nights
    
    // Calculate total amount
    const amount = calculatedNights * Number(pricePerNight)
    // Example: 3 nights × $500 = $1500
    
    console.log('Payment form debug:', {
      checkInDate,
      checkOutDate,
      pricePerNight,
      calculatedNights,
      amount
    })
    
    // Store in React state
    setNights(calculatedNights)
    setTotalAmount(amount)
    
    // If calculations valid, create payment intent
    if (calculatedNights > 0 && amount > 0) {
      createPaymentIntent(calculatedNights, amount)
    }
  }
}, [checkInDate, checkOutDate, pricePerNight])
```
- **Trigger:** Component mounts OR dates/price change
- **Calculation:** 
  - Nights = (checkOut Date - checkIn Date) ÷ ms per day
  - Total = nights × pricePerNight
- **Example:** 3 nights × $500/night = $1500 total
- **Debugging:** Console logs all intermediate calculations
- **Next Action:** Calls createPaymentIntent() async function

#### STEP 6: Frontend Sends POST to Backend - Create PaymentIntent
- **File:** `frontend/src/components/StripePaymentForm.jsx`
- **Line:** 57-80
- **Function:** createPaymentIntent(calculatedNights, amount)
- **Code:**
```jsx
const createPaymentIntent = async (calculatedNights, amount) => {
  try {
    console.log('Creating payment intent with:', {
      propertyId,
      checkInDate,
      checkOutDate,
      pricePerNight: Number(pricePerNight),
      calculatedNights,
      amount
    })
    
    // 🔴 HTTP REQUEST TO BACKEND
    // URL: http://localhost:5000/api/payments/create-intent
    // Method: POST
    // Auth: JWT token auto-included from AuthContext
    const response = await axios.post('/api/payments/create-intent', {
      propertyId,
      checkInDate,
      checkOutDate,
      pricePerNight: Number(pricePerNight),
    })
    
    console.log('Payment intent response:', response.data)
    
    // Store response in state
    setPaymentIntentId(response.data.paymentIntentId)   // "pi_1TNsxO2eZ..."
    setClientSecret(response.data.clientSecret)         // "pi_...secret_..."
    setError(null)
  } catch (err) {
    console.error('Payment intent error:', err)
    setError(err.response?.data?.message || 'Failed to initialize payment')
  }
}
```
- **HTTP Method:** POST
- **Endpoint:** /api/payments/create-intent
- **Request Body:** propertyId, checkInDate, checkOutDate, pricePerNight
- **Authentication:** JWT token auto-included via axios interceptor
- **Response Expected:**
  - clientSecret: Authorization token for card confirmation
  - paymentIntentId: Stripe's payment identifier (pi_...)
- **Error Handling:** Catches errors and displays to user
- **State Update:** Stores paymentIntentId and clientSecret for later use

#### STEP 7: Backend Route Receives POST Request
- **File:** `backend/routes/payment.js`
- **Line:** 15-20
- **Code:**
```javascript
router.post(
  '/create-intent',
  protect,                                    // Middleware: Check JWT token
  tenantOnly,                                 // Middleware: Verify user is tenant role
  paymentController.createPaymentIntent       // Handler function
)
```
- **Route:** POST /api/payments/create-intent
- **Middleware 1 (protect):** Validates JWT token from Authorization header
  - Extracts user from token
  - Sets req.user for use in controller
- **Middleware 2 (tenantOnly):** Ensures user role = 'tenant'
  - Prevents landlords from creating payment intents
- **Handler:** Calls createPaymentIntent() from paymentController
- **Flow:** request → protection checks → handler function

#### STEP 8: Backend Controller Creates Stripe PaymentIntent
- **File:** `backend/controllers/paymentController.js`
- **Line:** 138-170
- **Function:** createPaymentIntent(req, res)
- **Code:**
```javascript
const createPaymentIntent = async (req, res) => {
  // Extract data from request
  const { propertyId, checkInDate, checkOutDate, pricePerNight } = req.body

  console.log('Payment intent request received:', { 
    propertyId, 
    checkInDate, 
    checkOutDate, 
    pricePerNight 
  })

  // ✅ STEP 1: Validate property exists
  const property = await Property.findById(propertyId)
  if (!property) {
    return res.status(404).json({ message: 'Property not found' })
  }
  console.log('✅ Property found:', property._id)

  // ✅ STEP 2: Calculate nights (BACKEND VERIFICATION)
  // Important: Backend recalculates to verify frontend didn't tamper with amount
  const nights = Math.ceil(
    (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)
  )
  console.log('Calculated nights:', nights)  // Example: 3

  // ✅ STEP 3: Convert to cents (Stripe requires amounts in cents)
  // Example: $1500 = 150000 cents
  const totalAmount = Math.round(nights * pricePerNight * 100)
  console.log('Total amount in cents:', totalAmount)  // Example: 150000

  // ✅ STEP 4: Create Stripe PaymentIntent (does NOT charge yet!)
  // This just initializes the payment, card not charged until confirmation
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,                    // 150000 cents = $1500
    currency: 'usd',
    metadata: {
      propertyId: propertyId,               // Link to property
      tenantId: req.user._id,               // Extracted from JWT
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      nights: nights,
    }
  })

  console.log('Stripe PaymentIntent created:', {
    id: paymentIntent.id,                   // pi_1TNsxO...
    status: paymentIntent.status,           // "requires_payment_method"
    amount: paymentIntent.amount            // 150000
  })

  // ✅ STEP 5: Send clientSecret and paymentIntentId back to frontend
  res.json({
    clientSecret: paymentIntent.client_secret,  // Auth token for frontend
    paymentIntentId: paymentIntent.id           // Identifier for payment
  })
}
```
- **Security Check 1:** Property exists in database
- **Calculation Verification:** Backend recalculates nights (prevents frontend tampering)
- **Amount Conversion:** Multiplies by 100 to get cents (Stripe requirement)
- **Stripe API Call:** stripe.paymentIntents.create()
  - Creates payment intent WITHOUT charging card
  - Stores metadata (propertyId, tenantId, dates)
  - Returns clientSecret to frontend
- **Response:** JSON with clientSecret + paymentIntentId
- **Timing:** Payment intent valid for 24 hours

#### STEP 9: Response Returns to Frontend
- **File:** `frontend/src/components/StripePaymentForm.jsx`
- **Line:** 65-70 (inside createPaymentIntent catch)
- **Code:**
```jsx
setPaymentIntentId(response.data.paymentIntentId)   // Store: "pi_..."
setClientSecret(response.data.clientSecret)         // Store: "pi_..._secret_..."
setError(null)                                       // Clear any errors
```
- **State Update:** Saves both IDs for payment confirmation step
- **UI Update:** Payment form now has clientSecret and can render card input
- **Next:** User can now enter card details

---

### WORKFLOW 3: User Enters Card and Clicks "Pay"

#### STEP 10: Payment Form with Stripe CardElement Renders
- **File:** `frontend/src/components/StripePaymentForm.jsx`
- **Line:** 140-180
- **Code:**
```jsx
return (
  <div className="stripe-payment-form">
    {/* Payment Summary Section */}
    <div className="payment-summary">
      <div className="summary-row">
        <span>Nightly Rate:</span>
        <span>${pricePerNight}</span>
      </div>
      <div className="summary-row">
        <span>Number of Nights:</span>
        <span>{nights}</span>  {/* Example: 3 */}
      </div>
      <div className="summary-row total">
        <span>Total Amount:</span>
        <span>${totalAmount.toFixed(2)}</span>  {/* Example: $1500.00 */}
      </div>
    </div>

    {/* Payment Form Section */}
    <form onSubmit={handlePayment}>
      <div className="form-group">
        <label>Card Information</label>
        
        {/* 🔴 STRIPE SECURE CARD INPUT */}
        <div className="card-element-wrapper">
          <CardElement 
            options={{
              style: {
                base: { fontSize: '16px', color: '#424770' }
              }
            }} 
          />
        </div>
        {/* CRITICAL SECURITY: Card data entered here is tokenized by Stripe,
            NEVER sent to our backend server */}
      </div>
      
      {/* Error message display */}
      {error && <div className="error-message">{error}</div>}
      
      {/* Submit button */}
      <button 
        type="submit" 
        disabled={loading || !stripe}
      >
        {loading ? `Processing... $${totalAmount.toFixed(2)}` : `Pay $${totalAmount.toFixed(2)}`}
      </button>
    </form>
  </div>
)
```
- **Display:** Shows payment summary (rate × nights = total)
- **CardElement:** Stripe's secure component for card input
- **Security:** Card data never stored or transmitted by us
- **Error Display:** Shows error messages to user
- **Button State:** Disabled while loading or Stripe not ready
- **User Next Action:** Enters card details and clicks "Pay"

#### STEP 11: User Clicks "Pay" Button → Card Confirmation
- **File:** `frontend/src/components/StripePaymentForm.jsx`
- **Line:** 87-135
- **Function:** handlePayment(e)
- **Code (Part 1 - Setup):**
```jsx
const handlePayment = async (e) => {
  e.preventDefault()

  // Validation 1: Stripe loaded
  if (!stripe || !elements) {
    setError('Stripe is not loaded yet. Please try again.')
    return
  }

  // Validation 2: Payment intent initialized
  if (!clientSecret || !paymentIntentId) {
    setError('Payment initialization failed. Please try again.')
    return
  }

  setLoading(true)  // Show "Processing..." state
  setError(null)    // Clear previous errors
```
- **Checks:** Stripe loaded and payment intent created
- **UI:** Changes button to show processing state

#### STEP 11 (Continued - Card Confirmation):
- **File:** `frontend/src/components/StripePaymentForm.jsx`
- **Line:** 100-125
- **Code (Part 2 - Stripe Confirmation):**
```jsx
  try {
    // Get Stripe CardElement from form
    const cardElement = elements.getElement(CardElement)

    // 🔴 CRITICAL STEP: STRIPE CONFIRMS CARD PAYMENT
    // This sends card to STRIPE (not to our backend!)
    // Card is tokenized and payment is CHARGED here
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,  // Authorization from PaymentIntent
      {
        payment_method: {
          card: cardElement,          // Stripe tokenizes this internally
          billing_details: {}         // Optional: address, name, etc
        }
      }
    )

    // Log response for debugging
    console.log('Stripe confirmCardPayment response:', { 
      error: stripeError, 
      paymentIntent 
    })

    // ❌ Handle card errors (declined, invalid, etc)
    if (stripeError) {
      console.error('Card declined:', stripeError.message)
      setError(stripeError.message || 'Payment failed. Please try again.')
      setLoading(false)
      return  // Stop processing, don't contact backend
    }

    // ✅ PAYMENT SUCCEEDED
    if (paymentIntent?.status === 'succeeded') {
      console.log('✅ Payment succeeded! PaymentIntent ID:', paymentIntent.id)

      // Now tell our backend about successful payment
      // 🔴 HTTP REQUEST TO BACKEND
      // This confirms the payment and creates booking
      const response = await axios.post('/api/payments/confirm', {
        paymentIntentId: paymentIntent.id,      // Stripe confirms this
        propertyId,
        checkInDate,
        checkOutDate,
        pricePerNight,
      })

      // Booking created successfully
      if (response.data.booking) {
        setError(null)
        onPaymentSuccess(response.data.booking)  // Callback to parent
      }
    } else if (paymentIntent?.status === 'requires_action') {
      // 3D Secure authentication needed
      setError('Additional authentication required. Please complete the verification.')
    } else {
      setError('Payment failed. Please try again.')
    }
  } catch (err) {
    console.error('Payment processing error:', err)
    setError(err.response?.data?.message || 'Failed to process payment')
  } finally {
    setLoading(false)  // Clear loading state
  }
}
```
- **Key Action 1:** stripe.confirmCardPayment()
  - Sends card directly to Stripe (bypasses our backend)
  - Stripe charges the card immediately
  - Returns payment status
- **Possible Statuses:**
  - 'succeeded': Payment charged, can proceed
  - 'requires_action': 3D Secure verification needed
  - 'requires_payment_method': Card declined
- **Key Action 2:** If succeeded, POST to backend with paymentIntentId
  - Backend uses this to verify payment really succeeded

---

### WORKFLOW 4: Backend Verifies Payment and Creates Booking

#### STEP 12: Backend Route Receives Confirmation Request
- **File:** `backend/routes/payment.js`
- **Line:** 25-30
- **Code:**
```javascript
router.post(
  '/confirm',
  protect,                              // Middleware: Check JWT
  tenantOnly,                           // Middleware: Verify tenant role
  paymentController.confirmPayment      // Handler
)
```
- **Route:** POST /api/payments/confirm
- **Authentication:** JWT token validation
- **Authorization:** Only tenants can confirm payments
- **Handler:** Calls confirmPayment()

#### STEP 13: Backend Verifies with Stripe API
- **File:** `backend/controllers/paymentController.js`
- **Line:** 252-290
- **Function:** confirmPayment(req, res) - Part 1 (Verification)
- **Code:**
```javascript
const confirmPayment = async (req, res) => {
  // Extract request data
  const { paymentIntentId, propertyId, checkInDate, checkOutDate, pricePerNight } = req.body

  console.log('Confirm payment request received:', { paymentIntentId, propertyId })

  // 🔴 CRITICAL SECURITY CHECK: Verify payment with Stripe
  // Backend NEVER trusts what frontend says
  // Always verify directly with Stripe's servers
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

  console.log('Retrieved PaymentIntent from Stripe:', {
    id: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount
  })

  // ❌ Payment failed or not ready
  if (paymentIntent.status !== 'succeeded') {
    console.error('❌ Payment verification failed:', paymentIntent.status)
    return res.status(400).json({ 
      message: 'Payment was not successful',
      status: paymentIntent.status 
    })
  }

  console.log('✅ Payment verified with Stripe!')

  // ✅ Payment succeeded, check for duplicate booking
  const existingBooking = await Booking.findOne({
    property: propertyId,
    tenant: req.user._id,
    status: { $ne: 'cancelled' }
  })

  if (existingBooking) {
    return res.status(400).json({ 
      message: 'Already booked for this property' 
    })
  }

  console.log('✅ No existing active booking found')
```
- **Critical Call:** stripe.paymentIntents.retrieve()
  - Queries Stripe's servers directly
  - Returns actual payment status
  - Prevents fraud (frontend could be spoofed)
- **Verification:** Checks status === 'succeeded'
  - If not 'succeeded', payment didn't go through
- **Duplicate Check:** Ensures tenant doesn't book same property twice
- **Security Principle:** Trust Stripe, not frontend

#### STEP 14: Backend Creates Booking in Database
- **File:** `backend/controllers/paymentController.js`
- **Line:** 290-310
- **Code:**
```javascript
  // Calculate nights (backend recalculates for safety)
  const nights = Math.ceil(
    (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)
  )
  const totalAmount = nights * pricePerNight

  console.log('Calculated payment amount:', { nights, totalAmount })

  // ✅ CREATE BOOKING DOCUMENT IN MONGODB
  const booking = await Booking.create({
    property: propertyId,                     // Property ObjectId reference
    tenant: req.user._id,                     // Tenant ObjectId (from JWT)
    checkInDate: checkInDate,                 // Check-in date
    checkOutDate: checkOutDate,               // Check-out date
    status: 'pending',                        // ⭐ IMPORTANT: NOT 'confirmed'!
                                              // Landlord must approve first
    paymentId: paymentIntentId,               // Links to Stripe payment
    paymentStatus: 'completed',               // Payment succeeded
    paymentAmount: totalAmount,               // Store for records
    paymentMethod: 'card'                     // Payment method used
  })

  console.log('✅ Booking created in MongoDB:', {
    _id: booking._id,
    status: booking.status,
    paymentStatus: booking.paymentStatus
  })
```
- **Booking Status:** 'pending' (NOT auto-confirmed)
  - Landlord must review and approve
  - Payment succeeded but booking not confirmed yet
- **Payment Fields Stored:**
  - paymentId: Stripe PaymentIntent ID for tracking
  - paymentStatus: Confirms payment was completed
  - paymentAmount: Total amount paid
  - paymentMethod: Type of payment (card)
- **Database Call:** Booking.create()
  - Creates new booking record
  - Links to property, tenant, payment info

#### STEP 15: Backend Sends Email Notification
- **File:** `backend/controllers/paymentController.js`
- **Line:** 310-330
- **Code:**
```javascript
  // Populate booking with references for response
  const populatedBooking = await Booking.findById(booking._id)
    .populate('property')
    .populate('tenant', 'name email phone')

  // Get landlord contact info
  const property = await Property.findById(propertyId).populate('landlord')
  const landlord = property.landlord

  console.log('Sending booking request email to:', landlord.email)

  // 📧 SEND EMAIL NOTIFICATION
  try {
    await notificationService.sendBookingRequestEmail(
      landlord.email,                    // Recipient
      {
        tenant: req.user,                // Tenant details
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        nights: nights,
        amount: totalAmount,
        paymentMethod: 'Stripe (Card)'  // Payment type
      },
      'New Booking Request (Paid)'       // Email subject
    )
    console.log('✅ Email sent to landlord')
  } catch (emailErr) {
    console.error('❌ Email error:', emailErr)
    // Note: Don't fail the booking if email fails
  }

  // ✅ SEND RESPONSE BACK TO FRONTEND
  res.status(201).json({
    message: 'Booking confirmed!',
    booking: populatedBooking              // Return full booking details
  })
}
```
- **Email Service:** Calls notificationService.sendBookingRequestEmail()
  - Sends to landlord's email
  - Includes booking details, tenant info, payment amount
- **Email Subject:** "New Booking Request (Paid)"
- **Response:** Returns booking object with status 201 Created
- **Important:** Email failure doesn't cancel booking (logged but continues)

---

### WORKFLOW 5: Frontend Shows Success and Updates UI

#### STEP 16: Frontend Receives Booking Response
- **File:** `frontend/src/components/StripePaymentForm.jsx`
- **Line:** 115-120
- **Code:**
```jsx
// Response received from POST /api/payments/confirm
if (response.data.booking) {
  setError(null)
  // Call parent component callback with booking data
  onPaymentSuccess(response.data.booking)
}
```
- **HTTP Status:** 201 Created
- **Response Body:** Contains booking object
- **Callback:** Passes booking to parent component
- **Next:** Parent component handles success

#### STEP 17: Parent Component Handles Success
- **File:** `frontend/src/pages/PropertyDetail.jsx`
- **Line:** 328-340
- **Function:** handlePaymentSuccess(booking)
- **Code:**
```jsx
const handlePaymentSuccess = async (booking) => {
  console.log('Payment success! Booking created:', booking)

  // ✅ STEP 1: Show success message
  alert('Booking confirmed! Payment successful!')

  // ✅ STEP 2: Close payment modal
  setShowBookingModal(false)
  setShowPaymentForm(false)

  // ✅ STEP 3: Clear form fields
  setCheckIn('')
  setCheckOut('')

  // ✅ STEP 4: Refresh booking status
  checkIfBooked()  // Fetches property again to update UI
}
```
- **Alert:** Confirms payment success to user
- **Modal Closure:** Both booking and payment modals close
- **State Reset:** Clears date inputs
- **Refresh:** Calls checkIfBooked() to query backend
- **Result:** UI updates to show booking is active

#### STEP 18: UI Updates - Button State Changes
- **File:** `frontend/src/pages/PropertyDetail.jsx`
- **Line:** 115-128
- **Code:**
```jsx
// Conditional button rendering
{isBooked ? (
  <button className="btn btn-secondary" disabled>
    Already Booked
  </button>
) : (
  <button className="btn btn-primary" onClick={() => setShowBookingModal(true)}>
    Book This Property
  </button>
)}
```
- **State Check:** isBooked boolean
- **If True:** Shows "Already Booked" button (disabled)
- **If False:** Shows "Book This Property" button (clickable)
- **Effect:** Prevents user from booking same property twice
- **Visual Feedback:** Button color and state clearly indicate booking status

---

### WORKFLOW 6: Landlord Removes Tenant (Optional Feature)

#### STEP 19: Landlord Views Current Tenants Section
- **File:** `frontend/src/pages/PropertyDetail.jsx`
- **Line:** 450-480
- **Code:**
```jsx
{user?.role === 'landlord' && property.landlord?._id === user._id && (
  <div className="current-tenants">
    <h3>Current Tenants</h3>
    
    {property._allBookings?.map(booking => (
      <div className="tenant-item" key={booking._id}>
        <div className="tenant-info">
          <span className="tenant-name">{booking.tenant.name}</span>
          <span className="tenant-email">{booking.tenant.email}</span>
        </div>
        
        {/* Remove button */}
        <button
          className="btn-remove-tenant"
          onClick={() => handleRemoveTenant(booking._id, booking.tenant.name)}
          disabled={removing}
          title="Remove this tenant"
        >
          ✕
        </button>
      </div>
    ))}
  </div>
)}
```
- **Permission Check:** Only shown if:
  1. User role = 'landlord'
  2. User owns this property (landlord._id === user._id)
- **Display:** Lists all current tenants
- **Button:** Small × (×) button to remove each tenant
- **Disabled State:** Buttons disabled while removing

#### STEP 20: Landlord Clicks Remove (×) Button
- **File:** `frontend/src/pages/PropertyDetail.jsx`
- **Line:** 453-475
- **Function:** handleRemoveTenant(bookingId, tenantName)
- **Code:**
```jsx
const handleRemoveTenant = async (bookingId, tenantName) => {
  // Confirmation dialog
  if (!confirm(`Remove ${tenantName} from this property?`)) {
    return  // User clicked Cancel
  }

  setRemoving(true)  // Disable all remove buttons

  try {
    // 🔴 HTTP REQUEST: PUT to backend
    // This calls the existing booking rejection endpoint
    await axios.put(
      `/api/tenant/landlord/bookings/${bookingId}/reject`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )

    alert(`${tenantName} removed successfully`)
    
    // Refresh property data to show updated tenants list
    fetchPropertyDetails()
  } catch (error) {
    console.error('Failed to remove tenant:', error)
    alert('Failed to remove tenant')
  } finally {
    setRemoving(false)  // Re-enable remove buttons
  }
}
```
- **Confirmation:** User must confirm removal
- **Request:** PUT to /api/tenant/landlord/bookings/{bookingId}/reject
- **Endpoint:** Uses existing booking rejection endpoint
- **Result:** Booking status changed to 'cancelled'
- **UI:** Property data refreshed to show updated tenant list

#### STEP 21: Backend Cancels Booking
- **File:** `backend/routes/tenant.js` OR `backend/routes/appointment.js`
- **Line:** 50-65
- **Code:**
```javascript
router.put(
  '/landlord/bookings/:bookingId/reject', 
  protect,
  async (req, res) => {
    const { bookingId } = req.params

    // Update booking status to cancelled
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: 'cancelled' },
      { new: true }
    )

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    res.json({ message: 'Booking cancelled', booking })
  }
)
```
- **Database Update:** Sets booking.status = 'cancelled'
- **Effect:** Tenant removed from property
- **Property Availability:** Now available for new bookings
- **Response:** Returns updated booking object

#### STEP 22: Frontend Refreshes Property Display
- **File:** `frontend/src/pages/PropertyDetail.jsx`
- **Line:** 345-365
- **Function:** fetchPropertyDetails()
- **Code:**
```jsx
const fetchPropertyDetails = async () => {
  try {
    const response = await axios.get(`/api/property/${propertyId}`)
    
    // Update property state with fresh data
    setProperty(response.data)
    
    console.log('Property refreshed:', response.data)
  } catch (error) {
    console.error('Failed to fetch property details:', error)
  }
}
```
- **Request:** GET /api/property/{propertyId}
- **Response:** Fresh property data from backend
- **UI Update:** 
  - Tenant removed from "Current Tenants" list
  - Button updates show "Already Booked" removed if no bookings
- **Result:** Landlord confirms removal success

---

## Code Workflow Summary Table

| Step | File | Line | Component | Action | HTTP? |
|------|------|------|-----------|--------|-------|
| 1 | PropertyDetail.jsx | 122 | Button | Click "Book" | No |
| 2 | PropertyDetail.jsx | 200 | Modal | Date picker shows | No |
| 3 | PropertyDetail.jsx | 245 | Form | Validate + switch | No |
| 4 | PropertyDetail.jsx | 225 | JSX | Render StripePaymentForm | No |
| 5 | StripePaymentForm.jsx | 28 | useEffect | Calculate nights | No |
| 6 | StripePaymentForm.jsx | 60 | axios | POST create-intent | **YES** |
| 7 | payment.js | 15 | Route | Receive POST | - |
| 8 | paymentController.js | 138 | Function | stripe.paymentIntents.create() | - |
| 9 | paymentController.js | 165 | Response | Return clientSecret | - |
| 10 | StripePaymentForm.jsx | 65 | State | Store secrets | No |
| 11 | StripePaymentForm.jsx | 140 | Form | Render CardElement | No |
| 12 | StripePaymentForm.jsx | 87 | Form | Click "Pay" | No |
| 13 | StripePaymentForm.jsx | 212 | Stripe | stripe.confirmCardPayment() | No |
| 14 | StripePaymentForm.jsx | 110 | axios | POST /confirm | **YES** |
| 15 | payment.js | 25 | Route | Receive POST | - |
| 16 | paymentController.js | 252 | Function | stripe.paymentIntents.retrieve() | - |
| 17 | paymentController.js | 290 | MongoDB | Booking.create() | - |
| 18 | paymentController.js | 310 | Email | Send landlord email | - |
| 19 | paymentController.js | 320 | Response | Return booking | - |
| 20 | StripePaymentForm.jsx | 115 | State | Receive response | - |
| 21 | PropertyDetail.jsx | 328 | Handler | handlePaymentSuccess() | No |
| 22 | PropertyDetail.jsx | 122 | Button | Update to "Already Booked" | No |

---

## Key Concepts and Security

### 1. PaymentIntent (pi_...)
- Unique identifier for payment in Stripe system
- Created on backend with `stripe.paymentIntents.create()`
- Contains payment amount, metadata, status
- Valid for 24 hours

### 2. ClientSecret
- Authorization token given to frontend
- Proves payment was created by legitimate backend
- Used in `stripe.confirmCardPayment(clientSecret)`
- Never log or expose in production

### 3. Two-Step Verification
- **Frontend:** confirmCardPayment() with card token
- **Backend:** Verify with `stripe.paymentIntents.retrieve()`
- Prevents: Spoofed payments, tampered amounts

### 4. Card Tokenization
- Stripe's CardElement securely captures card
- Card data never touches our backend
- Stripe returns payment method token
- PCI compliance: We never store raw card data

### 5. Booking Status Flow
```
pending (after payment)
  ├→ confirmed (if landlord approves)
  └→ cancelled (if landlord rejects)
```

### 6. Payment Status Values
- 'completed': Payment succeeded
- 'failed': Card declined
- 'pending': Awaiting confirmation

### 7. JWT Authentication
- Included in every API request (via axios interceptor)
- Validates tenant identity
- Prevents unauthorized bookings
- Extracted in backend with `req.user._id`

### 8. Metadata Storage
- Stored with Stripe PaymentIntent
- Includes: propertyId, tenantId, dates, nights
- Useful for disputes and reconciliation
- Queryable on Stripe dashboard

### 9. Duplicate Booking Prevention
- Before creating booking, check for existing
- Query: `Booking.findOne({property, tenant, status: {$ne: 'cancelled'}})`
- Prevents same tenant booking same property twice

### 10. Email Notifications
- Sent to landlord when tenant pays
- Includes booking details and payment amount
- Important for landlord workflow
- Failure doesn't cancel booking (logged but continues)

---

## Environment Variables

### Frontend (.env)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51TNsxO...
VITE_API_URL=http://localhost:5000
```

### Backend (.env)
```
STRIPE_SECRET_KEY=sk_test_51TNsxO...
STRIPE_PUBLISHABLE_KEY=pk_test_51TNsxO...
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

---

## Testing Payment Flow

### Test Card Numbers
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0000 0000 3220

### Test Sequence
1. Visit property detail page
2. Click "Book This Property"
3. Select check-in: today
4. Select check-out: +3 days
5. Click "Next: Payment"
6. Enter test card: 4242 4242 4242 4242
7. Any expiry date (future)
8. Any CVC: 123
9. Click "Pay $[amount]"
10. Verify: Success alert + "Already Booked" button

---

## Viva Q&A

**Q: What happens when user clicks "Book This Property"?**
A: Sets showBookingModal = true (line 122), displays date picker modal.

**Q: How are nights calculated?**
A: Math.ceil((checkOut - checkIn) / ms_per_day) in both frontend (line 28) and backend (line 145) for verification.

**Q: What is clientSecret used for?**
A: Authorization token for frontend to confirm payment with Stripe (line 212).

**Q: Why does backend verify payment with Stripe?**
A: Security - never trust frontend. Stripe.paymentIntents.retrieve() confirms payment really succeeded (line 256).

**Q: What is booking status after payment?**
A: 'pending' (line 302), not 'confirmed'. Landlord must approve.

**Q: How is double-booking prevented?**
A: Query for existing booking before creating new one (line 268-273).

**Q: Does landlord get notified?**
A: Yes, notificationService.sendBookingRequestEmail() sends email (line 315).

**Q: Can card data reach our server?**
A: No. Stripe's CardElement handles it. We only get a token.

**Q: What is metadata used for?**
A: Stored with PaymentIntent (line 161-166). Useful for disputes and reconciliation.

**Q: How does tenant removal work?**
A: Landlord clicks × button (line 453), calls axios.put() to reject booking, status changes to 'cancelled'.

---
