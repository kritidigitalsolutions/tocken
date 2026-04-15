import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Smartphone, ShieldCheck } from 'lucide-react'
import { apiRequest } from '../lib/api'
import { isDeveloperLoggedIn, setDeveloperSession } from '../lib/developerSession'
import './DeveloperLogin.css'

function normalizeDigits(value) {
  return value.replace(/\D/g, '').slice(-10)
}

export default function DeveloperLogin() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const phoneWithCountry = useMemo(() => {
    if (phone.length !== 10) return ''
    return `+91${phone}`
  }, [phone])

  if (isDeveloperLoggedIn()) {
    return <Navigate to="/developer/dashboard" replace />
  }

  const handleSendOtp = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number.')
      return
    }

    try {
      setLoading(true)
      const response = await apiRequest('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      setMessage(response?.message || 'OTP sent successfully.')
      setStep('otp')
    } catch (requestError) {
      setError(requestError.message || 'Unable to send OTP right now.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (otp.length < 4) {
      setError('Please enter a valid OTP.')
      return
    }

    try {
      setLoading(true)
      const response = await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      })

      if (!response?.token) {
        setError('This phone number is not fully registered yet. Please complete user signup in the mobile app first, then login here.')
        return
      }

      setDeveloperSession(response.token, response.user || null)
      navigate('/developer/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'OTP verification failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dev-auth">
      <div className="dev-auth__panel">
        <Link className="dev-auth__back" to="/">
          <ArrowLeft size={16} /> Back to website
        </Link>

        <h1 className="dev-auth__title">Developer Login</h1>
        <p className="dev-auth__subtitle">
          Login with your phone number and OTP to access the project posting dashboard.
        </p>

        {step === 'phone' && (
          <form className="dev-auth__form" onSubmit={handleSendOtp}>
            <label htmlFor="phone" className="dev-auth__label">Phone Number</label>
            <div className="dev-auth__inputWrap">
              <span className="dev-auth__prefix">+91</span>
              <input
                id="phone"
                className="dev-auth__input"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10-digit number"
                value={phone}
                onChange={(e) => setPhone(normalizeDigits(e.target.value))}
              />
            </div>

            <button className="dev-auth__button" type="submit" disabled={loading}>
              <Smartphone size={16} /> {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form className="dev-auth__form" onSubmit={handleVerifyOtp}>
            <p className="dev-auth__hint">OTP sent to {phoneWithCountry}</p>

            <label htmlFor="otp" className="dev-auth__label">Enter OTP</label>
            <input
              id="otp"
              className="dev-auth__input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />

            <div className="dev-auth__actions">
              <button
                className="dev-auth__ghost"
                type="button"
                onClick={() => {
                  setStep('phone')
                  setOtp('')
                  setError('')
                  setMessage('')
                }}
                disabled={loading}
              >
                Change Number
              </button>

              <button className="dev-auth__button" type="submit" disabled={loading}>
                <ShieldCheck size={16} /> {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </div>
          </form>
        )}

        {message && <p className="dev-auth__message">{message}</p>}
        {error && <p className="dev-auth__error">{error}</p>}
      </div>
    </div>
  )
}
