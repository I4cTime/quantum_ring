import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Features from "@/components/Features";
import QuickStart from "@/components/QuickStart";
import McpSection from "@/components/McpSection";
import Architecture from "@/components/Architecture";
import AgentMode from "@/components/AgentMode";
import CursorPlugin from "@/components/CursorPlugin";
import Dashboard from "@/components/Dashboard";
import Footer from "@/components/Footer";
import WebGLBackground from "@/components/WebGLBackground";

export default function Home() {
  return (
    <>
      <WebGLBackground />
      <Nav />
      <main id="main">
        <Hero />
        <Stats />
        <Features />
        <QuickStart />
        <McpSection />
        <Architecture />
        <AgentMode />
        <CursorPlugin />
        <Dashboard />
      </main>
      <Footer />
    </>
  );
}
