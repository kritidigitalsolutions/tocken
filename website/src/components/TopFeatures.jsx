import './TopFeatures.css'
import smartMatch from '../assets/images/analytics.svg'
import mapSearch from '../assets/images/map.svg'
import secureComm from '../assets/images/communicate.svg'
import priceTool from '../assets/images/tag.svg'
import developer from '../assets/images/verified.svg'
import featured from '../assets/images/featured.svg'

const features = [
  { icon: smartMatch, title: "Smart Property\nMatch" },
  { icon: mapSearch, title: "Interactive\nMap Search" },
  { icon: secureComm, title: "Secure\nCommunication" },
  { icon: priceTool, title: "Price Comparison\nTool" },
  { icon: developer, title: "Developer Verified\nProjects" },
  { icon: featured, title: "Featured Listings\nBoost" },
]

export default function TopFeatures() {
  return (
    <section className="top-features" id="feature">
      <div className="top-features__container">
        <h2 className="top-features__heading">Top Features of Tocken</h2>
        
        <div className="top-features__carousel-wrapper">
          <div className="top-features__carousel-track">
            {/* First Set */}
            {features.map((feature, i) => (
              <div key={`set1-${i}`} className="top-features__item">
                <img src={feature.icon} alt={feature.title.replace('\n', ' ')} className="top-features__icon" />
                <span className="top-features__text">{feature.title}</span>
              </div>
            ))}
            {/* Second Set for Infinite Loop */}
            {features.map((feature, i) => (
              <div key={`set2-${i}`} className="top-features__item">
                <img src={feature.icon} alt={feature.title.replace('\n', ' ')} className="top-features__icon" />
                <span className="top-features__text">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="top-features__divider" />
    </section>
  )
}
