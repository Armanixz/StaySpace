import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const { register, verifyCode, resendCode, user } = useAuth()
  const navigate = useNavigate()

  // 2-STEP VERIFICATION FEATURE — Step tracking
  const [step, setStep] = useState('form') // 'form' or 'verification'
  const [verificationEmail, setVerificationEmail] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'tenant',
  })

  const [verificationData, setVerificationData] = useState({
    code: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 2-STEP VERIFICATION FEATURE — Timer state
  const [resendTimeLeft, setResendTimeLeft] = useState(60) // 1 minute for resend countdown
  const [resendTimerActive, setResendTimerActive] = useState(false)
  const [codeExpireTimeLeft, setCodeExpireTimeLeft] = useState(600) // 10 minutes for code expiry
  const [codeExpireTimerActive, setCodeExpireTimerActive] = useState(false)

  if (user) {
    navigate('/')
    return null
  }

  // 2-STEP VERIFICATION FEATURE — Timer effects
  // Resend button countdown (1 minute)
  useEffect(() => {
    if (!resendTimerActive || resendTimeLeft <= 0) {
      setResendTimerActive(false)
      setResendTimeLeft(0)
      return
    }

    const timer = setInterval(() => {
      setResendTimeLeft((prev) => {
        if (prev <= 1) {
          setResendTimerActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [resendTimerActive, resendTimeLeft])

  // Code expiry countdown (10 minutes)
  useEffect(() => {
    if (!codeExpireTimerActive || codeExpireTimeLeft <= 0) {
      setCodeExpireTimerActive(false)
      setCodeExpireTimeLeft(0)
      return
    }

    const timer = setInterval(() => {
      setCodeExpireTimeLeft((prev) => {
        if (prev <= 1) {
          setCodeExpireTimerActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [codeExpireTimerActive, codeExpireTimeLeft])

  // Helper: format time in MM:SS format
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleVerificationChange = (e) => {
    setVerificationData({ ...verificationData, [e.target.name]: e.target.value })
    setError('')
  }

  // 2-STEP VERIFICATION FEATURE — Step 1: Submit form
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match')
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters')
    }

    setLoading(true)
    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role,
      })
      
      setVerificationEmail(result.email)
      setStep('verification')
      setResendTimerActive(true)
      setResendTimeLeft(60) // Start 1-minute countdown for resend button
      setCodeExpireTimerActive(true)
      setCodeExpireTimeLeft(600) // Start 10-minute countdown for code expiry
      setError('')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Registration failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // 2-STEP VERIFICATION FEATURE — Step 2: Verify code
  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setError('')

    if (!verificationData.code || verificationData.code.length !== 6) {
      return setError('Please enter a valid 6-digit code')
    }

    setLoading(true)
    try {
      await verifyCode(verificationEmail, verificationData.code)
      navigate('/')
    } catch (err) {
      setError(
        err.response?.data?.message || 'Verification failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // 2-STEP VERIFICATION FEATURE — Resend code
  const handleResendCode = async () => {
    setError('')
    setLoading(true)
    try {
      await resendCode(verificationEmail)
      setResendTimerActive(true)
      setResendTimeLeft(60) // Reset 1-minute countdown
      setCodeExpireTimerActive(true)
      setCodeExpireTimeLeft(600) // Reset 10-minute countdown
      setError('')
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to resend code. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // 2-STEP VERIFICATION FEATURE — Go back to form
  const handleBackToForm = () => {
    setStep('form')
    setVerificationData({ code: '' })
    setResendTimeLeft(60)
    setResendTimerActive(false)
    setCodeExpireTimeLeft(600)
    setCodeExpireTimerActive(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Link to="/">
            Stay<span>Space</span>
          </Link>
        </div>

        {step === 'form' ? (
          <>
            <h2>Create your account</h2>
            <p className="auth-subtitle">Join thousands finding their perfect space</p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="01XXXXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>I am a...</label>
                <div className="role-selector">
                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="tenant"
                      checked={formData.role === 'tenant'}
                      onChange={handleChange}
                    />
                    <span className="role-label">
                      <span className="role-icon">🏠</span>
                      <span className="role-name">Tenant</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Looking to rent
                      </span>
                    </span>
                  </label>
                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="landlord"
                      checked={formData.role === 'landlord'}
                      onChange={handleChange}
                    />
                    <span className="role-label">
                      <span className="role-icon">🏢</span>
                      <span className="role-name">Landlord</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Listing property
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Sending verification code...' : 'Create Account'}
              </button>
            </form>

            <p className="auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </>
        ) : (
          <>
            <h2>Verify your email</h2>
            <p className="auth-subtitle">
              We've sent a verification code to <strong>{verificationEmail}</strong>
            </p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleVerifyCode}>
              <div className="form-group">
                <label>Verification Code</label>
                <input
                  type="text"
                  name="code"
                  placeholder="000000"
                  value={verificationData.code}
                  onChange={handleVerificationChange}
                  maxLength="6"
                  pattern="[0-9]{6}"
                  required
                  style={{
                    fontSize: '24px',
                    letterSpacing: '10px',
                    textAlign: 'center',
                  }}
                />
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '8px' }}>
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {/* 2-STEP VERIFICATION FEATURE — Timer display */}
              <div
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: '#f1f5f9',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#64748b',
                  }}
                >
                  Code expires in:{' '}
                  <strong
                    style={{
                      color: codeExpireTimeLeft <= 60 ? '#dc2626' : '#1e293b',
                      fontSize: '18px',
                    }}
                  >
                    {formatTime(codeExpireTimeLeft)}
                  </strong>
                </p>
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={loading || codeExpireTimeLeft === 0}
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            {/* 2-STEP VERIFICATION FEATURE — Resend button */}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              {codeExpireTimeLeft === 0 ? (
                <button
                  onClick={handleResendCode}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textDecoration: 'underline',
                    padding: '0',
                  }}
                >
                  {loading ? 'Sending...' : 'Code expired? Send again'}
                </button>
              ) : (
                <>
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      margin: '0 0 8px 0',
                    }}
                  >
                    Didn't receive the code?
                  </p>
                  {/* 2-STEP VERIFICATION FEATURE — Resend button active after 1 minute */}
                  {resendTimeLeft > 0 ? (
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#cbd5e1',
                        margin: '0',
                      }}
                    >
                      Resend available in{' '}
                      <strong style={{ color: '#94a3b8' }}>
                        {formatTime(resendTimeLeft)}
                      </strong>
                    </p>
                  ) : (
                    <button
                      onClick={handleResendCode}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: '0',
                        fontSize: '12px',
                      }}
                    >
                      {loading ? 'Sending...' : 'Resend code'}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* 2-STEP VERIFICATION FEATURE — Back button */}
            <button
              onClick={handleBackToForm}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px',
                background: 'none',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Back to registration
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default Register
