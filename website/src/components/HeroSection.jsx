import { motion } from 'framer-motion'
import heroImg from '../assets/images/hero-img.png'
import hero1 from '../assets/images/hero1.png'
import hero2 from '../assets/images/hero2.png'
import appleBadge from '../assets/images/apple.svg'
import googleBadge from '../assets/images/google.svg'
import './HeroSection.css'

export default function HeroSection() {
  return (
    <section className="hero" id="home">
      {/* Background decorative elements */}
      <div className="hero__bg-ring" />
      <div className="hero__bg-blob" />

      <div className="hero__container">
        {/* ━━━ Text Content ━━━ */}
        <motion.div
          className="hero__content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <h1 className="hero__headline">
            List, Connect &amp; Close — The Future
            <br />
            of Real Estate is <span className="hero__headline-brand">TOCKEN</span>
          </h1>

          <motion.div
            className="hero__pill"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <span>Built For Buyers, Owners, Brokers &amp; Developers</span>
          </motion.div>

          <motion.div
            className="hero__badges"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hero__badge"
            >
              <img src={appleBadge} alt="Download on App Store" />
            </a>
            <a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hero__badge"
            >
              <img src={googleBadge} alt="Get it on Google Play" />
            </a>
          </motion.div>
        </motion.div>

        {/* ━━━ Hero Visual Area ━━━ */}
        <div className="hero__visual">
          {/* Top-Left Floating Card — Brooklyn */}
          <motion.div
            className="hero__float-card hero__float-card--top-left"
            initial={{ opacity: 0, x: -40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <img src={hero1} alt="Brooklyn — Commercial ₹75,00,000" />
          </motion.div>

          {/* Top-Right Floating Card — Lakeside Serenity */}
          <motion.div
            className="hero__float-card hero__float-card--top-right"
            initial={{ opacity: 0, x: 40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
          >
            <img src={hero2} alt="Lakeside Serenity — Land ₹85,00,000" />
          </motion.div>

          {/* Center Phone + Bottom Cards Composite */}
          <motion.div
            className="hero__phone-composite"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <img
              src={heroImg}
              alt="TOCKEN App — Phone mockup with property listings"
              className="hero__phone-img"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
