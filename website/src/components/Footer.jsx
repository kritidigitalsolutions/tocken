import { motion } from 'framer-motion'
import logo from '../assets/images/logo.png'
import fbIcon from '../assets/images/fb.svg'
import instaIcon from '../assets/images/insta.svg'
import twitterIcon from '../assets/images/twitter.svg'
import tiktokIcon from '../assets/images/tiktok.svg'
import './Footer.css'

const footerColumns = [
  {
    title: 'Pages',
    links: [
      { label: 'About us', href: '#' },
      { label: 'Automate', href: '#' },
      { label: 'Usage Energy', href: '#' },
      { label: 'System Cyber', href: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQs', href: '#' },
      { label: 'Contact Support', href: '#' },
      { label: 'User manuals', href: '#' },
      { label: 'Forums', href: '#' },
    ],
  },
  {
    title: 'Career',
    links: [
      { label: 'Job listing', href: '#' },
      { label: 'Our Team', href: '#' },
      { label: 'Hiring Process', href: '#' },
      { label: 'Become Partner', href: '#' },
    ],
  },
  {
    title: 'Blog',
    links: [
      { label: 'Latest Post', href: '#' },
      { label: 'Product Reviews', href: '#' },
      { label: 'Company News', href: '#' },
      { label: 'Customer Stories', href: '#' },
    ],
  },
]

const socialLinks = [
  { icon: fbIcon, href: '#', label: 'Facebook' },
  { icon: instaIcon, href: '#', label: 'Instagram' },
  { icon: twitterIcon, href: '#', label: 'Twitter' },
  { icon: tiktokIcon, href: '#', label: 'TikTok' },
]

const bottomLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Security', href: '#' },
  { label: 'Data Record', href: '#' },
]

export default function Footer() {
  return (
    <footer className="footer" id="support">
      <div className="container">
        <motion.div
          className="footer__top"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          {/* Footer columns */}
          <div className="footer__columns">
            {footerColumns.map((column, index) => (
              <div key={index} className="footer__column">
                <h4 className="footer__column-title">{column.title}</h4>
                <ul className="footer__column-links">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href={link.href} className="footer__link">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Contact Us column */}
            <div className="footer__column footer__column--contact">
              <h4 className="footer__column-title">Contact us</h4>
              <p className="footer__address">
                <strong>Crackjack Creative Studio Pvt. Ltd.</strong><br />
                G2606, Sargam, Opposite Symphony IT Park, Nanded City, Pune 411068
              </p>
              <p className="footer__contact-info">
                Phone: <a href="tel:+919881237635" className="footer__contact-link">+91 98812 37635</a>
              </p>
              <p className="footer__contact-info">
                Email: <a href="mailto:support@tocken.in" className="footer__contact-link">support@tocken.in</a>
              </p>

              {/* Social icons */}
              <div className="footer__socials">
                {socialLinks.map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    className="footer__social-icon"
                    aria-label={social.label}
                  >
                    <img src={social.icon} alt={social.label} className="footer__social-img" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom bar */}
        <div className="footer__bottom">
          <div className="footer__bottom-inner">
            <a href="#home" className="footer__bottom-logo">
              <img src={logo} alt="TOCKEN" />
            </a>

            <div className="footer__bottom-links">
              {bottomLinks.map((link, i) => (
                <a key={i} href={link.href} className="footer__bottom-link">
                  {link.label}
                </a>
              ))}
            </div>

            <p className="footer__copyright">
              © 2025 (Crackjack Creative Studio Pvt Ltd). All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
