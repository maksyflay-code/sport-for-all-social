import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeedSection from "@/components/FeedSection";
import CommunitiesSection from "@/components/CommunitiesSection";
import EventsSection from "@/components/EventsSection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <FeedSection />
      <CommunitiesSection />
      <EventsSection />
      <FooterSection />
    </div>
  );
};

export default Index;
