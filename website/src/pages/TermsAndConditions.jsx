import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './LegalPages.css'

const sections = [
  {
    title: 'User Responsibility',
    points: [
      '1.1 Users must provide accurate and lawful information when listing properties.',
      '1.2 The user confirms they are either the rightful owner or have legal authorization to list a property.',
      '1.3 TOCKEN is not liable for fraudulent listings or any disputes between parties.',
      '1.4 Users must comply with IT Act provisions, ensuring that no unlawful, obscene, or infringing content is uploaded.',
      '1.5 By using this application and completing OTP authentication, the user confirms that they have agreed to the Privacy Policy and Terms & Conditions of TOCKEN.',
      '1.6 By listing a property, the user authorizes TOCKEN to share their name and contact details with potential buyers or renters who show interest in the listed property.',
    ],
  },
  {
    title: 'Content Guidelines',
    points: [
      '2.1 Prohibited content includes misleading information, illegal properties, offensive material, and spam listings.',
      '2.2 TOCKEN reserves the right to remove any listing that violates these guidelines without prior notice.',
      '2.3 As per Section 67 of the IT Act, 2000, users are prohibited from posting obscene content on the platform.',
    ],
  },
  {
    title: 'Limitation of Liability',
    points: [
      '3.1 TOCKEN is not responsible for any loss, damage, or dispute arising from property transactions.',
      '3.2 Users engage in communication and transactions at their own risk.',
      '3.3 As per Section 72 of the IT Act, 2000, unauthorized disclosure of user information by any party will be dealt with legally.',
    ],
  },
  {
    title: 'Termination of Service',
    points: [
      '4.1 TOCKEN reserves the right to suspend or terminate user accounts for misusing or violating these terms.',
      '4.2 Accounts involved in fraudulent activities or legal violations may be reported to law enforcement authorities under the IT Act, 2000.',
    ],
  },
  {
    title: 'Compliance with Laws',
    points: [
      '5.1 TOCKEN complies with the Information Technology Act, 2000, and associated IT Rules, including data protection regulations.',
      '5.2 Users must adhere to all applicable laws when using the platform, including but not limited to cyber laws, consumer protection laws, and property laws.',
    ],
  },
  {
    title: 'Modifications',
    points: [
      '6.1 TOCKEN may update these terms at any time. Continued use of the platform constitutes acceptance of the updated terms.',
      '6.2 Any legal disputes arising from the use of TOCKEN shall be subject to the jurisdiction of Indian courts under the IT Act, 2000.',
    ],
  },
]

const refundPoints = [
  '1.1 Once a payment is successfully made for listing a property or purchasing any premium service on TOCKEN, it is non-refundable under any circumstances.',
  '2.1 Payments for property listings, promotions, or other services are final.',
  '2.2 No refunds will be processed for unused or unutilized services.',
  '2.3 Users are responsible for verifying all details before making a payment.',
  '2.4 In case of any technical issue or payment failure, users can contact TOCKEN Support for assistance.',
]

export default function TermsAndConditions() {
  return (
    <div className="legal-page">
      <Navbar />
      <main className="legal-main">
        <div className="container">
          <header className="legal-hero">
            <h1>Terms & Conditions</h1>
            <p>
              By using TOCKEN, users agree to abide by these policies and acknowledge that TOCKEN is
              only a property listing platform without involvement in property transactions.
            </p>
          </header>

          <article className="legal-card">
            {sections.map((section) => (
              <section key={section.title} className="legal-section">
                <h2>{section.title}</h2>
                <ul className="legal-list">
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </section>
            ))}

            <section className="legal-section">
              <h2>Refund Policy - TOCKEN</h2>
              <h3>No Refund Policy</h3>
              <ul className="legal-list">
                {refundPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <p className="legal-note">
                By using TOCKEN&apos;s services and making a payment, you acknowledge and agree to this No
                Refund Policy. For any queries, please contact us at support@tocken.in.
              </p>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}
