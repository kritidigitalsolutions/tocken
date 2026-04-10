import { motion } from 'framer-motion'
import appleBadge from '../assets/images/apple.svg'
import googleBadge from '../assets/images/google.svg'
import footerImage from '../assets/images/footer-image.png'
import ctaElement from '../assets/images/cta-element.svg'
import './CtaBanner.css'

export default function CtaBanner() {
  return (
    <section className="cta-section">
      <div className="cta-banner">

        {/* ── Circle rings background ── */}
        <div className="cta-banner__rings">
          <img src={ctaElement} alt="" />
        </div>

        {/* ── Left content ── */}
        <motion.div
          className="cta-banner__content"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.55 }}
        >
          <h2 className="cta-banner__title">Yaha Deal Hota Hai!</h2>
          <p className="cta-banner__subtitle">
            Discover the Latest Smart Home Innovations
          </p>
          <div className="cta-banner__badges">
            <a
              href="https://apps.apple.com/in/app/tocken/id6741801547"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-banner__badge"
            >
              <img src={appleBadge} alt="Download on App Store" />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.tocken.portal&hl=en_IN"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-banner__badge"
            >
              <img src={googleBadge} alt="Get it on Google Play" />
            </a>
          </div>
        </motion.div>

        {/* ── Right: combined phone artwork ── */}
        <motion.div
          className="cta-banner__phones"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.65, delay: 0.2 }}
        >
          <motion.img
            src={footerImage}
            alt="TOCKEN App Preview"
            className="cta-banner__phones-image"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

      </div>
    </section>
  )
}