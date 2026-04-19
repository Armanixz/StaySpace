// #paymentGateway - STRIPE PAYMENT FEATURE — Stripe payment form component
import { useState, useEffect } from 'react';
import {
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import axios from 'axios';

const StripePaymentForm = ({
  propertyId,
  checkInDate,
  checkOutDate,
  pricePerNight,
  onPaymentSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [nights, setNights] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    // Calculate nights and total amount
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const calculatedNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const amount = calculatedNights * pricePerNight;
      
      setNights(calculatedNights);
      setTotalAmount(amount);
      
      // Create payment intent on mount or when dates change
      createPaymentIntent(calculatedNights, amount);
    }
  }, [checkInDate, checkOutDate, pricePerNight]);

  const createPaymentIntent = async (calculatedNights, amount) => {
    // #paymentGateway - Request PaymentIntent from backend (returns clientSecret for card confirmation)
    try {
      const response = await axios.post('/api/payments/create-intent', {
        propertyId,
        checkInDate,
        checkOutDate,
        pricePerNight,
      });
      
      setPaymentIntentId(response.data.paymentIntentId);
      setClientSecret(response.data.clientSecret);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize payment');
      console.error('Payment intent error:', err);
    }
  };

  // #paymentGateway - Process card payment: confirmCardPayment → post to backend confirm endpoint
  const handlePayment = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe is not loaded yet. Please try again.');
      return;
    }

    if (!clientSecret || !paymentIntentId) {
      setError('Payment initialization failed. Please try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Confirm card payment with Stripe
      const cardElement = elements.getElement(CardElement);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {},
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed. Please try again.');
        setLoading(false);
        return;
      }

      // Payment successful - now create booking on backend
      if (paymentIntent?.status === 'succeeded') {
        const response = await axios.post('/api/payments/confirm', {
          paymentIntentId: paymentIntent.id,
          propertyId,
          checkInDate,
          checkOutDate,
          pricePerNight,
        });

        if (response.data.booking) {
          setError(null);
          onPaymentSuccess(response.data.booking);
        }
      } else if (paymentIntent?.status === 'requires_action') {
        setError('Additional authentication required. Please complete the verification.');
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      setError(err.response?.data?.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  return (
    <div className="stripe-payment-form">
      <div className="payment-summary">
        <div className="summary-row">
          <span>Nightly Rate:</span>
          <span>${pricePerNight}</span>
        </div>
        <div className="summary-row">
          <span>Number of Nights:</span>
          <span>{nights}</span>
        </div>
        <div className="summary-row total">
          <span>Total Amount:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handlePayment} className="modal-form">
        <div className="form-group">
          <label>Card Information</label>
          <div className="card-element-wrapper">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading || !stripe}>
            {loading ? `Processing... $${totalAmount.toFixed(2)}` : `Pay $${totalAmount.toFixed(2)}`}
          </button>
        </div>
      </form>

      <p className="payment-disclaimer">
        💳 Your card information is securely processed by Stripe. Your card details never touch our servers.
      </p>
    </div>
  );
};

export default StripePaymentForm;
