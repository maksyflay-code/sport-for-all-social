import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import FeedSection from "@/components/FeedSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4">
        <div className="flex gap-4">
          <LeftSidebar />
          <main className="flex-1 min-w-0 py-4 max-w-[680px] mx-auto">
            <FeedSection />
          </main>
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};

export default Index;
