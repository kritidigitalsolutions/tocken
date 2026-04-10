import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { checkPaymentStatus } from '../../lib/developerApi'
import { getDeveloperToken } from '../../lib/developerSession'

export default function DeveloperPaymentStatus() {
  const token = getDeveloperToken()
  const navigate = useNavigate()
  const { merchantOrderId } = useParams()
  const [message, setMessage] = useState('Verifying payment status...')

  useEffect(() => {
    const verify = async () => {
      if (!merchantOrderId) {
        navigate('/developer/post-project?payment=failed', { replace: true })
        return
      }

      try {
        const res = await checkPaymentStatus(merchantOrderId, token)
        const state = res?.data?.status

        if (state === 'SUCCESS') {
          navigate(`/developer/post-project?payment=success&order=${encodeURIComponent(merchantOrderId)}`, {
            replace: true,
          })
          return
        }

        if (state === 'PENDING') {
          navigate(`/developer/post-project?payment=pending&order=${encodeURIComponent(merchantOrderId)}`, {
            replace: true,
          })
          return
        }

        navigate(`/developer/post-project?payment=failed&order=${encodeURIComponent(merchantOrderId)}`, {
          replace: true,
        })
      } catch {
        setMessage('Unable to verify payment. Redirecting to post project page...')
        navigate(`/developer/post-project?payment=failed&order=${encodeURIComponent(merchantOrderId)}`, {
          replace: true,
        })
      }
    }

    verify()
  }, [merchantOrderId, navigate, token])

  if (!token) {
    return <Navigate to="/developer/login" replace />
  }

  return (
    <section className="dev-page">
      <header className="dev-page__header">
        <h1>Payment Status</h1>
        <p>{message}</p>
      </header>
    </section>
  )
}
