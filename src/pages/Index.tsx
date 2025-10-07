import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import ValueProps from "@/components/ValueProps";
import HowItWorks from "@/components/HowItWorks";
import FeatureHighlight from "@/components/FeatureHighlight";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <ValueProps />
        <HowItWorks />
        <FeatureHighlight />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
