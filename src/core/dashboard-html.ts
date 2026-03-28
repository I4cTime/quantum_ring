/**
 * Self-contained HTML dashboard for q-ring quantum status.
 * Matches the gh-pages site design system: Outfit + JetBrains Mono fonts,
 * deep navy palette, neon cyan→violet SVG icons, glassmorphism cards.
 *
 * Zero dependencies — inline CSS + vanilla JS with EventSource for SSE.
 */

export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>q-ring — quantum status</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg-deep:#04080f;
  --bg-section:#080e18;
  --bg-card:#0f1a2e;
  --bg-card-hover:#142240;
  --border:#1a2d4a;
  --border-glow:#0ea5e9;

  --text-primary:#f8f8ff;
  --text-secondary:#c8cfe0;
  --text-dim:#8899b4;

  --accent:#0ea5e9;
  --accent-bright:#38bdf8;
  --accent-dim:rgba(14,165,233,0.15);
  --accent-glow:rgba(14,165,233,0.4);

  --danger:#ff5e5b;
  --warning:#fbbf24;
  --green:#22c55e;
  --violet:#a855f7;
  --pink:#ff0055;

  --font-display:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  --font-mono:'SF Mono','Cascadia Code','Fira Code',Consolas,'Liberation Mono',monospace;

  --radius:12px;
  --radius-sm:8px;
  --radius-lg:20px;

  --glass-bg:rgba(15,26,46,0.65);
  --glass-border:rgba(26,45,74,0.8);
  --shadow-card:0 4px 24px -1px rgba(0,0,0,0.4),0 0 1px rgba(255,255,255,0.04);
  --shadow-glow:0 0 20px rgba(14,165,233,0.12),0 0 40px rgba(168,85,247,0.08);
}
html{background:var(--bg-deep);color:var(--text-primary);font-family:var(--font-display);font-size:16px;line-height:1.5}
body{min-height:100vh;overflow-x:hidden;position:relative}

/* Hidden SVG defs for gradient icons */
.svg-defs{position:absolute;width:0;height:0;overflow:hidden}

/* Mesh blobs */
.blob{position:fixed;border-radius:50%;filter:blur(100px);opacity:.12;pointer-events:none;z-index:0}
.blob-1{width:600px;height:600px;top:-120px;left:-100px;background:radial-gradient(circle,var(--accent),transparent 70%);animation:drift1 22s ease-in-out infinite}
.blob-2{width:500px;height:500px;bottom:-80px;right:-60px;background:radial-gradient(circle,var(--violet),transparent 70%);animation:drift2 26s ease-in-out infinite}
.blob-3{width:350px;height:350px;top:40%;left:50%;background:radial-gradient(circle,var(--green),transparent 70%);animation:drift3 30s ease-in-out infinite;opacity:.06}
@keyframes drift1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(60px,-40px) scale(1.08)}66%{transform:translate(-30px,50px) scale(.95)}}
@keyframes drift2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-50px,30px) scale(1.05)}66%{transform:translate(40px,-60px) scale(.92)}}
@keyframes drift3{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-40%,-60%) scale(1.1)}}

.container{position:relative;z-index:1;max-width:1280px;margin:0 auto;padding:24px 20px 48px}

/* Header */
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;padding:16px 20px;background:rgba(4,8,15,0.75);backdrop-filter:blur(16px) saturate(1.2);-webkit-backdrop-filter:blur(16px) saturate(1.2);border:1px solid var(--border);border-radius:var(--radius)}
.header h1{font-family:var(--font-display);font-size:1.65rem;font-weight:700;letter-spacing:-.02em;display:flex;align-items:center;gap:10px}
.header h1 .q-icon{display:flex;filter:drop-shadow(0 0 6px rgba(14,165,233,0.6))}
.header h1 .brand{background:linear-gradient(135deg,#00D1FF,var(--violet));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.header h1 .sub{color:var(--text-dim);font-weight:400;font-size:1.1rem;-webkit-text-fill-color:var(--text-dim)}
.status-dot{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);display:inline-block;animation:pulse 2s ease-in-out infinite}
.status-dot.disconnected{background:var(--danger);box-shadow:0 0 8px var(--danger)}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.conn-label{font-size:.85rem;color:var(--text-dim);display:flex;align-items:center;gap:6px;font-family:var(--font-mono)}

/* Grid */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px}
.grid-wide{grid-column:1/-1}

/* Cards — reveal animation */
.card{background:var(--glass-bg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:var(--radius);padding:18px 20px;box-shadow:var(--shadow-card);transition:border-color .3s,box-shadow .3s,transform .3s;opacity:0;transform:translateY(16px);animation:cardReveal .5s cubic-bezier(0.16,1,0.3,1) forwards}
.card:hover{border-color:var(--border-glow);box-shadow:var(--shadow-card),var(--shadow-glow);transform:translateY(-2px)}
@keyframes cardReveal{to{opacity:1;transform:translateY(0)}}

.card-title{font-family:var(--font-display);font-size:.8rem;text-transform:uppercase;letter-spacing:.1em;color:var(--text-dim);margin-bottom:14px;display:flex;align-items:center;gap:8px;font-weight:600}
.card-title svg{width:16px;height:16px;flex-shrink:0;filter:drop-shadow(0 0 4px rgba(14,165,233,0.4))}

/* Health donut */
.health-row{display:flex;align-items:center;gap:24px}
.donut-wrap{position:relative;width:100px;height:100px;flex-shrink:0}
.donut-wrap svg{transform:rotate(-90deg)}
.donut-wrap .donut-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;font-size:1.5rem;font-weight:700;line-height:1;font-family:var(--font-display)}
.donut-wrap .donut-label small{font-size:.7rem;color:var(--text-dim);font-weight:400;margin-top:2px;letter-spacing:.04em}
.health-legend{display:flex;flex-direction:column;gap:6px}
.legend-item{display:flex;align-items:center;gap:8px;font-size:.88rem}
.legend-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}

/* Decay bars */
.decay-list{display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto}
.decay-item{display:flex;align-items:center;gap:10px}
.decay-key{font-family:var(--font-mono);font-size:.85rem;min-width:120px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.decay-bar{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden;position:relative}
.decay-fill{height:100%;border-radius:3px;transition:width .6s ease}
.decay-time{font-size:.8rem;color:var(--text-dim);min-width:56px;text-align:right;font-family:var(--font-mono)}

/* Superposition pills */
.super-list{display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto}
.super-item{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.super-key{font-family:var(--font-mono);font-size:.85rem;min-width:100px}
.env-pill{font-size:.75rem;padding:2px 8px;border-radius:99px;font-weight:600;letter-spacing:.03em;font-family:var(--font-mono)}
.env-prod{background:rgba(255,0,85,0.2);color:var(--pink);border:1px solid rgba(255,0,85,0.3)}
.env-staging{background:rgba(251,191,36,0.15);color:var(--warning);border:1px solid rgba(251,191,36,0.25)}
.env-dev{background:rgba(34,197,94,0.15);color:var(--green);border:1px solid rgba(34,197,94,0.25)}
.env-default{background:rgba(168,85,247,0.15);color:var(--violet);border:1px solid rgba(168,85,247,0.25)}

/* Entanglement */
.entangle-list{display:flex;flex-direction:column;gap:6px;max-height:240px;overflow-y:auto}
.entangle-pair{display:flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:.85rem}
.entangle-arrow{color:var(--accent-bright)}

/* Tunnels */
.tunnel-list{display:flex;flex-direction:column;gap:8px;max-height:240px;overflow-y:auto}
.tunnel-card{background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.15);border-radius:var(--radius-sm);padding:10px 12px;font-size:.85rem;font-family:var(--font-mono)}
.tunnel-meta{display:flex;gap:12px;margin-top:4px;font-size:.8rem;color:var(--text-dim)}

/* Audit feed */
.audit-feed{display:flex;flex-direction:column;gap:4px;max-height:300px;overflow-y:auto;font-size:.85rem;font-family:var(--font-mono)}
.audit-row{display:flex;gap:8px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.03)}
.audit-ts{color:var(--text-dim);min-width:70px;flex-shrink:0}
.audit-action{min-width:64px;font-weight:600}
.audit-action.read{color:var(--accent)}.audit-action.write{color:var(--green)}.audit-action.delete{color:var(--danger)}
.audit-action.entangle{color:var(--violet)}.audit-action.tunnel{color:var(--violet)}.audit-action.teleport{color:var(--warning)}
.audit-action.generate{color:var(--warning)}.audit-action.list{color:var(--text-dim)}.audit-action.export{color:var(--text-dim)}
.audit-action.collapse{color:var(--accent)}

/* Anomalies */
.anomaly-card{background:rgba(255,94,91,0.06);border:1px solid rgba(255,94,91,0.15);border-radius:var(--radius-sm);padding:10px 14px;animation:anomaly-pulse 3s ease-in-out infinite}
@keyframes anomaly-pulse{0%,100%{border-color:rgba(255,94,91,0.15)}50%{border-color:rgba(255,94,91,0.4)}}
.anomaly-type{font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:var(--danger);font-weight:700;margin-bottom:2px;font-family:var(--font-display)}
.anomaly-desc{font-size:.88rem;color:var(--text-primary)}

/* Environment badge */
.env-status{display:flex;align-items:center;gap:12px}
.env-big{font-size:1.1rem;font-weight:700;padding:4px 14px;border-radius:var(--radius-sm)}
.env-source{font-size:.85rem;color:var(--text-dim)}

/* Empty states */
.empty{color:var(--text-dim);font-size:.88rem;font-style:italic;padding:8px 0}

/* Scrollbar */
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.15)}
</style>
</head>
<body>

<!-- Shared SVG gradient definition -->
<svg class="svg-defs" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="neon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00D1FF"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
</svg>

<div class="blob blob-1"></div>
<div class="blob blob-2"></div>
<div class="blob blob-3"></div>
<div class="container">
  <div class="header">
    <h1>
      <span class="q-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#neon-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></span>
      <span class="brand">q-ring</span>
      <span class="sub">quantum status</span>
    </h1>
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

  /* --- SVG icon library (matching gh-pages neon gradient) --- */
  const icons = {
    health: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="url(#neon-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    environment: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="url(#neon-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    decay: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="url(#neon-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>',
    superposition: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="url(#neon-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    entangle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="url(#neon-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    tunnel: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="url(#neon-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>',
    anomaly: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="url(#neon-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    audit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="url(#neon-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>'
  };

  function esc(s){ const d=document.createElement('div');d.textContent=s;return d.innerHTML; }

  function envClass(e){
    if(e==='prod'||e==='production') return 'env-prod';
    if(e==='staging'||e==='stage') return 'env-staging';
    if(e==='dev'||e==='development') return 'env-dev';
    return 'env-default';
  }

  function decayColor(pct,expired){
    if(expired) return 'var(--danger)';
    if(pct>=90) return 'var(--danger)';
    if(pct>=75) return 'var(--warning)';
    return 'var(--accent)';
  }

  function fmtTime(ts){
    const d=new Date(ts);
    return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')+':'+d.getSeconds().toString().padStart(2,'0');
  }

  function renderHealth(h){
    const total=h.total||1;
    const r=42, circ=2*Math.PI*r;
    const slices=[
      {v:h.healthy,c:'var(--accent)'},
      {v:h.stale,c:'var(--warning)'},
      {v:h.expired,c:'var(--danger)'},
      {v:h.noDecay,c:'var(--text-dim)'}
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
        <div class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Healthy \${h.healthy}</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--warning)"></span>Stale \${h.stale}</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--danger)"></span>Expired \${h.expired}</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--text-dim)"></span>No decay \${h.noDecay}</div>
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
        <span class="audit-action \${esc(e.action)}">\${esc(e.action)}</span>
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

  const panels = [
    { id:'p-health',  icon:icons.health,  label:'Health Summary',       wide:false, render:s=>renderHealth(s.health) },
    { id:'p-env',     icon:icons.environment, label:'Environment',      wide:false, render:s=>renderEnvironment(s.environment) },
    { id:'p-decay',   icon:icons.decay,   label:'Decay Timers',         wide:false, render:s=>renderDecay(s.secrets) },
    { id:'p-super',   icon:icons.superposition, label:'Superposition States', wide:false, render:s=>renderSuperposition(s.secrets) },
    { id:'p-ent',     icon:icons.entangle, label:'Entanglement',        wide:false, render:s=>renderEntanglements(s.entanglements) },
    { id:'p-tunnel',  icon:icons.tunnel,  label:'Quantum Tunnels',      wide:false, render:s=>renderTunnels(s.tunnels) },
    { id:'p-anomaly', icon:icons.anomaly, label:'Anomaly Alerts',       wide:true,  render:s=>renderAnomalies(s.anomalies) },
    { id:'p-audit',   icon:icons.audit,   label:'Audit Log',            wide:true,  render:s=>renderAudit(s.audit) }
  ];

  let initialised = false;

  function render(snap){
    if(!initialised){
      initialised = true;
      dash.innerHTML = panels.map((p,i) =>
        \`<div class="card\${p.wide?' grid-wide':''}" id="\${p.id}" style="animation-delay:\${i*60}ms">
          <div class="card-title">\${p.icon} \${p.label}</div>
          <div class="card-body" id="\${p.id}-body"></div>
        </div>\`
      ).join('');
    }
    for(const p of panels){
      const body = $(\`\${p.id}-body\`);
      if(body){
        const html = p.render(snap);
        if(body._prev !== html){ body.innerHTML = html; body._prev = html; }
      }
    }
  }

  function connect(){
    const es=new EventSource('/events');
    es.onopen=()=>{
      dot.classList.remove('disconnected');
      connText.textContent='live';
    };
    es.onmessage=(e)=>{
      try{ render(JSON.parse(e.data)); }catch(err){ console.error('render error',err); }
    };
    es.onerror=()=>{
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
