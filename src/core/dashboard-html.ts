/**
 * Self-contained HTML dashboard for q-ring quantum status.
 *
 * Matches the gh-pages site design system: deep-navy palette, neon cyan→violet
 * SVG icons, glassmorphism cards. Zero dependencies — inline CSS + vanilla JS
 * with EventSource for SSE.
 *
 * Layout:
 *   1. Sticky header with brand, version, project path, live/paused state,
 *      pause+refresh controls, last-update timestamp.
 *   2. KPI strip — at-a-glance counters (total, healthy, stale/expired,
 *      protected, hooks, approvals, anomalies, audit-24h).
 *   3. Health donut + Environment + Manifest + Policy summary cards.
 *   4. Searchable + sortable secrets table (key, scope, env, type, decay,
 *      tags, last accessed). Click a row to inspect details.
 *   5. Quantum side panels — Decay, Superposition, Entanglement, Tunnels.
 *   6. Governance — Approvals, Hooks, Memory.
 *   7. Anomalies (full-width).
 *   8. Audit log with action+source+text filters and an action-count strip.
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

.container{position:relative;z-index:1;max-width:1320px;margin:0 auto;padding:20px 20px 48px}

/* Header */
.header{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:20px;padding:14px 18px;background:rgba(4,8,15,0.85);backdrop-filter:blur(16px) saturate(1.2);-webkit-backdrop-filter:blur(16px) saturate(1.2);border:1px solid var(--border);border-radius:var(--radius)}
.header-left{display:flex;align-items:center;gap:14px;flex-wrap:wrap;min-width:0}
.header h1{font-family:var(--font-display);font-size:1.45rem;font-weight:700;letter-spacing:-.02em;display:flex;align-items:center;gap:10px}
.header h1 .q-icon{display:flex;filter:drop-shadow(0 0 6px rgba(14,165,233,0.6))}
.header h1 .brand{background:linear-gradient(135deg,#00D1FF,var(--violet));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.header h1 .sub{color:var(--text-dim);font-weight:400;font-size:1rem;-webkit-text-fill-color:var(--text-dim)}
.meta-chip{font-family:var(--font-mono);font-size:.72rem;color:var(--text-dim);background:rgba(255,255,255,.04);border:1px solid var(--border);padding:3px 8px;border-radius:99px;display:inline-flex;align-items:center;gap:6px;max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.meta-chip svg{width:11px;height:11px;flex-shrink:0;opacity:.7}
.header-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.status-dot{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);display:inline-block;animation:pulse 2s ease-in-out infinite}
.status-dot.disconnected{background:var(--danger);box-shadow:0 0 8px var(--danger);animation:none}
.status-dot.paused{background:var(--warning);box-shadow:0 0 8px var(--warning);animation:none}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.conn-label{font-size:.78rem;color:var(--text-dim);display:flex;align-items:center;gap:6px;font-family:var(--font-mono)}
.btn{font-family:var(--font-display);font-size:.78rem;font-weight:500;color:var(--text-secondary);background:rgba(255,255,255,.04);border:1px solid var(--border);padding:5px 11px;border-radius:var(--radius-sm);cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:background .2s,border-color .2s,color .2s}
.btn:hover{background:rgba(14,165,233,.08);border-color:var(--accent);color:var(--text-primary)}
.btn svg{width:13px;height:13px}
.btn.active{background:var(--accent-dim);color:var(--accent-bright);border-color:rgba(14,165,233,.4)}
.kbd{font-family:var(--font-mono);font-size:.65rem;color:var(--text-dim);background:rgba(255,255,255,.06);border:1px solid var(--border);border-bottom-width:2px;padding:1px 5px;border-radius:4px;margin-left:4px}

/* KPI strip */
.kpi-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px}
.kpi{background:var(--glass-bg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:var(--radius);padding:12px 14px;display:flex;flex-direction:column;gap:2px;transition:border-color .25s,transform .25s}
.kpi:hover{border-color:var(--border-glow);transform:translateY(-2px)}
.kpi-label{font-size:.66rem;text-transform:uppercase;letter-spacing:.1em;color:var(--text-dim);font-weight:600;display:flex;align-items:center;gap:6px}
.kpi-label svg{width:12px;height:12px;flex-shrink:0}
.kpi-value{font-family:var(--font-display);font-size:1.5rem;font-weight:700;line-height:1.1;color:var(--text-primary)}
.kpi-value.warning{color:var(--warning)}
.kpi-value.danger{color:var(--danger)}
.kpi-value.green{color:var(--green)}
.kpi-value.dim{color:var(--text-dim)}
.kpi-sub{font-size:.7rem;color:var(--text-dim);font-family:var(--font-mono)}

/* Grid */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px;margin-bottom:16px}
.grid-wide{grid-column:1/-1}

/* Cards — reveal animation */
.card{background:var(--glass-bg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:var(--radius);padding:18px 20px;box-shadow:var(--shadow-card);transition:border-color .3s,box-shadow .3s,transform .3s;opacity:0;transform:translateY(16px);animation:cardReveal .5s cubic-bezier(0.16,1,0.3,1) forwards}
.card:hover{border-color:var(--border-glow);box-shadow:var(--shadow-card),var(--shadow-glow)}
@keyframes cardReveal{to{opacity:1;transform:translateY(0)}}

.card-title{font-family:var(--font-display);font-size:.78rem;text-transform:uppercase;letter-spacing:.1em;color:var(--text-dim);margin-bottom:14px;display:flex;align-items:center;gap:8px;font-weight:600}
.card-title svg{width:16px;height:16px;flex-shrink:0;filter:drop-shadow(0 0 4px rgba(14,165,233,0.4))}
.card-title .title-aside{margin-left:auto;font-size:.7rem;color:var(--text-dim);font-weight:400;letter-spacing:.04em;text-transform:none;display:flex;align-items:center;gap:6px}

/* Health donut */
.health-row{display:flex;align-items:center;gap:24px}
.donut-wrap{position:relative;width:100px;height:100px;flex-shrink:0}
.donut-wrap svg{transform:rotate(-90deg)}
.donut-wrap .donut-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;font-size:1.5rem;font-weight:700;line-height:1;font-family:var(--font-display)}
.donut-wrap .donut-label small{font-size:.7rem;color:var(--text-dim);font-weight:400;margin-top:2px;letter-spacing:.04em}
.health-legend{display:flex;flex-direction:column;gap:6px;font-family:var(--font-mono)}
.legend-item{display:flex;align-items:center;gap:8px;font-size:.82rem}
.legend-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.scope-row{display:flex;gap:6px;margin-top:14px;flex-wrap:wrap;font-family:var(--font-mono);font-size:.72rem;color:var(--text-dim)}
.scope-pill{padding:2px 8px;border-radius:99px;background:rgba(255,255,255,.04);border:1px solid var(--border)}
.scope-pill strong{color:var(--text-primary);margin-right:4px;font-weight:600}

/* Decay bars */
.decay-list{display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto}
.decay-item{display:flex;align-items:center;gap:10px}
.decay-key{font-family:var(--font-mono);font-size:.85rem;min-width:120px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.decay-bar{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden;position:relative}
.decay-fill{height:100%;border-radius:3px;transition:width .6s ease}
.decay-time{font-size:.8rem;color:var(--text-dim);min-width:60px;text-align:right;font-family:var(--font-mono)}

/* Superposition pills */
.super-list{display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto}
.super-item{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.super-key{font-family:var(--font-mono);font-size:.85rem;min-width:100px}
.env-pill{font-size:.72rem;padding:2px 8px;border-radius:99px;font-weight:600;letter-spacing:.03em;font-family:var(--font-mono)}
.env-prod{background:rgba(255,0,85,0.2);color:var(--pink);border:1px solid rgba(255,0,85,0.3)}
.env-staging{background:rgba(251,191,36,0.15);color:var(--warning);border:1px solid rgba(251,191,36,0.25)}
.env-dev{background:rgba(34,197,94,0.15);color:var(--green);border:1px solid rgba(34,197,94,0.25)}
.env-default{background:rgba(168,85,247,0.15);color:var(--violet);border:1px solid rgba(168,85,247,0.25)}
.env-test{background:rgba(14,165,233,0.15);color:var(--accent-bright);border:1px solid rgba(14,165,233,0.25)}

/* Entanglement */
.entangle-list{display:flex;flex-direction:column;gap:6px;max-height:240px;overflow-y:auto}
.entangle-pair{display:flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:.83rem}
.entangle-arrow{color:var(--accent-bright)}

/* Tunnels */
.tunnel-list{display:flex;flex-direction:column;gap:8px;max-height:240px;overflow-y:auto}
.tunnel-card{background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.15);border-radius:var(--radius-sm);padding:10px 12px;font-size:.83rem;font-family:var(--font-mono)}
.tunnel-meta{display:flex;gap:12px;margin-top:4px;font-size:.78rem;color:var(--text-dim)}

/* Audit feed */
.audit-toolbar{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;align-items:center}
.audit-actions-strip{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.audit-chip{font-family:var(--font-mono);font-size:.7rem;padding:2px 9px;border-radius:99px;background:rgba(255,255,255,.04);border:1px solid var(--border);color:var(--text-secondary);cursor:pointer;transition:all .2s}
.audit-chip:hover{border-color:var(--accent);color:var(--text-primary)}
.audit-chip.active{background:var(--accent-dim);color:var(--accent-bright);border-color:rgba(14,165,233,.4)}
.audit-chip strong{color:var(--text-primary);margin-left:5px;font-weight:600}
.audit-feed{display:flex;flex-direction:column;gap:2px;max-height:340px;overflow-y:auto;font-size:.82rem;font-family:var(--font-mono)}
.audit-row{display:grid;grid-template-columns:78px 76px 56px 1fr;gap:8px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);align-items:baseline}
.audit-ts{color:var(--text-dim)}
.audit-action{font-weight:600}
.audit-action.read{color:var(--accent)}.audit-action.write{color:var(--green)}.audit-action.delete{color:var(--danger)}
.audit-action.entangle{color:var(--violet)}.audit-action.tunnel{color:var(--violet)}.audit-action.teleport{color:var(--warning)}
.audit-action.generate{color:var(--warning)}.audit-action.list{color:var(--text-dim)}.audit-action.export{color:var(--text-dim)}
.audit-action.collapse{color:var(--accent)}.audit-action.approve{color:var(--green)}.audit-action.revoke{color:var(--danger)}
.audit-action.policy_deny{color:var(--danger)}.audit-action.rotate{color:var(--violet)}
.audit-source{color:var(--text-dim);font-size:.72rem;text-transform:uppercase;letter-spacing:.04em}
.audit-detail{color:var(--text-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.audit-key{color:var(--text-secondary)}

/* Anomalies */
.anomaly-list{display:flex;flex-direction:column;gap:8px}
.anomaly-card{background:rgba(255,94,91,0.06);border:1px solid rgba(255,94,91,0.15);border-radius:var(--radius-sm);padding:10px 14px;animation:anomaly-pulse 3s ease-in-out infinite}
@keyframes anomaly-pulse{0%,100%{border-color:rgba(255,94,91,0.15)}50%{border-color:rgba(255,94,91,0.4)}}
.anomaly-type{font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--danger);font-weight:700;margin-bottom:2px;font-family:var(--font-display)}
.anomaly-desc{font-size:.86rem;color:var(--text-primary)}
.anomaly-hint{font-size:.74rem;color:var(--text-dim);margin-top:4px;font-family:var(--font-mono)}

/* Environment badge */
.env-status{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.env-big{font-size:1rem;font-weight:700;padding:4px 14px;border-radius:var(--radius-sm)}
.env-source{font-size:.78rem;color:var(--text-dim);font-family:var(--font-mono)}

/* Manifest */
.manifest-bars{display:flex;flex-direction:column;gap:8px}
.manifest-row{display:flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:.78rem}
.manifest-bar{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden}
.manifest-fill{height:100%;border-radius:3px}
.manifest-list{margin-top:10px;display:flex;flex-direction:column;gap:3px;font-family:var(--font-mono);font-size:.78rem;color:var(--text-secondary)}
.manifest-list .label{color:var(--text-dim);text-transform:uppercase;font-size:.66rem;letter-spacing:.08em;margin-top:6px}
.manifest-list .key-pill{display:inline-block;padding:1px 6px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:4px;margin:1px 3px 1px 0;font-size:.74rem}
.manifest-list .key-pill.miss{color:var(--danger);border-color:rgba(255,94,91,.3)}
.manifest-list .key-pill.exp{color:var(--warning);border-color:rgba(251,191,36,.3)}

/* Policy */
.policy-rows{display:flex;flex-direction:column;gap:6px;font-family:var(--font-mono);font-size:.78rem;color:var(--text-secondary)}
.policy-row{display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.policy-label{color:var(--text-dim)}
.policy-value{color:var(--text-primary)}
.policy-value.zero{color:var(--text-dim)}

/* Approvals */
.approval-list{display:flex;flex-direction:column;gap:8px;max-height:240px;overflow-y:auto}
.approval-card{background:rgba(34,197,94,.05);border:1px solid rgba(34,197,94,.2);border-radius:var(--radius-sm);padding:10px 12px;font-size:.82rem}
.approval-card.tampered{background:rgba(255,94,91,.06);border-color:rgba(255,94,91,.4)}
.approval-card.expiring{background:rgba(251,191,36,.06);border-color:rgba(251,191,36,.3)}
.approval-head{display:flex;justify-content:space-between;gap:8px;font-family:var(--font-mono);font-weight:600}
.approval-reason{color:var(--text-dim);font-size:.76rem;margin-top:3px}
.approval-meta{display:flex;gap:12px;margin-top:4px;font-size:.72rem;color:var(--text-dim);font-family:var(--font-mono)}

/* Hooks */
.hooks-list{display:flex;flex-direction:column;gap:6px;max-height:240px;overflow-y:auto}
.hook-row{display:flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:.8rem;padding:6px 10px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--radius-sm)}
.hook-row.disabled{opacity:.5}
.hook-type{font-size:.7rem;text-transform:uppercase;font-weight:600;padding:1px 6px;border-radius:99px;letter-spacing:.04em}
.hook-type.shell{background:rgba(168,85,247,.15);color:var(--violet)}
.hook-type.http{background:rgba(14,165,233,.15);color:var(--accent-bright)}
.hook-type.signal{background:rgba(251,191,36,.15);color:var(--warning)}
.hook-summary{flex:1;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hook-id{color:var(--text-dim);font-size:.72rem}

/* Secrets table */
.secrets-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;align-items:center}
.search{flex:1;min-width:180px;display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--radius-sm);padding:5px 10px;transition:border-color .2s}
.search:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px rgba(14,165,233,.12)}
.search svg{width:13px;height:13px;color:var(--text-dim);flex-shrink:0}
.search input{flex:1;background:transparent;border:none;outline:none;color:var(--text-primary);font-family:var(--font-mono);font-size:.82rem}
.search input::placeholder{color:var(--text-dim)}
.secrets-table-wrap{max-height:380px;overflow:auto;border:1px solid var(--border);border-radius:var(--radius-sm);background:rgba(4,8,15,.4)}
.secrets-table{width:100%;border-collapse:collapse;font-family:var(--font-mono);font-size:.78rem}
.secrets-table thead th{position:sticky;top:0;background:rgba(8,14,24,.95);backdrop-filter:blur(8px);text-align:left;padding:8px 10px;color:var(--text-dim);font-weight:600;font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border);cursor:pointer;user-select:none;white-space:nowrap}
.secrets-table thead th:hover{color:var(--text-primary)}
.secrets-table thead th .sort-arrow{display:inline-block;margin-left:4px;color:var(--accent-bright);opacity:0;font-size:.7rem}
.secrets-table thead th.sorted .sort-arrow{opacity:1}
.secrets-table tbody td{padding:6px 10px;border-bottom:1px solid rgba(255,255,255,.03);color:var(--text-secondary);vertical-align:middle}
.secrets-table tbody tr:hover td{background:rgba(14,165,233,.05);color:var(--text-primary)}
.secrets-table .col-key{color:var(--text-primary);font-weight:500;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.secrets-table .col-decay{min-width:90px}
.secrets-table .col-tags{max-width:200px;overflow:hidden}
.tag-pill{display:inline-block;font-size:.68rem;padding:1px 6px;background:rgba(168,85,247,.1);color:var(--violet);border:1px solid rgba(168,85,247,.2);border-radius:99px;margin-right:3px;font-family:var(--font-mono)}
.scope-tag{display:inline-block;font-size:.68rem;padding:1px 6px;border-radius:4px;letter-spacing:.04em;font-weight:600;text-transform:uppercase}
.scope-tag.global{background:rgba(14,165,233,.15);color:var(--accent-bright)}
.scope-tag.project{background:rgba(34,197,94,.15);color:var(--green)}
.scope-tag.team{background:rgba(168,85,247,.15);color:var(--violet)}
.scope-tag.org{background:rgba(251,191,36,.15);color:var(--warning)}
.type-tag{display:inline-block;font-size:.68rem;padding:1px 6px;border-radius:4px;letter-spacing:.04em;text-transform:uppercase;background:rgba(255,255,255,.05);color:var(--text-dim)}
.type-tag.superposition{background:rgba(168,85,247,.12);color:var(--violet)}
.protected-icon{color:var(--warning);margin-left:4px;display:inline-flex;vertical-align:middle}
.mini-decay{display:inline-flex;align-items:center;gap:6px;width:100%}
.mini-decay-bar{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.06);overflow:hidden;min-width:30px}
.mini-decay-fill{height:100%;border-radius:2px}
.mini-decay-time{color:var(--text-dim);font-size:.7rem;min-width:38px;text-align:right}

/* Empty states */
.empty{color:var(--text-dim);font-size:.86rem;font-style:italic;padding:8px 0}
.empty-cta{margin-top:6px;display:block;font-style:normal;font-family:var(--font-mono);font-size:.78rem;color:var(--accent-bright)}

/* Footer */
.foot{margin-top:24px;text-align:center;color:var(--text-dim);font-size:.72rem;font-family:var(--font-mono)}
.foot a{color:var(--accent-bright);text-decoration:none}
.foot a:hover{text-decoration:underline}

/* Scrollbar */
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.15)}

/* Print */
@media print{
  .blob,.header-right{display:none}
  .header{position:static}
  body{background:#fff;color:#000}
}
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
  <header class="header">
    <div class="header-left">
      <h1>
        <span class="q-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#neon-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></span>
        <span class="brand">q-ring</span>
        <span class="sub">quantum status</span>
      </h1>
      <span class="meta-chip" id="versionChip" title="q-ring version"></span>
      <span class="meta-chip" id="projectChip" title="Project working directory"></span>
    </div>
    <div class="header-right">
      <span class="conn-label" title="Last update from the live stream"><span id="lastUpdate">—</span></span>
      <button class="btn" id="pauseBtn" type="button" title="Pause / resume the live stream (P)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        <span id="pauseLabel">Pause</span>
      </button>
      <button class="btn" id="refreshBtn" type="button" title="Force-refresh now (R)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3.5-7.1"/><polyline points="21 3 21 9 15 9"/></svg>
        Refresh
      </button>
      <a class="btn" id="jsonLink" href="/api/status" target="_blank" rel="noopener" title="Open the raw JSON snapshot in a new tab">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        JSON
      </a>
      <span class="conn-label"><span class="status-dot" id="connDot"></span><span id="connText">connecting…</span></span>
    </div>
  </header>

  <section class="kpi-strip" id="kpiStrip"></section>

  <section class="grid" id="overviewGrid"></section>

  <section id="secretsSection"></section>

  <section class="grid" id="quantumGrid"></section>

  <section class="grid" id="govGrid"></section>

  <section class="grid" id="anomalyAuditGrid"></section>

  <p class="foot">
    <span id="footMeta">—</span>
    · keyboard: <span class="kbd">/</span> search · <span class="kbd">P</span> pause · <span class="kbd">R</span> refresh
  </p>
</div>

<script>
(function(){
  const $ = (id) => document.getElementById(id);

  /* --- SVG icon library (matching gh-pages neon gradient) --- */
  const ic = (path) => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="url(#neon-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';
  const icons = {
    health:        ic('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
    environment:   ic('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'),
    decay:         ic('<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>'),
    superposition: ic('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'),
    entangle:      ic('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
    tunnel:        ic('<path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>'),
    anomaly:       ic('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    audit:         ic('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
    key:           ic('<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>'),
    shield:        ic('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
    hook:          ic('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
    approve:       ic('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
    manifest:      ic('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'),
    policy:        ic('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>'),
    memory:        ic('<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="14" x2="22" y2="14"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="14" x2="4" y2="14"/>'),
    folder:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    tag:           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    search:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    lock:          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
  };

  function esc(s){ const d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML; }

  function envClass(e){
    if(!e) return 'env-default';
    const k=e.toLowerCase();
    if(k==='prod'||k==='production') return 'env-prod';
    if(k==='staging'||k==='stage') return 'env-staging';
    if(k==='dev'||k==='development') return 'env-dev';
    if(k==='test'||k==='testing') return 'env-test';
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

  function fmtRelative(ts){
    if(!ts) return '—';
    const diff=Math.floor((Date.now()-new Date(ts).getTime())/1000);
    if(isNaN(diff)) return '—';
    if(diff<5) return 'just now';
    if(diff<60) return diff+'s ago';
    if(diff<3600) return Math.floor(diff/60)+'m ago';
    if(diff<86400) return Math.floor(diff/3600)+'h ago';
    return Math.floor(diff/86400)+'d ago';
  }

  function fmtDuration(seconds){
    if(seconds==null) return '—';
    if(seconds<0) return 'expired';
    if(seconds<60) return seconds+'s';
    if(seconds<3600) return Math.floor(seconds/60)+'m';
    if(seconds<86400) return Math.floor(seconds/3600)+'h';
    return Math.floor(seconds/86400)+'d';
  }

  /* --- State --- */
  const state = {
    snapshot: null,
    paused: false,
    secretsQuery: '',
    secretsSort: { col: 'lastAccessedAt', dir: 'desc' },
    auditFilter: { action: '', source: '', text: '' }
  };

  /* --- Renderers --- */

  function renderHeaderMeta(s){
    $('versionChip').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> v'+esc(s.version);
    $('projectChip').innerHTML = icons.folder + ' ' + esc(s.projectPath);
  }

  function renderKpis(s){
    const m = s.auditMetrics || { total:0, byAction:{}, topRead:[] };
    const reads = m.byAction.read || 0;
    const writes = (m.byAction.write||0) + (m.byAction.delete||0) + (m.byAction.rotate||0);
    const denied = m.byAction.policy_deny || 0;
    const enabledHooks = (s.hooks||[]).filter(h=>h.enabled).length;
    const validApprovals = (s.approvals||[]).filter(a=>a.valid).length;

    const items = [
      { label: 'Secrets', icon: icons.key, value: s.health.total, sub: s.health.healthy+' healthy · '+s.health.stale+' stale · '+s.health.expired+' expired', cls: '' },
      { label: 'Environment', icon: icons.environment, value: s.environment ? s.environment.env : 'none', sub: s.environment ? 'via '+s.environment.source : 'no env detected', cls: s.environment ? '' : 'dim' },
      { label: 'Protected', icon: icons.lock, value: s.protectedCount, sub: 'require approval', cls: s.protectedCount>0 ? 'warning' : 'dim' },
      { label: 'Approvals', icon: icons.approve, value: validApprovals, sub: 'active grants', cls: validApprovals>0 ? 'green' : 'dim' },
      { label: 'Hooks', icon: icons.hook, value: enabledHooks, sub: 'enabled / '+(s.hooks||[]).length+' total', cls: enabledHooks>0 ? '' : 'dim' },
      { label: 'Reads (24h)', icon: icons.audit, value: reads, sub: writes+' writes · '+denied+' denied', cls: '' },
      { label: 'Anomalies', icon: icons.anomaly, value: (s.anomalies||[]).length, sub: (s.anomalies||[]).length ? 'investigate now' : 'all clear', cls: (s.anomalies||[]).length ? 'danger' : 'green' }
    ];
    $('kpiStrip').innerHTML = items.map(k =>
      '<div class="kpi"><div class="kpi-label">'+k.icon+esc(k.label)+'</div><div class="kpi-value '+k.cls+'">'+esc(k.value)+'</div><div class="kpi-sub">'+esc(k.sub)+'</div></div>'
    ).join('');
  }

  function renderHealthCard(s){
    const h=s.health;
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
      rings+='<circle cx="50" cy="50" r="'+r+'" fill="none" stroke="'+sl.c+'" stroke-width="12" stroke-dasharray="'+len+' '+(circ-len)+'" stroke-dashoffset="-'+offset+'" stroke-linecap="round" opacity="0.85"/>';
      offset+=len;
    }
    const sc=s.scopes||{global:0,project:0,team:0,org:0};
    const scopeRow = '<div class="scope-row">'+
      ['global','project','team','org'].filter(k=>sc[k]).map(k =>
        '<span class="scope-pill"><strong>'+sc[k]+'</strong>'+k+'</span>'
      ).join('') + '</div>';

    return '<div class="card-title">'+icons.health+'Health Summary'+
      '<span class="title-aside">'+esc(h.healthy)+'/'+esc(h.total)+' healthy</span></div>'+
      '<div class="health-row">'+
      '<div class="donut-wrap">'+
      '<svg viewBox="0 0 100 100" width="100" height="100">'+rings+'</svg>'+
      '<div class="donut-label">'+h.total+'<small>secrets</small></div>'+
      '</div>'+
      '<div class="health-legend">'+
      '<div class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Healthy '+h.healthy+'</div>'+
      '<div class="legend-item"><span class="legend-dot" style="background:var(--warning)"></span>Stale '+h.stale+'</div>'+
      '<div class="legend-item"><span class="legend-dot" style="background:var(--danger)"></span>Expired '+h.expired+'</div>'+
      '<div class="legend-item"><span class="legend-dot" style="background:var(--text-dim)"></span>No decay '+h.noDecay+'</div>'+
      '</div>'+
      '</div>'+ scopeRow;
  }

  function renderEnvCard(s){
    const env=s.environment;
    const body = env
      ? '<div class="env-status"><span class="env-big env-pill '+envClass(env.env)+'">'+esc(env.env)+'</span><span class="env-source">detected via '+esc(env.source)+'</span></div>'
      : '<div class="empty">No environment detected.<span class="empty-cta">$ qring env --project-path .</span></div>';
    return '<div class="card-title">'+icons.environment+'Environment'+'</div>'+ body;
  }

  function renderManifestCard(s){
    const m=s.manifest;
    if(!m){
      return '<div class="card-title">'+icons.manifest+'Manifest</div>'+
        '<div class="empty">No <code>.q-ring.json</code> manifest in this project.<span class="empty-cta">$ qring wizard &lt;name&gt;</span></div>';
    }
    const ok = m.required - m.missing.length - m.expired.length - m.stale.length;
    const okPct = m.required ? Math.max(0, Math.round((ok/m.required)*100)) : 100;
    const fillCol = m.missing.length ? 'var(--danger)' : (m.expired.length||m.stale.length ? 'var(--warning)' : 'var(--green)');

    const list = [];
    if(m.missing.length){
      list.push('<div class="label">Missing required ('+m.missing.length+')</div><div>'+m.missing.map(k=>'<span class="key-pill miss">'+esc(k)+'</span>').join('')+'</div>');
    }
    if(m.expired.length){
      list.push('<div class="label">Expired ('+m.expired.length+')</div><div>'+m.expired.map(k=>'<span class="key-pill exp">'+esc(k)+'</span>').join('')+'</div>');
    }
    if(m.stale.length){
      list.push('<div class="label">Stale ('+m.stale.length+')</div><div>'+m.stale.map(k=>'<span class="key-pill exp">'+esc(k)+'</span>').join('')+'</div>');
    }
    if(!list.length) list.push('<div class="label">All required keys present and healthy.</div>');

    return '<div class="card-title">'+icons.manifest+'Manifest'+
      '<span class="title-aside">'+esc(m.required)+' required / '+esc(m.declared)+' declared</span></div>'+
      '<div class="manifest-bars">'+
      '<div class="manifest-row"><span style="min-width:54px">healthy</span><div class="manifest-bar"><div class="manifest-fill" style="width:'+okPct+'%;background:'+fillCol+'"></div></div><span>'+okPct+'%</span></div>'+
      '</div>'+
      '<div class="manifest-list">'+list.join('')+'</div>';
  }

  function renderPolicyCard(s){
    const p=s.policy||{counts:{}};
    const c=p.counts||{};
    const has = p.hasMcpPolicy || p.hasExecPolicy || p.hasSecretPolicy;
    if(!has){
      return '<div class="card-title">'+icons.policy+'Policy</div>'+
        '<div class="empty">No governance policy declared.<span class="empty-cta">add <code>policy</code> to <code>.q-ring.json</code></span></div>';
    }
    const row = (label,value) => '<div class="policy-row"><span class="policy-label">'+esc(label)+'</span><span class="policy-value '+(value?'':'zero')+'">'+esc(value || '—')+'</span></div>';
    return '<div class="card-title">'+icons.policy+'Policy'+
      '<span class="title-aside">'+esc([
        p.hasMcpPolicy?'mcp':'', p.hasExecPolicy?'exec':'', p.hasSecretPolicy?'secrets':''
      ].filter(Boolean).join(' · ') || 'none')+'</span></div>'+
      '<div class="policy-rows">'+
      row('MCP allow tools', c.allowTools)+
      row('MCP deny tools', c.denyTools)+
      row('Denied keys', c.deniedKeys)+
      row('Denied tags', c.deniedTags)+
      row('Exec allow', c.allowCommands)+
      row('Exec deny', c.denyCommands)+
      row('Tag → approval', c.requireApprovalForTags)+
      row('Tag → rotation', c.requireRotationFormatForTags)+
      (p.maxTtlSeconds ? row('Max TTL', fmtDuration(p.maxTtlSeconds)) : '')+
      (p.maxRuntimeSeconds ? row('Max exec runtime', fmtDuration(p.maxRuntimeSeconds)) : '')+
      '</div>';
  }

  function renderDecayCard(s){
    const withDecay = (s.secrets||[]).filter(x=>x.decay && x.decay.timeRemaining)
      .sort((a,b)=>(a.decay.secondsRemaining||0)-(b.decay.secondsRemaining||0));
    const inner = !withDecay.length
      ? '<div class="empty">No secrets with decay configured.<span class="empty-cta">$ qring set KEY --ttl 86400</span></div>'
      : '<div class="decay-list">'+withDecay.slice(0,12).map(x=>{
          const pct=Math.min(x.decay.lifetimePercent,100);
          const col=decayColor(pct,x.decay.isExpired);
          const label=x.decay.isExpired?'expired':x.decay.timeRemaining||'';
          return '<div class="decay-item"><span class="decay-key" title="'+esc(x.key)+'">'+esc(x.key)+'</span>'+
            '<div class="decay-bar"><div class="decay-fill" style="width:'+pct+'%;background:'+col+'"></div></div>'+
            '<span class="decay-time" style="color:'+col+'">'+esc(label)+'</span></div>';
        }).join('')+'</div>';
    return '<div class="card-title">'+icons.decay+'Decay Timers'+
      '<span class="title-aside">'+esc(withDecay.length)+' tracked</span></div>'+ inner;
  }

  function renderSuperpositionCard(s){
    const sup = (s.secrets||[]).filter(x=>x.type==='superposition' && x.environments && x.environments.length);
    const inner = !sup.length
      ? '<div class="empty">No secrets in superposition.<span class="empty-cta">$ qring set KEY --env prod</span></div>'
      : '<div class="super-list">'+sup.slice(0,14).map(x=>{
          const pills=(x.environments||[]).map(e =>
            '<span class="env-pill '+envClass(e)+'">'+esc(e)+(e===x.defaultEnv?' ✓':'')+'</span>'
          ).join('');
          return '<div class="super-item"><span class="super-key">'+esc(x.key)+'</span>'+pills+'</div>';
        }).join('')+'</div>';
    return '<div class="card-title">'+icons.superposition+'Superposition'+
      '<span class="title-aside">'+esc(sup.length)+' multi-env</span></div>'+ inner;
  }

  function renderEntanglementCard(s){
    const pairs=s.entanglements||[];
    const seen=new Set();
    const unique=pairs.filter(p=>{
      const id=[p.source.service,p.source.key,p.target.service,p.target.key].sort().join('|');
      if(seen.has(id)) return false;
      seen.add(id);return true;
    });
    const inner = !unique.length
      ? '<div class="empty">No entangled secrets.<span class="empty-cta">$ qring entangle KEY_A KEY_B</span></div>'
      : '<div class="entangle-list">'+unique.slice(0,12).map(p =>
          '<div class="entangle-pair"><span>'+esc(p.source.key)+'</span><span class="entangle-arrow">↔</span><span>'+esc(p.target.key)+'</span></div>'
        ).join('')+'</div>';
    return '<div class="card-title">'+icons.entangle+'Entanglement'+
      '<span class="title-aside">'+esc(unique.length)+' pair'+(unique.length===1?'':'s')+'</span></div>'+ inner;
  }

  function renderTunnelsCard(s){
    const tunnels=s.tunnels||[];
    const inner = !tunnels.length
      ? '<div class="empty">No active tunnels.<span class="empty-cta">$ qring tunnel create &lt;value&gt;</span></div>'
      : '<div class="tunnel-list">'+tunnels.map(t=>{
          const rem=t.expiresAt?Math.max(0,Math.floor((t.expiresAt-Date.now())/1000)):null;
          return '<div class="tunnel-card">'+esc(t.id)+'<div class="tunnel-meta">'+
            '<span>reads: '+t.accessCount+(t.maxReads?'/'+t.maxReads:'')+'</span>'+
            (rem!==null?'<span>expires: '+rem+'s</span>':'<span>no expiry</span>')+
            '</div></div>';
        }).join('')+'</div>';
    return '<div class="card-title">'+icons.tunnel+'Quantum Tunnels'+
      '<span class="title-aside">'+esc(tunnels.length)+' live</span></div>'+ inner;
  }

  function renderApprovalsCard(s){
    const list=s.approvals||[];
    const inner = !list.length
      ? '<div class="empty">No active approvals.<span class="empty-cta">$ qring approve KEY --for 1800 --reason "..."</span></div>'
      : '<div class="approval-list">'+list.slice(0,8).map(a => {
          const cls = a.tampered ? 'tampered' : (a.secondsRemaining < 300 ? 'expiring' : '');
          return '<div class="approval-card '+cls+'">'+
            '<div class="approval-head"><span>'+esc(a.key)+(a.tampered?' ⚠ TAMPERED':'')+'</span><span>'+esc(fmtDuration(a.secondsRemaining))+' left</span></div>'+
            '<div class="approval-reason">'+esc(a.reason||'(no reason)')+'</div>'+
            '<div class="approval-meta"><span>scope:'+esc(a.scope)+'</span><span>by:'+esc(a.grantedBy)+'</span></div>'+
            '</div>';
        }).join('')+'</div>';
    return '<div class="card-title">'+icons.approve+'Approvals'+
      '<span class="title-aside">'+esc(list.filter(a=>a.valid).length)+' valid</span></div>'+ inner;
  }

  function renderHooksCard(s){
    const list=s.hooks||[];
    const inner = !list.length
      ? '<div class="empty">No hooks registered.<span class="empty-cta">$ qring hook add --tag payments --action rotate --exec "..."</span></div>'
      : '<div class="hooks-list">'+list.slice(0,8).map(h =>
          '<div class="hook-row '+(h.enabled?'':'disabled')+'">'+
            '<span class="hook-type '+esc(h.type)+'">'+esc(h.type)+'</span>'+
            '<span class="hook-summary" title="'+esc(h.matchSummary)+'">'+esc(h.description||h.matchSummary)+'</span>'+
            '<span class="hook-id">'+esc(h.id)+'</span>'+
          '</div>'
        ).join('')+'</div>';
    return '<div class="card-title">'+icons.hook+'Hooks'+
      '<span class="title-aside">'+esc(list.filter(h=>h.enabled).length)+' enabled / '+esc(list.length)+'</span></div>'+ inner;
  }

  function renderMemoryCard(s){
    const inner = '<div class="empty" style="display:flex;align-items:baseline;gap:8px;font-style:normal">'+
      '<span style="font-size:1.6rem;font-weight:700;color:var(--text-primary);font-family:var(--font-display)">'+esc(s.memoryKeys||0)+'</span>'+
      '<span>memory key'+(s.memoryKeys===1?'':'s')+' encrypted at <code>~/.config/q-ring/agent-memory.enc</code></span>'+
      '</div>';
    return '<div class="card-title">'+icons.memory+'Agent Memory</div>'+ inner;
  }

  function renderAnomalies(s){
    const list=s.anomalies||[];
    if(!list.length) return '<div class="card-title">'+icons.anomaly+'Anomaly Alerts<span class="title-aside" style="color:var(--green)">all clear</span></div>'+
      '<div class="empty">No anomalies detected — quantum field is stable.</div>';
    return '<div class="card-title">'+icons.anomaly+'Anomaly Alerts'+
      '<span class="title-aside" style="color:var(--danger)">'+esc(list.length)+' active</span></div>'+
      '<div class="anomaly-list">'+list.map(a=>{
        const hint = a.type==='tampered' ? '$ qring audit:verify' :
                     a.type==='burst' ? '$ qring audit --key … --action read' :
                     a.type==='unusual-hour' ? '$ qring audit --action read --since "1am"' :
                     '$ qring audit --limit 100';
        return '<div class="anomaly-card"><div class="anomaly-type">'+esc(a.type)+'</div><div class="anomaly-desc">'+esc(a.description)+'</div><div class="anomaly-hint">'+esc(hint)+'</div></div>';
      }).join('')+'</div>';
  }

  /* --- Secrets table --- */

  function renderSecretsSection(){
    const s = state.snapshot;
    if(!s) return '';
    const filtered = filterSecrets(s.secrets||[]);
    sortRows(filtered, state.secretsSort);

    return '<div class="card grid-wide" style="margin-bottom:16px">'+
      '<div class="card-title">'+icons.key+'Secrets'+
      '<span class="title-aside">'+filtered.length+' of '+(s.secrets||[]).length+'</span></div>'+
      '<div class="secrets-toolbar">'+
        '<label class="search">'+icons.search+'<input id="secretsSearch" type="search" placeholder="Filter by key, scope, env, tag, provider…" autocomplete="off" value="'+esc(state.secretsQuery)+'"/></label>'+
        '<button class="btn" type="button" data-quick="expired">'+esc((s.health.expired||0))+' expired</button>'+
        '<button class="btn" type="button" data-quick="stale">'+esc((s.health.stale||0))+' stale</button>'+
        '<button class="btn" type="button" data-quick="protected">'+esc(s.protectedCount||0)+' protected</button>'+
        '<button class="btn" type="button" data-quick="">clear</button>'+
      '</div>'+
      '<div class="secrets-table-wrap">'+ renderTable(filtered) +'</div>'+
    '</div>';
  }

  function renderTable(rows){
    if(!rows.length) return '<div class="empty" style="padding:18px;text-align:center">No secrets match the filter.</div>';
    const cols = [
      { id:'key',    label:'Key' },
      { id:'scope',  label:'Scope' },
      { id:'env',    label:'Env' },
      { id:'type',   label:'Type' },
      { id:'decay',  label:'Decay' },
      { id:'tags',   label:'Tags' },
      { id:'lastAccessedAt', label:'Last read' }
    ];
    const sort = state.secretsSort;
    const head = '<thead><tr>'+cols.map(c =>
      '<th data-sort="'+c.id+'" class="'+(sort.col===c.id?'sorted':'')+'">'+esc(c.label)+'<span class="sort-arrow">'+(sort.dir==='asc'?'▲':'▼')+'</span></th>'
    ).join('')+'</tr></thead>';
    const body = '<tbody>'+rows.map(r=>{
      const env = r.type==='superposition'
        ? (r.environments||[]).map(e=>'<span class="env-pill '+envClass(e)+'" style="margin-right:3px">'+esc(e)+(e===r.defaultEnv?' ✓':'')+'</span>').join('')
        : '<span class="env-pill env-default">—</span>';
      const decayHtml = r.decay && r.decay.timeRemaining
        ? (function(){
            const pct=Math.min(r.decay.lifetimePercent,100);
            const col=decayColor(pct,r.decay.isExpired);
            return '<span class="mini-decay"><span class="mini-decay-bar"><span class="mini-decay-fill" style="width:'+pct+'%;background:'+col+'"></span></span><span class="mini-decay-time" style="color:'+col+'">'+esc(r.decay.isExpired?'expired':r.decay.timeRemaining)+'</span></span>';
          })()
        : '<span class="mini-decay-time">—</span>';
      const tags = (r.tags||[]).slice(0,3).map(t=>'<span class="tag-pill">'+esc(t)+'</span>').join('') + ((r.tags||[]).length>3?'+'+((r.tags||[]).length-3):'');
      const protectedIcon = r.requiresApproval ? '<span class="protected-icon" title="requires approval for MCP read">'+icons.lock+'</span>' : '';
      return '<tr>'+
        '<td class="col-key" title="'+esc(r.key)+'">'+esc(r.key)+protectedIcon+'</td>'+
        '<td><span class="scope-tag '+esc(r.scope)+'">'+esc(r.scope)+'</span></td>'+
        '<td>'+env+'</td>'+
        '<td><span class="type-tag '+esc(r.type)+'">'+esc(r.type)+'</span></td>'+
        '<td class="col-decay">'+decayHtml+'</td>'+
        '<td class="col-tags">'+tags+'</td>'+
        '<td>'+esc(fmtRelative(r.lastAccessedAt))+'</td>'+
      '</tr>';
    }).join('')+'</tbody>';
    return '<table class="secrets-table">'+head+body+'</table>';
  }

  function filterSecrets(rows){
    const q=state.secretsQuery.trim().toLowerCase();
    if(!q) return rows.slice();
    if(q==='expired') return rows.filter(r=>r.decay && r.decay.isExpired);
    if(q==='stale') return rows.filter(r=>r.decay && r.decay.isStale && !r.decay.isExpired);
    if(q==='protected') return rows.filter(r=>r.requiresApproval);
    return rows.filter(r=>{
      const hay = [r.key, r.scope, r.type, r.provider||'', r.defaultEnv||'',
        (r.environments||[]).join(' '), (r.tags||[]).join(' ')].join(' ').toLowerCase();
      return hay.indexOf(q)!==-1;
    });
  }

  function sortRows(rows, sort){
    const dir = sort.dir==='asc' ? 1 : -1;
    rows.sort((a,b)=>{
      let av, bv;
      switch(sort.col){
        case 'key': av=a.key; bv=b.key; break;
        case 'scope': av=a.scope; bv=b.scope; break;
        case 'env': av=a.defaultEnv||(a.environments||[])[0]||''; bv=b.defaultEnv||(b.environments||[])[0]||''; break;
        case 'type': av=a.type; bv=b.type; break;
        case 'decay': av=a.decay && a.decay.secondsRemaining!=null?a.decay.secondsRemaining:Infinity; bv=b.decay && b.decay.secondsRemaining!=null?b.decay.secondsRemaining:Infinity; break;
        case 'tags': av=(a.tags||[]).join(','); bv=(b.tags||[]).join(','); break;
        case 'lastAccessedAt':
        default: av=a.lastAccessedAt?new Date(a.lastAccessedAt).getTime():0; bv=b.lastAccessedAt?new Date(b.lastAccessedAt).getTime():0;
      }
      if(av<bv) return -1*dir;
      if(av>bv) return 1*dir;
      return 0;
    });
  }

  /* --- Audit feed --- */

  function renderAuditCard(s){
    const events = s.audit || [];
    const m = s.auditMetrics || { byAction:{}, bySource:{} };
    const filtered = events.filter(e =>{
      if(state.auditFilter.action && e.action !== state.auditFilter.action) return false;
      if(state.auditFilter.source && e.source !== state.auditFilter.source) return false;
      const txt=state.auditFilter.text.trim().toLowerCase();
      if(txt){
        const hay = [e.key||'', e.action, e.source, e.detail||'', e.scope||'', e.env||''].join(' ').toLowerCase();
        if(hay.indexOf(txt)===-1) return false;
      }
      return true;
    });

    const allActions = ['read','write','delete','rotate','generate','entangle','tunnel','teleport','approve','revoke','policy_deny','collapse','export'];
    const actionChips = allActions.filter(a=>m.byAction[a])
      .map(a=>'<span class="audit-chip '+(state.auditFilter.action===a?'active':'')+'" data-act="'+a+'">'+a+'<strong>'+m.byAction[a]+'</strong></span>')
      .join('');
    const allSources = ['cli','mcp','agent','ci','hook','api'];
    const sourceChips = allSources.filter(src=>m.bySource[src])
      .map(src=>'<span class="audit-chip '+(state.auditFilter.source===src?'active':'')+'" data-src="'+src+'">'+src+'<strong>'+m.bySource[src]+'</strong></span>')
      .join('');

    const feed = !filtered.length
      ? '<div class="empty">No audit events match the filter.</div>'
      : '<div class="audit-feed">'+filtered.slice(0,80).map(e =>
          '<div class="audit-row">'+
            '<span class="audit-ts" title="'+esc(e.timestamp)+'">'+esc(fmtTime(e.timestamp))+'</span>'+
            '<span class="audit-action '+esc(e.action)+'">'+esc(e.action)+'</span>'+
            '<span class="audit-source">'+esc(e.source)+'</span>'+
            '<span><span class="audit-key">'+esc(e.key||'—')+'</span> <span class="audit-detail">'+esc(e.detail||'')+'</span></span>'+
          '</div>'
        ).join('')+'</div>';

    return '<div class="card-title">'+icons.audit+'Audit Log (24h)'+
      '<span class="title-aside">'+esc(filtered.length)+' of '+esc(events.length)+' shown · window '+esc((s.auditMetrics?.windowSeconds||86400)/3600)+'h</span></div>'+
      '<div class="audit-actions-strip">'+(actionChips||'<span class="empty" style="padding:0">no actions</span>')+'</div>'+
      (sourceChips ? '<div class="audit-actions-strip">'+sourceChips+'</div>' : '')+
      '<div class="audit-toolbar">'+
        '<label class="search">'+icons.search+'<input id="auditSearch" type="search" placeholder="Filter by key, detail, scope…" autocomplete="off" value="'+esc(state.auditFilter.text)+'"/></label>'+
        '<button class="btn" type="button" id="auditClear">clear</button>'+
      '</div>'+ feed;
  }

  /* --- Top-level layout render --- */

  /**
   * Replace innerHTML on a host element while preserving the focused
   * input/textarea inside it, including caret position. Without this guard
   * each 5-second SSE snapshot would reset whatever the user is typing in
   * the secrets / audit search boxes.
   */
  function setHtmlPreservingFocus(host, html){
    const active = document.activeElement;
    const insideHost = active && host.contains(active);
    let focusId, selStart, selEnd, scrollTop;
    if(insideHost && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')){
      focusId = active.id;
      try { selStart = active.selectionStart; selEnd = active.selectionEnd; } catch(_) { /* type lacks selection */ }
    }
    if(insideHost){
      const scroller = active && active.closest && active.closest('.audit-feed,.secrets-table-wrap,.decay-list,.super-list,.entangle-list,.tunnel-list,.approval-list,.hooks-list');
      if(scroller) scrollTop = scroller.scrollTop;
    }
    host.innerHTML = html;
    if(focusId){
      const next = document.getElementById(focusId);
      if(next){
        next.focus();
        try { if(selStart != null) next.setSelectionRange(selStart, selEnd ?? selStart); } catch(_) { /* ignore */ }
      }
    }
    if(scrollTop != null){
      const scroller = host.querySelector('.audit-feed,.secrets-table-wrap,.decay-list,.super-list,.entangle-list,.tunnel-list,.approval-list,.hooks-list');
      if(scroller) scroller.scrollTop = scrollTop;
    }
  }

  function render(snap){
    state.snapshot = snap;
    renderHeaderMeta(snap);
    renderKpis(snap);

    setHtmlPreservingFocus($('overviewGrid'), [
      '<div class="card" style="animation-delay:0ms">'+renderHealthCard(snap)+'</div>',
      '<div class="card" style="animation-delay:60ms">'+renderEnvCard(snap)+'</div>',
      '<div class="card" style="animation-delay:120ms">'+renderManifestCard(snap)+'</div>',
      '<div class="card" style="animation-delay:180ms">'+renderPolicyCard(snap)+'</div>'
    ].join(''));

    setHtmlPreservingFocus($('secretsSection'), renderSecretsSection());

    setHtmlPreservingFocus($('quantumGrid'), [
      '<div class="card" style="animation-delay:0ms">'+renderDecayCard(snap)+'</div>',
      '<div class="card" style="animation-delay:60ms">'+renderSuperpositionCard(snap)+'</div>',
      '<div class="card" style="animation-delay:120ms">'+renderEntanglementCard(snap)+'</div>',
      '<div class="card" style="animation-delay:180ms">'+renderTunnelsCard(snap)+'</div>'
    ].join(''));

    setHtmlPreservingFocus($('govGrid'), [
      '<div class="card" style="animation-delay:0ms">'+renderApprovalsCard(snap)+'</div>',
      '<div class="card" style="animation-delay:60ms">'+renderHooksCard(snap)+'</div>',
      '<div class="card" style="animation-delay:120ms">'+renderMemoryCard(snap)+'</div>'
    ].join(''));

    setHtmlPreservingFocus($('anomalyAuditGrid'), [
      '<div class="card grid-wide" style="animation-delay:0ms">'+renderAnomalies(snap)+'</div>',
      '<div class="card grid-wide" style="animation-delay:60ms">'+renderAuditCard(snap)+'</div>'
    ].join(''));

    bindDelegated();

    $('lastUpdate').textContent = 'updated '+fmtRelative(snap.timestamp);
    const m = snap.auditMetrics || { total:0 };
    $('footMeta').textContent = 'q-ring v'+snap.version+' · snapshot '+fmtTime(snap.timestamp)+' · '+m.total+' audit events in last 24h';
  }

  /* --- Event delegation --- */

  let bound = false;
  function bindDelegated(){
    if(bound) return;
    bound = true;

    document.addEventListener('input', (e)=>{
      const t = e.target;
      if(t.id === 'secretsSearch'){
        state.secretsQuery = t.value;
        setHtmlPreservingFocus($('secretsSection'), renderSecretsSection());
      } else if(t.id === 'auditSearch'){
        state.auditFilter.text = t.value;
        rerenderAudit();
      }
    });

    document.addEventListener('click', (e)=>{
      const t = e.target.closest('[data-quick],[data-act],[data-src],th[data-sort],#auditClear');
      if(!t) return;
      if(t.matches('[data-quick]')){
        state.secretsQuery = t.getAttribute('data-quick');
        setHtmlPreservingFocus($('secretsSection'), renderSecretsSection());
      } else if(t.matches('[data-act]')){
        const a = t.getAttribute('data-act');
        state.auditFilter.action = state.auditFilter.action === a ? '' : a;
        rerenderAudit();
      } else if(t.matches('[data-src]')){
        const src = t.getAttribute('data-src');
        state.auditFilter.source = state.auditFilter.source === src ? '' : src;
        rerenderAudit();
      } else if(t.matches('th[data-sort]')){
        const col = t.getAttribute('data-sort');
        if(state.secretsSort.col === col){
          state.secretsSort.dir = state.secretsSort.dir === 'asc' ? 'desc' : 'asc';
        } else {
          state.secretsSort = { col, dir: col==='key' ? 'asc' : 'desc' };
        }
        setHtmlPreservingFocus($('secretsSection'), renderSecretsSection());
      } else if(t.id === 'auditClear'){
        state.auditFilter = { action:'', source:'', text:'' };
        rerenderAudit();
      }
    });
  }

  function rerenderAudit(){
    if(!state.snapshot) return;
    setHtmlPreservingFocus($('anomalyAuditGrid'), [
      '<div class="card grid-wide">'+renderAnomalies(state.snapshot)+'</div>',
      '<div class="card grid-wide">'+renderAuditCard(state.snapshot)+'</div>'
    ].join(''));
  }

  /* --- Pause / refresh / shortcuts --- */

  $('pauseBtn').addEventListener('click', togglePause);
  $('refreshBtn').addEventListener('click', forceRefresh);
  document.addEventListener('keydown', (e)=>{
    if(e.target && (e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA')){
      if(e.key==='Escape'){ e.target.blur(); }
      return;
    }
    if(e.key==='/'){
      e.preventDefault();
      const f=$('secretsSearch'); if(f) f.focus();
    } else if(e.key==='p' || e.key==='P'){
      togglePause();
    } else if(e.key==='r' || e.key==='R'){
      forceRefresh();
    }
  });

  function togglePause(){
    state.paused = !state.paused;
    $('pauseLabel').textContent = state.paused ? 'Resume' : 'Pause';
    $('connDot').classList.toggle('paused', state.paused);
    $('connText').textContent = state.paused ? 'paused' : 'live';
  }

  function forceRefresh(){
    fetch('/api/status', {cache:'no-store'}).then(r=>r.json()).then(s=>render(s)).catch(()=>{});
  }

  /* --- SSE connection --- */

  const dot = $('connDot');
  const connText = $('connText');

  function connect(){
    const es=new EventSource('/events');
    es.onopen=()=>{
      dot.classList.remove('disconnected');
      if(!state.paused){
        dot.classList.remove('paused');
        connText.textContent='live';
      }
    };
    es.onmessage=(e)=>{
      if(state.paused) return;
      try{ render(JSON.parse(e.data)); }catch(err){ console.error('render error',err); }
    };
    es.onerror=()=>{
      dot.classList.add('disconnected');
      connText.textContent='reconnecting…';
    };
  }

  connect();

  // refresh the relative timestamp every 5s so it stays accurate while paused
  setInterval(()=>{
    if(state.snapshot){
      $('lastUpdate').textContent = 'updated '+fmtRelative(state.snapshot.timestamp);
    }
  }, 5000);
})();
</script>
</body>
</html>`;
}
