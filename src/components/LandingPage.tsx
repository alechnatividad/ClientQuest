import Navbar from "./Navbar";
import Hero from "./Hero";
import FeatureCards from "./FeatureCards";
import QuestBoardDemo from "./QuestBoardDemo";
import HowItWorks from "./HowItWorks";
import Testimonials from "./Testimonials";
import FinalCta from "./FinalCta";
import Footer from "./Footer";

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-slate-950 font-body text-slate-200 antialiased">
      <Navbar onEnter={onEnter} />
      <main>
        <Hero onEnter={onEnter} />
        <FeatureCards />
        <QuestBoardDemo />
        <HowItWorks />
        <Testimonials />
        <FinalCta onEnter={onEnter} />
      </main>
      <Footer />
    </div>
  );
}
