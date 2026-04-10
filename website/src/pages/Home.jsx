import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import TopFeatures from '../components/TopFeatures'
import PropertyOwnerSection from '../components/PropertyOwnerSection'
import DeveloperPortalSection from '../components/DeveloperPortalSection'
import PricingSection from '../components/PricingSection'
import BlogSection from '../components/BlogSection'
import CtaBanner from '../components/CtaBanner'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <TopFeatures />
        <PropertyOwnerSection />
        <DeveloperPortalSection />
        <PricingSection />
        <BlogSection />
        <CtaBanner />
      </main>
      <Footer />
    </>
  )
}
