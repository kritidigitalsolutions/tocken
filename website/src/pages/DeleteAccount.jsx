import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './LegalPages.css'

export default function DeleteAccount() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    reason: '',
    confirm: false,
  })

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!formData.confirm) {
      window.alert('Please confirm that you want to request account deletion.')
      return
    }

    const subject = encodeURIComponent('Delete Account Request - TOCKEN')
    const body = encodeURIComponent(
      `Full Name: ${formData.fullName}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nReason: ${formData.reason}`,
    )

    window.location.href = `mailto:support@tocken.in?subject=${subject}&body=${body}`
  }

  return (
    <div className="legal-page">
      <Navbar />
      <main className="legal-main">
        <div className="container">
          <header className="legal-hero">
            <h1>Delete Account Request</h1>
            <p>
              This page is provided to comply with Google Play requirements. You can request permanent
              deletion of your TOCKEN account and related personal data from here.
            </p>
          </header>

          <article className="legal-card">
            <section className="legal-section">
              <h2>How Deletion Works</h2>
              <ul className="legal-list">
                <li>Submit the request form below using your registered account details.</li>
                <li>Your identity may be verified through OTP or support confirmation.</li>
                <li>Once verified, account deletion is usually completed within 7 working days.</li>
                <li>Data that must be retained for legal or compliance reasons may be stored as required by law.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>Account Deletion Form</h2>
              <form className="delete-form" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email">Registered Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone">Registered Mobile Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="reason">Reason for Deletion (Optional)</label>
                  <textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="Please share your reason (optional)."
                  />
                </div>

                <label className="delete-form__checkbox" htmlFor="confirm">
                  <input
                    id="confirm"
                    name="confirm"
                    type="checkbox"
                    checked={formData.confirm}
                    onChange={handleChange}
                    required
                  />
                  <span>I confirm that I want to permanently delete my TOCKEN account.</span>
                </label>

                <div className="delete-form__actions">
                  <button type="submit" className="delete-form__submit">Send Deletion Request</button>
                  <a className="delete-form__mail-link" href="mailto:support@tocken.in">
                    Or email directly: support@tocken.in
                  </a>
                </div>
              </form>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}
