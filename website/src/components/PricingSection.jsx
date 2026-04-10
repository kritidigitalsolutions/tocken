import { useState } from 'react'
import {
  ClipboardList,
  Eye,
  CalendarDays,
  Map,
  Mail,
  MessageCircle,
  Users,
  Video,
  MessageSquareText,
  User,
  Monitor,
  Cog,
  Phone,
  Rocket,
  FolderLock,
  CheckCircle2,
  XCircle,
  Zap,
  Image,
  Target,
  BarChart3,
  ShieldCheck,
  Settings,
  Upload,
  Bot,
  Tag,
  Megaphone,
} from 'lucide-react'
import './PricingSection.css'

/* ── UPCOMING FEATURES ── */
const upcomingLeftFeatures = [
  { icon: ClipboardList, text: 'Promising Future Features' },
  { icon: Eye,           text: 'AI-Powered Buyer Matching Engine' },
  { icon: CalendarDays,  text: 'Auto-Optimising Listing AI' },
  { icon: Map,           text: 'Hyperlocal Buyer Targeting (Pincode level)' },
  { icon: Mail,          text: 'Auto Lead Follow-up Engine' },
  { icon: MessageCircle, text: 'Chatbot for Buyer Queries (24×7)' },
  { icon: Users,         text: 'Verified Buyer Badge System' },
  { icon: Video,         text: 'Virtual Site Visit Tool (360° + Voiceover)' },
  { icon: MessageSquareText, text: 'Real-Time Buyer Behaviour Heatmaps' },
  { icon: User,          text: 'Developer Sales Team Dashboard' },
  { icon: Monitor,       text: 'Auto CRM Sync (via API)' },
  { icon: Cog,           text: 'Smart Booking Funnel Tracking' },
  { icon: Phone,         text: 'Click-to-Call Tracking + Conversion Log' },
  { icon: Rocket,        text: 'TOCKEN Boost Campaigns (Paid Ads Support)' },
  { icon: User,          text: 'Intent-Based Buyer Retargeting' },
  { icon: FolderLock,    text: 'Secure Document Locker (RERA, Brochure)' },
]

const upcomingSixMonthsItems = [
  { text: '6 Months Listing',           status: 'check' },
  { text: 'Smart Match Suggestions',    status: 'cross' },
  { text: 'Headline & Price Suggestions', status: 'cross' },
  { text: 'Limited Reach',              status: 'cross' },
  { text: 'Email Follow-ups',           status: 'cross' },
  { text: 'No',                         status: 'cross' },
  { text: 'Email Verified',             status: 'cross' },
  { text: 'Hosted Virtual Tour',        status: 'cross' },
  { text: 'City-Level Data',            status: 'cross' },
  { text: 'Limited View',               status: 'cross' },
  { text: 'Export Available',           status: 'cross' },
  { text: 'Basic Milestone Analytics',  status: 'cross' },
  { text: 'No',                         status: 'cross' },
  { text: 'Eligible',                   status: 'cross' },
  { text: 'Eligible',                   status: 'cross' },
  { text: 'Eligible',                   status: 'cross' },
]

const upcomingOneYearItems = [
  { text: '1 Year Listing Plan',        status: 'check' },
  { text: 'Smart Match Suggestions',    status: 'check' },
  { text: 'Headline & Price Suggestions', status: 'check' },
  { text: 'Limited Reach',              status: 'check' },
  { text: 'Email Follow-ups',           status: 'check' },
  { text: 'Yes',                        status: 'check' },
  { text: 'Email Verified',             status: 'check' },
  { text: 'Hosted Virtual Tour',        status: 'check' },
  { text: 'City-Level Data',            status: 'check' },
  { text: 'Limited View',               status: 'check' },
  { text: 'Export Available',           status: 'check' },
  { text: 'Basic Milestone Analytics',  status: 'check' },
  { text: 'Yes',                        status: 'check' },
  { text: 'Eligible',                   status: 'check' },
  { text: 'Eligible',                   status: 'check' },
  { text: 'Eligible',                   status: 'check' },
]

/* ── CURRENT FEATURES ── */
const currentLeftFeatures = [
  { icon: ClipboardList, text: 'Plan Features' },
  { icon: Eye,           text: 'Project Listing Duration' },
  { icon: CalendarDays,  text: 'Number of Project' },
  { icon: Map,           text: 'Map View Listing' },
  { icon: Image,         text: 'High-Quality Image Gallery' },
  { icon: Target,        text: 'Project Promo Video Upload' },
  { icon: Users,         text: 'Category Exposure' },
  { icon: BarChart3,     text: 'Lead Analytics' },
  { icon: MessageCircle, text: 'Direct Chat with Buyer' },
  { icon: ShieldCheck,   text: 'Verified Project Badge' },
  { icon: Monitor,       text: 'Featured Project Promotion' },
  { icon: Settings,      text: 'Geo-Targeted Visibility' },
  { icon: Phone,         text: 'CRM Integration' },
  { icon: Cog,           text: 'Dedicated Support Manager' },
  { icon: Upload,        text: 'Lead Export' },
  { icon: Bot,           text: 'AI-Based Listing Optimisation' },
  { icon: Monitor,       text: 'Project Insights & User Heatmaps' },
  { icon: Tag,           text: 'Co-Branding with TOCKEN' },
  { icon: Megaphone,     text: 'One-to-One Promotion Feature' },
]

const currentSixMonthsItems = [
  { text: 'Basic',                      status: 'check' },
  { text: '6 Months',                   status: 'check' },
  { text: 'Single',                     status: 'check' },
  { text: 'Yes',                        status: 'check' },
  { text: '15 Images',                  status: 'check' },
  { text: 'No',                         status: 'cross' },
  { text: 'Residential + Commercial',   status: 'check' },
  { text: 'Basic',                      status: 'check' },
  { text: 'Enabled',                    status: 'check' },
  { text: 'Yes',                        status: 'check' },
  { text: '1 Campaign (30 Days)',       status: 'check' },
  { text: 'City-Level',                 status: 'check' },
  { text: 'No',                         status: 'cross' },
  { text: 'No',                         status: 'cross' },
  { text: 'CSV Download',               status: 'check' },
  { text: 'No',                         status: 'cross' },
  { text: 'No',                         status: 'cross' },
  { text: 'No',                         status: 'cross' },
  { text: 'Yes',                        status: 'check' },
]

const currentOneYearItems = [
  { text: 'Standard Plan',              status: 'check' },
  { text: '12 Months',                  status: 'check' },
  { text: 'Single',                     status: 'check' },
  { text: 'Yes',                        status: 'check' },
  { text: '30 Images + Video Tour',     status: 'check' },
  { text: '1 Video',                    status: 'check' },
  { text: 'Residential + Commercial',   status: 'check' },
  { text: 'Advanced Dashboard',         status: 'check' },
  { text: 'Enabled',                    status: 'check' },
  { text: 'Yes',                        status: 'check' },
  { text: '3 Campaigns (45 Days each)', status: 'check' },
  { text: 'City + Locality',            status: 'check' },
  { text: 'On Request',                 status: 'check' },
  { text: 'Yes',                        status: 'check' },
  { text: 'CSV Download',               status: 'check' },
  { text: 'CRM Export (on request)',    status: 'check' },
  { text: 'Yes (Copy + Title)',         status: 'check' },
  { text: 'Yes',                        status: 'check' },
  { text: 'Yes',                        status: 'check' },
]

function StatusIcon({ status }) {
  if (status === 'check') {
    return (
      <CheckCircle2
        size={18}
        className="pricing-status-icon pricing-status-icon--check"
      />
    )
  }
  return (
    <XCircle
      size={18}
      className="pricing-status-icon pricing-status-icon--cross"
    />
  )
}

export default function PricingSection() {
  const [activeTab, setActiveTab] = useState('current')

  const leftFeatures   = activeTab === 'current' ? currentLeftFeatures   : upcomingLeftFeatures
  const sixMonthsItems = activeTab === 'current' ? currentSixMonthsItems : upcomingSixMonthsItems
  const oneYearItems   = activeTab === 'current' ? currentOneYearItems   : upcomingOneYearItems

  return (
    <section className="pricing" id="pricing">
      <div className="pricing-container">

        {/* ── Header ── */}
        <header className="pricing-header">
          <span className="pricing-badge">PREMIUM</span>
          <h2 className="pricing-title">
            <span className="pricing-title-line pricing-title-line--normal">It's Portal Of</span>
            <span className="pricing-title-line pricing-title-line--bold">Real Estate Developers</span>
          </h2>
          <div className="pricing-toggle" role="tablist" aria-label="Pricing feature toggle">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'current'}
              className={`pricing-toggle-btn${activeTab === 'current' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('current')}
            >
              Current Features
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'upcoming'}
              className={`pricing-toggle-btn${activeTab === 'upcoming' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming Features
            </button>
          </div>
        </header>

        {/* ── Grid ── */}
        <div className="pricing-grid">

          {/* ── Card 1: Feature Labels ── */}
          <article className="pricing-card pricing-card--features">
            <div className="pricing-top-panel pricing-top-panel--features">
              <h3 className="pricing-feature-title">
                Heading feature<br />titles
              </h3>
            </div>
            <ul className="pricing-list pricing-list--left">
              {leftFeatures.map(({ icon: Icon, text }) => (
                <li key={text} className="pricing-list-item pricing-list-item--left">
                  <Icon size={16} className="pricing-left-icon" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </article>

          {/* ── Card 2: 6 Months ── */}
          <article className="pricing-card pricing-card--six-month">
            <div className="pricing-top-panel pricing-top-panel--six-month">
              <div className="pricing-plan-head">
                <div className="pricing-plan-name-wrap">
                  <Zap size={18} className="pricing-zap" />
                  <h3 className="pricing-plan-name">6 Months Listing</h3>
                </div>
                <p className="pricing-price-row">
                  <span className="pricing-price">₹4999/-</span>
                  <span className="pricing-price-meta">/month + 18% GST</span>
                </p>
                <p className="pricing-description">
                  Basic tools to start managing your business for free.<br />
                  Ideal for newly launched or low-inventory projects.
                </p>
              </div>
            </div>

            <hr className="pricing-divider" />

            <ul className="pricing-list">
              {sixMonthsItems.map(({ text, status }, idx) => (
                <li key={`6m-${idx}`} className="pricing-list-item">
                  <StatusIcon status={status} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <button type="button" className="pricing-btn pricing-btn--outline">
              Select Plan
            </button>
          </article>

          {/* ── Card 3: 1 Year ── */}
          <article className="pricing-card pricing-card--one-year">
            <span className="pricing-best-deal">🏷️ Best Deals</span>

            <div className="pricing-top-panel pricing-top-panel--one-year">
              <div className="pricing-plan-head">
                <div className="pricing-plan-name-wrap">
                  <Zap size={18} className="pricing-zap" />
                  <h3 className="pricing-plan-name">1 Year Listing</h3>
                </div>
                <p className="pricing-price-row">
                  <span className="pricing-price">₹7999/-</span>
                  <span className="pricing-price-meta">/month + 18% GST</span>
                </p>
                <p className="pricing-description">
                  Perfect for selling projects with phased launches<br />
                  More visibility campaigns and stronger analytics
                </p>
              </div>
            </div>

            <hr className="pricing-divider" />

            <ul className="pricing-list">
              {oneYearItems.map(({ text, status }, idx) => (
                <li key={`1y-${idx}`} className="pricing-list-item">
                  <StatusIcon status={status} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <button type="button" className="pricing-btn pricing-btn--filled">
              Select Plan
            </button>
          </article>

        </div>
      </div>
    </section>
  )
}