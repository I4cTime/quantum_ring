/**
 * Self-contained HTML dashboard for q-ring quantum status.
 * Uses the Quantum Fluidity design system: Obsidian Void background,
 * glassmorphism cards, Electric Cyan / Hyper-Violet accents.
 *
 * Zero dependencies — inline CSS + vanilla JS with EventSource for SSE.
 */

export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>q-ring \u2014 quantum status</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --void:#050505;--mist:#1A1A2E;--ghost:#F8F9FA;--slate:#7A8490;
  --cyan:#00D1FF;--violet:#B266FF;--emerald:#00E676;--amber:#FFB800;--pink:#FF0055;
  --glass-bg:rgba(255,255,255,0.03);--glass-border:rgba(255,255,255,0.06);
  --shadow-q:0 0 20px rgba(0,209,255,0.12),0 0 40px rgba(178,102,255,0.08);
  --shadow-glass:0 4px 24px -1px rgba(0,0,0,0.3),0 0 1px rgba(255,255,255,0.04);
  --glow-sm:0 0 8px rgba(0,209,255,0.2);
  --radius:12px;
}
html{background:var(--void);color:var(--ghost);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.5}
body{min-height:100vh;overflow-x:hidden;position:relative}

/* Mesh blobs */
.blob{position:fixed;border-radius:50%;filter:blur(100px);opacity:.18;pointer-events:none;z-index:0}
.blob-1{width:600px;height:600px;top:-120px;left:-100px;background:radial-gradient(circle,var(--cyan),transparent 70%);animation:drift1 22s ease-in-out infinite}
.blob-2{width:500px;height:500px;bottom:-80px;right:-60px;background:radial-gradient(circle,var(--violet),transparent 70%);animation:drift2 26s ease-in-out infinite}
.blob-3{width:350px;height:350px;top:40%;left:50%;background:radial-gradient(circle,var(--emerald),transparent 70%);animation:drift3 30s ease-in-out infinite;opacity:.08}
@keyframes drift1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(60px,-40px) scale(1.08)}66%{transform:translate(-30px,50px) scale(.95)}}
@keyframes drift2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-50px,30px) scale(1.05)}66%{transform:translate(40px,-60px) scale(.92)}}
@keyframes drift3{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-40%,-60%) scale(1.1)}}

.container{position:relative;z-index:1;max-width:1280px;margin:0 auto;padding:24px 20px 48px}

/* Header */
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}
.header h1{font-size:1.6rem;font-weight:700;letter-spacing:-.02em}
.header h1 span{background:linear-gradient(135deg,var(--cyan),var(--violet));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.status-dot{width:8px;height:8px;border-radius:50%;background:var(--emerald);box-shadow:0 0 8px var(--emerald);display:inline-block;margin-right:8px;animation:pulse 2s ease-in-out infinite}
.status-dot.disconnected{background:var(--pink);box-shadow:0 0 8px var(--pink)}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.conn-label{font-size:.75rem;color:var(--slate);display:flex;align-items:center;gap:6px}

/* Grid */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px}
.grid-wide{grid-column:1/-1}

/* Cards */
.card{background:var(--glass-bg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:var(--radius);padding:18px 20px;box-shadow:var(--shadow-glass);transition:border-color .25s,box-shadow .25s}
.card:hover{border-color:rgba(255,255,255,0.1);box-shadow:var(--shadow-glass),var(--glow-sm)}
.card-title{font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--slate);margin-bottom:12px;display:flex;align-items:center;gap:6px}
.card-title .icon{font-size:.85rem}

/* Health donut */
.health-row{display:flex;align-items:center;gap:24px}
.donut-wrap{position:relative;width:100px;height:100px;flex-shrink:0}
.donut-wrap svg{transform:rotate(-90deg)}
.donut-wrap .donut-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;font-size:1.5rem;font-weight:700;line-height:1}
.donut-wrap .donut-label small{font-size:.6rem;color:var(--slate);font-weight:400;margin-top:2px}
.health-legend{display:flex;flex-direction:column;gap:6px}
.legend-item{display:flex;align-items:center;gap:8px;font-size:.8rem}
.legend-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}

/* Decay bars */
.decay-list{display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto}
.decay-item{display:flex;align-items:center;gap:10px}
.decay-key{font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;font-size:.78rem;min-width:120px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.decay-bar{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden;position:relative}
.decay-fill{height:100%;border-radius:3px;transition:width .6s ease}
.decay-time{font-size:.7rem;color:var(--slate);min-width:56px;text-align:right}

/* Superposition pills */
.super-list{display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto}
.super-item{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.super-key{font-family:'SF Mono',SFMono-Regular,Consolas,monospace;font-size:.78rem;min-width:100px}
.env-pill{font-size:.65rem;padding:2px 8px;border-radius:99px;font-weight:600;letter-spacing:.03em}
.env-prod{background:rgba(255,0,85,0.2);color:var(--pink);border:1px solid rgba(255,0,85,0.3)}
.env-staging{background:rgba(255,184,0,0.15);color:var(--amber);border:1px solid rgba(255,184,0,0.25)}
.env-dev{background:rgba(0,230,118,0.15);color:var(--emerald);border:1px solid rgba(0,230,118,0.25)}
.env-default{background:rgba(178,102,255,0.15);color:var(--violet);border:1px solid rgba(178,102,255,0.25)}

/* Entanglement */
.entangle-list{display:flex;flex-direction:column;gap:6px;max-height:240px;overflow-y:auto}
.entangle-pair{display:flex;align-items:center;gap:8px;font-family:'SF Mono',SFMono-Regular,Consolas,monospace;font-size:.78rem}
.entangle-arrow{color:var(--cyan)}

/* Tunnels */
.tunnel-list{display:flex;flex-direction:column;gap:8px;max-height:240px;overflow-y:auto}
.tunnel-card{background:rgba(178,102,255,0.06);border:1px solid rgba(178,102,255,0.12);border-radius:8px;padding:10px 12px;font-size:.78rem;font-family:'SF Mono',SFMono-Regular,Consolas,monospace}
.tunnel-meta{display:flex;gap:12px;margin-top:4px;font-size:.7rem;color:var(--slate)}

/* Audit feed */
.audit-feed{display:flex;flex-direction:column;gap:4px;max-height:300px;overflow-y:auto;font-size:.75rem;font-family:'SF Mono',SFMono-Regular,Consolas,monospace}
.audit-row{display:flex;gap:8px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.03)}
.audit-ts{color:var(--slate);min-width:70px;flex-shrink:0}
.audit-action{min-width:64px;font-weight:600}
.audit-action.read{color:var(--cyan)}.audit-action.write{color:var(--emerald)}.audit-action.delete{color:var(--pink)}
.audit-action.entangle{color:var(--violet)}.audit-action.tunnel{color:var(--violet)}.audit-action.teleport{color:var(--amber)}
.audit-action.generate{color:var(--amber)}.audit-action.list{color:var(--slate)}.audit-action.export{color:var(--slate)}
.audit-action.collapse{color:var(--cyan)}
.audit-key{color:var(--ghost)}
.audit-detail{color:var(--slate);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* Anomalies */
.anomaly-card{background:rgba(255,0,85,0.06);border:1px solid rgba(255,0,85,0.15);border-radius:8px;padding:10px 14px;animation:anomaly-pulse 3s ease-in-out infinite}
@keyframes anomaly-pulse{0%,100%{border-color:rgba(255,0,85,0.15)}50%{border-color:rgba(255,0,85,0.35)}}
.anomaly-type{font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--pink);font-weight:700;margin-bottom:2px}
.anomaly-desc{font-size:.8rem;color:var(--ghost)}

/* Environment badge */
.env-status{display:flex;align-items:center;gap:12px}
.env-big{font-size:1.1rem;font-weight:700;padding:4px 14px;border-radius:8px}
.env-source{font-size:.75rem;color:var(--slate)}

/* Empty states */
.empty{color:var(--slate);font-size:.8rem;font-style:italic;padding:8px 0}

/* Scrollbar */
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.15)}
</style>
</head>
<body>
<div class="blob blob-1"></div>
<div class="blob blob-2"></div>
<div class="blob blob-3"></div>
<div class="container">
  <div class="header">
    <h1>\u26a1 <span>q-ring</span> quantum status</h1>
    <div class="conn-label"><span class="status-dot" id="connDot"></span><span id="connText">connecting\u2026</span></div>
  </div>
  <div class="grid" id="dashboard">
    <div class="card"><div class="empty">Connecting to q-ring\u2026</div></div>
  </div>
</div>

<script>
(function(){
  const $ = (id) => document.getElementById(id);
  const dash = $('dashboard');
  const dot = $('connDot');
  const connText = $('connText');
  let connected = false;

  function esc(s){ const d=document.createElement('div');d.textContent=s;return d.innerHTML; }

  function envClass(e){
    if(e==='prod'||e==='production') return 'env-prod';
    if(e==='staging'||e==='stage') return 'env-staging';
    if(e==='dev'||e==='development') return 'env-dev';
    return 'env-default';
  }

  function decayColor(pct,expired){
    if(expired) return 'var(--pink)';
    if(pct>=90) return 'var(--pink)';
    if(pct>=75) return 'var(--amber)';
    return 'var(--cyan)';
  }

  function fmtTime(ts){
    const d=new Date(ts);
    const h=d.getHours().toString().padStart(2,'0');
    const m=d.getMinutes().toString().padStart(2,'0');
    const s=d.getSeconds().toString().padStart(2,'0');
    return h+':'+m+':'+s;
  }

  function renderHealth(h){
    const total=h.total||1;
    const r=42, circ=2*Math.PI*r;
    const slices=[
      {v:h.healthy,c:'var(--cyan)'},
      {v:h.stale,c:'var(--amber)'},
      {v:h.expired,c:'var(--pink)'},
      {v:h.noDecay,c:'var(--slate)'}
    ];
    let offset=0;
    let rings='';
    for(const sl of slices){
      const pct=sl.v/total;
      const len=pct*circ;
      rings+=\`<circle cx="50" cy="50" r="\${r}" fill="none" stroke="\${sl.c}" stroke-width="12" stroke-dasharray="\${len} \${circ-len}" stroke-dashoffset="-\${offset}" stroke-linecap="round" opacity="0.85"/>\`;
      offset+=len;
    }
    return \`<div class="health-row">
      <div class="donut-wrap">
        <svg viewBox="0 0 100 100" width="100" height="100">\${rings}</svg>
        <div class="donut-label">\${h.total}<small>secrets</small></div>
      </div>
      <div class="health-legend">
        <div class="legend-item"><span class="legend-dot" style="background:var(--cyan)"></span>Healthy \${h.healthy}</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--amber)"></span>Stale \${h.stale}</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--pink)"></span>Expired \${h.expired}</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--slate)"></span>No decay \${h.noDecay}</div>
      </div>
    </div>\`;
  }

  function renderDecay(secrets){
    const withDecay=secrets.filter(s=>s.decay&&s.decay.timeRemaining);
    if(!withDecay.length) return '<div class="empty">No secrets with decay configured</div>';
    return '<div class="decay-list">'+withDecay.map(s=>{
      const pct=Math.min(s.decay.lifetimePercent,100);
      const col=decayColor(pct,s.decay.isExpired);
      const label=s.decay.isExpired?'expired':s.decay.timeRemaining||'';
      return \`<div class="decay-item">
        <span class="decay-key" title="\${esc(s.key)}">\${esc(s.key)}</span>
        <div class="decay-bar"><div class="decay-fill" style="width:\${pct}%;background:\${col}"></div></div>
        <span class="decay-time" style="color:\${col}">\${esc(label)}</span>
      </div>\`;
    }).join('')+'</div>';
  }

  function renderSuperposition(secrets){
    const sup=secrets.filter(s=>s.type==='superposition'&&s.environments);
    if(!sup.length) return '<div class="empty">No secrets in superposition</div>';
    return '<div class="super-list">'+sup.map(s=>{
      const pills=(s.environments||[]).map(e=>{
        const isDefault=e===s.defaultEnv;
        return \`<span class="env-pill \${envClass(e)}">\${esc(e)}\${isDefault?' \u2713':''}</span>\`;
      }).join('');
      return \`<div class="super-item"><span class="super-key">\${esc(s.key)}</span>\${pills}</div>\`;
    }).join('')+'</div>';
  }

  function renderEntanglements(pairs){
    if(!pairs.length) return '<div class="empty">No entangled secrets</div>';
    const seen=new Set();
    const unique=pairs.filter(p=>{
      const id=[p.source.service,p.source.key,p.target.service,p.target.key].sort().join('|');
      if(seen.has(id)) return false;
      seen.add(id);return true;
    });
    return '<div class="entangle-list">'+unique.map(p=>
      \`<div class="entangle-pair"><span>\${esc(p.source.key)}</span><span class="entangle-arrow">\u2194</span><span>\${esc(p.target.key)}</span></div>\`
    ).join('')+'</div>';
  }

  function renderTunnels(tunnels){
    if(!tunnels.length) return '<div class="empty">No active tunnels</div>';
    return '<div class="tunnel-list">'+tunnels.map(t=>{
      const rem=t.expiresAt?Math.max(0,Math.floor((t.expiresAt-Date.now())/1000)):null;
      return \`<div class="tunnel-card">\${esc(t.id)}<div class="tunnel-meta">
        <span>reads: \${t.accessCount}\${t.maxReads?'/'+t.maxReads:''}</span>
        \${rem!==null?'<span>expires: '+rem+'s</span>':'<span>no expiry</span>'}
      </div></div>\`;
    }).join('')+'</div>';
  }

  function renderAudit(events){
    if(!events.length) return '<div class="empty">No audit events</div>';
    return '<div class="audit-feed">'+events.slice(0,40).map(e=>
      \`<div class="audit-row">
        <span class="audit-ts">\${fmtTime(e.timestamp)}</span>
        <span class="audit-action \${e.action}">\${e.action}</span>
        <span class="audit-key">\${e.key?esc(e.key):''}</span>
        <span class="audit-detail">\${e.detail?esc(e.detail):''}</span>
      </div>\`
    ).join('')+'</div>';
  }

  function renderAnomalies(anomalies){
    if(!anomalies.length) return '<div class="empty">No anomalies detected \u2014 all clear</div>';
    return anomalies.map(a=>
      \`<div class="anomaly-card"><div class="anomaly-type">\${esc(a.type)}</div><div class="anomaly-desc">\${esc(a.description)}</div></div>\`
    ).join('');
  }

  function renderEnvironment(env){
    if(!env) return '<div class="empty">No environment detected</div>';
    return \`<div class="env-status">
      <span class="env-big env-pill \${envClass(env.env)}">\${esc(env.env)}</span>
      <span class="env-source">detected via \${esc(env.source)}</span>
    </div>\`;
  }

  function render(snap){
    dash.innerHTML=\`
      <div class="card">
        <div class="card-title"><span class="icon">\u{1f6e1}\ufe0f</span> Health Summary</div>
        \${renderHealth(snap.health)}
      </div>
      <div class="card">
        <div class="card-title"><span class="icon">\u26a1</span> Environment</div>
        \${renderEnvironment(snap.environment)}
      </div>
      <div class="card">
        <div class="card-title"><span class="icon">\u23f0</span> Decay Timers</div>
        \${renderDecay(snap.secrets)}
      </div>
      <div class="card">
        <div class="card-title"><span class="icon">\u{1f30a}</span> Superposition States</div>
        \${renderSuperposition(snap.secrets)}
      </div>
      <div class="card">
        <div class="card-title"><span class="icon">\u{1f517}</span> Entanglement</div>
        \${renderEntanglements(snap.entanglements)}
      </div>
      <div class="card">
        <div class="card-title"><span class="icon">\u{1f47b}</span> Quantum Tunnels</div>
        \${renderTunnels(snap.tunnels)}
      </div>
      <div class="card grid-wide">
        <div class="card-title"><span class="icon">\u26a0\ufe0f</span> Anomaly Alerts</div>
        \${renderAnomalies(snap.anomalies)}
      </div>
      <div class="card grid-wide">
        <div class="card-title"><span class="icon">\u{1f441}\ufe0f</span> Audit Log</div>
        \${renderAudit(snap.audit)}
      </div>
    \`;
  }

  function connect(){
    const es=new EventSource('/events');
    es.onopen=()=>{
      connected=true;
      dot.classList.remove('disconnected');
      connText.textContent='live';
    };
    es.onmessage=(e)=>{
      try{ render(JSON.parse(e.data)); }catch(err){ console.error('render error',err); }
    };
    es.onerror=()=>{
      connected=false;
      dot.classList.add('disconnected');
      connText.textContent='reconnecting\u2026';
    };
  }

  connect();
})();
</script>
</body>
</html>`;
}
