const modules = [
  "Envelope",
  "Scope",
  "Collapse",
  "Observer",
  "Noise",
  "Entanglement",
  "Validate",
  "Hooks",
  "Import",
  "Tunnel",
  "Teleport",
  "Agent",
  "Dashboard",
];

export default function Architecture() {
  return (
    <section className="section section-alt" id="architecture">
      <div className="container">
        <h2 className="section-title reveal">Architecture</h2>
        <p className="section-subtitle reveal">
          A modular core engine bridging CLI and MCP to your OS-native keyring.
        </p>
        <div className="arch-diagram reveal">
          <div className="arch-col arch-entry">
            <div className="arch-box arch-cli">qring CLI</div>
            <div className="arch-box arch-mcp-box">MCP Server</div>
          </div>
          <div className="arch-arrow">&#x25B6;</div>
          <div className="arch-col arch-core">
            <div className="arch-box arch-engine">Core Engine</div>
            <div className="arch-modules">
              {modules.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
          <div className="arch-arrow">&#x25B6;</div>
          <div className="arch-col arch-exit">
            <div className="arch-box arch-keyring">@napi-rs/keyring</div>
            <div className="arch-box arch-os">OS Keyring</div>
          </div>
        </div>
      </div>
    </section>
  );
}
