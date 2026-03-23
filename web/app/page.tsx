import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import QuickStart from "@/components/QuickStart";
import McpSection from "@/components/McpSection";
import Architecture from "@/components/Architecture";
import AgentMode from "@/components/AgentMode";
import Dashboard from "@/components/Dashboard";
import Footer from "@/components/Footer";
import WebGLBackground from "@/components/WebGLBackground";
import RevealObserver from "@/components/RevealObserver";

export default function Home() {
  return (
    <>
      <WebGLBackground />
      <Nav />
      <Hero />
      <Features />
      <QuickStart />
      <McpSection />
      <Architecture />
      <AgentMode />
      <Dashboard />
      <Footer />
      <RevealObserver />
    </>
  );
}
