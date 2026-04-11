import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './LegalPages.css'

const sections = [
  {
    title: 'Information Collection',
    points: [
      'TOCKEN collects user information such as name, contact details, and property-related information provided voluntarily.',
      'The application may store communication history from in-app chat and log user activity for security and service improvement purposes.',
      'As per the Information Technology Act, 2000, and the IT Rules, 2011, personal information will be collected and stored lawfully with user consent.',
    ],
  },
  {
    title: 'Use of Information',
    points: [
      'The information is used to display property listings, facilitate communication between users, and improve platform functionality.',
      'TOCKEN does not sell or share personal information with third parties except as required by law or for security purposes.',
      'As per Section 43A of the IT Act, TOCKEN takes reasonable measures to protect sensitive user information from unauthorized access.',
    ],
  },
  {
    title: 'Data Security',
    points: [
      'TOCKEN implements industry-standard security measures to protect user data, including encryption and access controls.',
      'While we strive to ensure data protection, TOCKEN is not liable for any unauthorized access or data breaches beyond our control.',
      'Users are encouraged to report security concerns, which will be addressed in accordance with IT security protocols.',
    ],
  },
  {
    title: 'User Rights',
    points: [
      'Users may update or delete their personal information within the application settings.',
      'Users can report misuse or unauthorized listings for review and possible removal.',
      'As per Section 79 of the IT Act, TOCKEN operates as an intermediary and does not assume liability for third-party content unless notified.',
    ],
  },
]

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <Navbar />
      <main className="legal-main">
        <div className="container">
          <header className="legal-hero">
            <h1>Privacy Policy</h1>
            <p>
              This policy explains how TOCKEN collects, uses, and protects user information in accordance
              with applicable Indian laws.
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
          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}
