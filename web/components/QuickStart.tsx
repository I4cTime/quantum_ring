import FadeIn from "@/components/motion/FadeIn";
import TerminalCard from "@/components/TerminalCard";

export default function QuickStart() {
  return (
    <section className="py-24 relative z-1 bg-bg-alt" id="quickstart">
      <div className="max-w-[1200px] mx-auto px-6 relative z-1">
        <FadeIn>
          <h2 className="text-center text-[clamp(2rem,5vw,3rem)] font-bold mb-2 bg-gradient-to-br from-text-primary to-accent-bright bg-clip-text text-transparent">
            Quick Start
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-center text-text-secondary text-lg max-w-[600px] mx-auto mb-12">
            Five commands. Your secrets are quantum-secured.
          </p>
        </FadeIn>
        <FadeIn delay={0.2}>
          <TerminalCard title="~ / terminal">
            <pre>
              <span className="text-[#555]">
                # Store a secret (prompts securely if value is omitted)
              </span>
              {"\n"}
              <span className="text-green font-bold">$</span>{" "}
              <span className="text-accent-bright font-medium">qring set</span> OPENAI_API_KEY sk-...
              {"\n\n"}
              <span className="text-[#555]"># Retrieve it anytime</span>
              {"\n"}
              <span className="text-green font-bold">$</span>{" "}
              <span className="text-accent-bright font-medium">qring get</span> OPENAI_API_KEY
              {"\n\n"}
              <span className="text-[#555]">
                # List all keys (values are never shown)
              </span>
              {"\n"}
              <span className="text-green font-bold">$</span>{" "}
              <span className="text-accent-bright font-medium">qring list</span>
              {"\n\n"}
              <span className="text-[#555]">
                # Generate a cryptographic secret and save it
              </span>
              {"\n"}
              <span className="text-green font-bold">$</span>{" "}
              <span className="text-accent-bright font-medium">qring generate</span> --format api-key
              --prefix &quot;sk-&quot; --save MY_KEY
              {"\n\n"}
              <span className="text-[#555]"># Run a full health scan</span>
              {"\n"}
              <span className="text-green font-bold">$</span>{" "}
              <span className="text-accent-bright font-medium">qring health</span>
            </pre>
          </TerminalCard>
        </FadeIn>
      </div>
    </section>
  );
}
