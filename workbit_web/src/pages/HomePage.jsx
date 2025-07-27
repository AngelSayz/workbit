import Navbar from '../components/layout/Navbar';
import HeroSection from '../components/sections/HeroSection';
import StatsSection from '../components/sections/StatsSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import ContactForm from '../components/sections/ContactForm';
import Footer from '../components/layout/Footer';
import ChatWidget from '../components/ChatWidget';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <ContactForm />
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default HomePage; 