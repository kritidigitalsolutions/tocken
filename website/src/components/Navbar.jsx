import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'
import logo from '../assets/images/logo.png'
import './Navbar.css'

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Feature', href: '#feature' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '#blog' },
  { label: 'Support', href: '#support' },
]

export default function Navbar() {
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeLink, setActiveLink] = useState('Home')

  const getLinkHref = (anchor) => (isHomePage ? anchor : `/${anchor}`)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!isHomePage) {
      setActiveLink('')
      return undefined
    }

    const sections = navLinks.map((l) => ({
      label: l.label,
      el: document.querySelector(l.href),
    }))

    const onScroll = () => {
      const scrollPos = window.scrollY + 120
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].el && sections[i].el.offsetTop <= scrollPos) {
          setActiveLink(sections[i].label)
          break
        }
      }
    }

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHomePage])

  return (
    <>
      <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`} id="navbar">
        <div className="navbar__inner">
          {/* Logo */}
          <a href={getLinkHref('#home')} className="navbar__logo">
            <img src={logo} alt="TOCKEN" className="navbar__logo-img" />
          </a>

          {/* Desktop Nav Links with pipe separators */}
          <ul className="navbar__links">
            {navLinks.map((link, i) => (
              <li key={link.label} className="navbar__link-item">
                <a
                  href={getLinkHref(link.href)}
                  className={`navbar__link${activeLink === link.label ? ' navbar__link--active' : ''}`}
                  onClick={() => setActiveLink(link.label)}
                >
                  {link.label}
                </a>
                {i < navLinks.length - 1 && (
                  <span className="navbar__separator">|</span>
                )}
              </li>
            ))}
          </ul>

          {/* Developer Login Button */}
          <Link to="/developer/login" className="navbar__cta">
            Developer Login <ArrowRight size={16} strokeWidth={2.5} />
          </Link>

          {/* Mobile Hamburger */}
          <button
            className="navbar__hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`navbar__mobile-drawer${mobileOpen ? ' navbar__mobile-drawer--open' : ''}`}>
        <ul className="navbar__mobile-links">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={getLinkHref(link.href)}
                className={`navbar__mobile-link${activeLink === link.label ? ' navbar__mobile-link--active' : ''}`}
                onClick={() => {
                  setActiveLink(link.label)
                  setMobileOpen(false)
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <Link to="/developer/login" className="navbar__mobile-cta">
          Developer Login <ArrowRight size={16} />
        </Link>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="navbar__overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
