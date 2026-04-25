import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import TrustStrip from "@/components/TrustStrip";
import IntegrationsCarousel from "@/components/IntegrationsCarousel";
import WhyQRing from "@/components/WhyQRing";
import LiveDemo from "@/components/LiveDemo";
import Features from "@/components/Features";
import QuickStart from "@/components/QuickStart";
import McpSection from "@/components/McpSection";
import Architecture from "@/components/Architecture";
import AgentMode from "@/components/AgentMode";
import CursorPlugin from "@/components/CursorPlugin";
import Dashboard from "@/components/Dashboard";
import Faq from "@/components/Faq";
import FreeCallout from "@/components/FreeCallout";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import WebGLBackground from "@/components/WebGLBackground";

export default function Home() {
  return (
    <>
      <WebGLBackground />
      <Nav />
      <main id="main">
        <Hero />
        <TrustStrip />
        <IntegrationsCarousel />
        <WhyQRing />
        <LiveDemo />
        <Features />
        <QuickStart />
        <McpSection />
        <Architecture />
        <AgentMode />
        <CursorPlugin />
        <Dashboard />
        <Faq />
        <FreeCallout />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
