export default function QuickStart() {
  return (
    <section className="section section-alt" id="quickstart">
      <div className="container">
        <h2 className="section-title reveal">Quick Start</h2>
        <p className="section-subtitle reveal">
          Five commands. Your secrets are quantum-secured.
        </p>
        <div className="terminal reveal">
          <div className="terminal-bar">
            <span className="terminal-dot red" />
            <span className="terminal-dot yellow" />
            <span className="terminal-dot green" />
            <span className="terminal-title">~ / terminal</span>
          </div>
          <div className="terminal-body">
            <pre>
              <span className="t-comment">
                # Store a secret (prompts securely if value is omitted)
              </span>
              {"\n"}
              <span className="t-prompt">$</span>{" "}
              <span className="t-cmd">qring set</span> OPENAI_API_KEY sk-...
              {"\n\n"}
              <span className="t-comment"># Retrieve it anytime</span>
              {"\n"}
              <span className="t-prompt">$</span>{" "}
              <span className="t-cmd">qring get</span> OPENAI_API_KEY
              {"\n\n"}
              <span className="t-comment">
                # List all keys (values are never shown)
              </span>
              {"\n"}
              <span className="t-prompt">$</span>{" "}
              <span className="t-cmd">qring list</span>
              {"\n\n"}
              <span className="t-comment">
                # Generate a cryptographic secret and save it
              </span>
              {"\n"}
              <span className="t-prompt">$</span>{" "}
              <span className="t-cmd">qring generate</span> --format api-key
              --prefix &quot;sk-&quot; --save MY_KEY
              {"\n\n"}
              <span className="t-comment"># Run a full health scan</span>
              {"\n"}
              <span className="t-prompt">$</span>{" "}
              <span className="t-cmd">qring health</span>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
