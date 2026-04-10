import { useState, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import './DeveloperPortalSection.css'

import featureImg from '../assets/images/feature-1.jpg'
import flashCut1 from '../assets/images/flash-cut1.png'
import flashCut2 from '../assets/images/flash-cut2.png'
import flashCut3 from '../assets/images/flash-cut3.png'
import chat1 from '../assets/images/chat-1.png'
import fullMobile from '../assets/images/full-mobile.png'
import m3 from '../assets/images/m3.png'
import personal from '../assets/images/personal.png'

const allCards = [
  {
    title: 'Exclusive Digital Launches and\nMarketing Platform',
    image: featureImg,
    subtitle: 'Connected Devices',
    badge: '5',
    size: 'tall',
    gridArea: '1 / 1 / span 2 / 2',
    scrollImage: true,
  },
  {
    title: 'Showcase Your Project to\n10M+ Users',
    image: flashCut1,
    subtitle: 'Automation',
    badge: '4 Active',
    size: 'medium',
    gridArea: '1 / 2 / 2 / 3',
  },
  {
    title: 'Showcase Your Project to\n10M+ Users',
    image: m3,
    subtitle: 'Automation',
    badge: '4 Active',
    size: 'medium',
    gridArea: '2 / 2 / 3 / 3',
  },
  {
    title: 'No Broker, No Commission: Direct\nchat with owners/developers. No\nintermediaries.',
    image: fullMobile,
    subtitle: 'Connected Devices',
    badge: '5',
    size: 'tall',
    gridArea: '1 / 3 / span 2 / 4',
    scrollImage: true,
  },
  {
    title: 'In-App Chat & Call: Talk directly\nto owners or builders — no 3rd party\nneeded.',
    image: chat1,
    subtitle: 'Automation',
    badge: '4 Active',
    size: 'tall',
    gridArea: '3 / 1 / span 2 / 2',
  },
  {
    title: 'Exclusive Offers: Get builder-only promotions & limited-time deals.',
    image: flashCut2,
    subtitle: 'Automation',
    badge: '4 Active',
    size: 'medium',
    gridArea: '3 / 2 / 4 / 3',
  },
  {
    title: 'Showcase Your Project to\n10M+ Users',
    image: flashCut3,
    subtitle: 'Automation',
    badge: '4 Active',
    size: 'medium',
    gridArea: '3 / 3 / 4 / 4',
  },
  {
    title: 'Instant Alerts: Get notified when\nyour dream property is listed.',
    image: flashCut3,
    subtitle: 'Automation',
    badge: '4 Active',
    size: 'medium',
    gridArea: '4 / 2 / 5 / 3',
  },
  {
    title: 'All Property Types: Homes, land,\nshops, offices, resale, new launch —\neverything under one roof.',
    image: personal,
    subtitle: 'Automation',
    badge: '4 Active',
    size: 'medium',
    gridArea: '4 / 3 / 5 / 4',
  },
]

function DevCard({ title, image, subtitle, badge, size, gridArea, scrollImage }) {
  const [hovered, setHovered] = useState(false)
  const [scrollDist, setScrollDist] = useState(0)
  const imageRef = useRef(null)
  const shellRef = useRef(null)

  const handleMouseEnter = () => {
    if (scrollImage && imageRef.current && shellRef.current) {
      const img = imageRef.current
      const shell = shellRef.current
      // Rendered image height based on its natural aspect ratio & current width
      const renderedImgHeight =
        img.naturalHeight * (img.offsetWidth / img.naturalWidth)
      const shellHeight = shell.offsetHeight
      const dist = Math.max(0, renderedImgHeight - shellHeight)
      setScrollDist(dist)
    }
    setHovered(true)
  }

  const handleMouseLeave = () => {
    setHovered(false)
  }

  // Duration scales with scroll distance so long images don't rush
  const scrollDuration = Math.max(2.5, scrollDist / 90)

  const scrollStyle = scrollImage
    ? {
        transform: hovered ? `translateY(-${scrollDist}px)` : 'translateY(0px)',
        transition: hovered
          ? `transform ${scrollDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
          : 'transform 0.9s ease',
      }
    : {}

  return (
    <div
      className={`dev-card dev-card--${size}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: hovered ? '#E84E3C' : '#1A1A1A',
        gridArea,
      }}
    >
      <p className="dev-card__title">{title}</p>

      <div
        className="dev-card__status"
        style={{ background: hovered ? 'rgba(255,255,255,0.15)' : '#2A2A2E' }}
      >
        <span
          className="dev-card__status-label"
          style={{ color: hovered ? '#FFFFFF' : '#CCCCCC' }}
        >
          {subtitle}
        </span>
        <span
          className="dev-card__badge"
          style={{
            background: hovered ? 'rgba(255,255,255,0.2)' : '#3A3A3E',
            color: hovered ? '#FFFFFF' : '#CCCCCC',
          }}
        >
          {badge}
        </span>
      </div>

      <div
        ref={shellRef}
        className={`dev-card__image-shell${scrollImage ? ' dev-card__image-shell--scroll' : ''}`}
      >
        <img
          ref={imageRef}
          src={image}
          alt={title}
          className={`dev-card__image${scrollImage ? ' dev-card__image--scroll' : ''}`}
          style={scrollStyle}
        />
      </div>
    </div>
  )
}

export default function DeveloperPortalSection() {
  return (
    <section className="dev-section" id="developer">
      <div className="dev-section__header">
        <span className="dev-section__pill">OUR FEATURES</span>
        <h2 className="dev-section__title">
          It's Portal Of<br />Real Estate Developers
        </h2>
        <p className="dev-section__sub">
          Transform Your Home into a Smarter,<br />
          More Efficient Space with Our Smart Home Solutions
        </p>
      </div>

      <div className="dev-grid-desktop">
        {allCards.map((card, i) => (
          <DevCard key={`desktop-card-${i}`} {...card} />
        ))}
      </div>

      <div className="dev-swiper-mobile">
        <Swiper
          modules={[Autoplay, Pagination]}
          slidesPerView={1.2}
          spaceBetween={16}
          centeredSlides={true}
          loop={true}
          grabCursor={true}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          style={{ paddingBottom: '40px' }}
        >
          {allCards.map((card, i) => (
            <SwiperSlide key={`sw-${i}`}>
              <DevCard {...card} gridArea="auto" />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}