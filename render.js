/* ============================================================
   Smart Stadium Operations — Render Functions
   ============================================================ */

// ---- OVERVIEW PAGE ----
function renderOverviewStats() {
  const totalOccupancy = ZONES.reduce((s, z) => s + z.current, 0);
  const totalCapacity = ZONES.reduce((s, z) => s + z.threshold, 0);
  const pct = Math.round(totalOccupancy / totalCapacity * 100);
  const activeIncidents = SimState.incidents.filter(i => i.status === 'Active').length;
  const el = document.getElementById('overviewStats');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-card blue"><div class="stat-label">Venue Occupancy</div><div class="stat-value">${pct}%</div><div class="stat-change">${totalOccupancy.toLocaleString()} / ${totalCapacity.toLocaleString()}</div></div>
    <div class="stat-card green"><div class="stat-label">Active Zones</div><div class="stat-value">${ZONES.length}</div><div class="stat-change">All monitored</div></div>
    <div class="stat-card ${activeIncidents > 0 ? 'red' : 'green'}"><div class="stat-label">Active Incidents</div><div class="stat-value">${activeIncidents}</div><div class="stat-change">${activeIncidents > 0 ? 'Requires attention' : 'All clear'}</div></div>
    <div class="stat-card cyan"><div class="stat-label">Match Minute</div><div class="stat-value">${SimState.matchMinute}'</div><div class="stat-change">USA 2 - 1 Mexico</div></div>
    <div class="stat-card purple"><div class="stat-label">AI Queries Today</div><div class="stat-value">${247 + SimState.auditLog.length}</div><div class="stat-change">+12% from avg</div></div>
    <div class="stat-card amber"><div class="stat-label">Languages Active</div><div class="stat-value">18</div><div class="stat-change">of 32 supported</div></div>
  `;
}

function renderOverviewIncidents() {
  const el = document.getElementById('overviewIncidents');
  if (!el) return;
  const active = SimState.incidents.filter(i => i.status === 'Active').slice(0, 5);
  if (active.length === 0) { el.innerHTML = '<div style="color:var(--text-muted);font-size:0.82rem;padding:10px">✅ No active incidents</div>'; return; }
  el.innerHTML = active.map(i => `
    <div class="alert-item ${i.severity === 'critical' ? 'critical' : ''}">
      <span class="alert-time">${formatTimeShort(i.time)}</span>
      <span class="alert-text"><strong>${i.id}</strong> — ${i.title} <span style="color:var(--text-muted)">(${i.zone})</span></span>
    </div>
  `).join('');
}

function renderOverviewBriefing() {
  const el = document.getElementById('overviewBriefing');
  if (!el) return;
  const txt = BRIEFING_TEMPLATES[SimState.currentBriefingIdx % BRIEFING_TEMPLATES.length];
  el.innerHTML = `<div class="briefing-time">${formatTime(new Date())} — Auto-generated Briefing</div><div class="briefing-text">${txt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</div>`;
}

// ---- CROWD PAGE ----
function renderCrowdStats() {
  const warning = ZONES.filter(z => z.current / z.threshold >= 0.8).length;
  const critical = ZONES.filter(z => z.current / z.threshold >= 1.0).length;
  const el = document.getElementById('crowdStats');
  if (!el) return;
  document.getElementById('crowdBadge').textContent = warning + critical;
  el.innerHTML = `
    <div class="stat-card blue"><div class="stat-label">Zones Monitored</div><div class="stat-value">${ZONES.length}</div><div class="stat-change">Updated every 30s</div></div>
    <div class="stat-card amber"><div class="stat-label">Warning (≥80%)</div><div class="stat-value">${warning}</div><div class="stat-change">${warning > 0 ? '⚠️ Attention needed' : 'All clear'}</div></div>
    <div class="stat-card red"><div class="stat-label">Critical (100%+)</div><div class="stat-value">${critical}</div><div class="stat-change">${critical > 0 ? '🚨 Immediate action' : 'None'}</div></div>
    <div class="stat-card green"><div class="stat-label">Avg Occupancy</div><div class="stat-value">${Math.round(ZONES.reduce((s,z) => s + z.current/z.threshold, 0) / ZONES.length * 100)}%</div><div class="stat-change">Across all zones</div></div>
  `;
}

function renderZoneHeatmap() {
  const el = document.getElementById('zoneHeatmap');
  if (!el) return;
  el.innerHTML = ZONES.map(z => {
    const pct = Math.round(z.current / z.threshold * 100);
    let level = 'low';
    if (pct >= 100) level = 'critical';
    else if (pct >= 80) level = 'high';
    else if (pct >= 55) level = 'med';
    return `<div class="zone-cell level-${level}"><div class="zone-name">${z.name}</div><div class="zone-pct">${pct}%</div><div class="zone-count">${z.current.toLocaleString()} / ${z.threshold.toLocaleString()}</div></div>`;
  }).join('');
}

function renderCrowdAlerts() {
  const el = document.getElementById('crowdAlerts');
  if (!el) return;
  const alerts = [];
  ZONES.forEach(z => {
    const pct = z.current / z.threshold;
    if (pct >= 1.0) alerts.push({ text: `🚨 CRITICAL: ${z.name} at ${Math.round(pct*100)}% — immediate action required`, cls: 'critical', time: new Date() });
    else if (pct >= 0.8) alerts.push({ text: `⚠️ WARNING: ${z.name} at ${Math.round(pct*100)}% — approaching threshold`, cls: '', time: new Date() });
  });
  if (alerts.length === 0) { el.innerHTML = '<div style="color:var(--text-muted);font-size:0.82rem;padding:10px">✅ All zones within safe limits</div>'; return; }
  el.innerHTML = alerts.map(a => `<div class="alert-item ${a.cls}"><span class="alert-time">${formatTimeShort(a.time)}</span><span class="alert-text">${a.text}</span></div>`).join('');
}

// ---- ACCESSIBILITY PAGE ----
function renderA11yStats() {
  const op = INFRA_ITEMS.filter(i => i.status === 'Operational').length;
  const deg = INFRA_ITEMS.filter(i => i.status === 'Degraded').length;
  const oos = INFRA_ITEMS.filter(i => i.status === 'Out of Service').length;
  const el = document.getElementById('a11yStats');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-card green"><div class="stat-label">Operational</div><div class="stat-value">${op}</div><div class="stat-change">Fully functional</div></div>
    <div class="stat-card amber"><div class="stat-label">Degraded</div><div class="stat-value">${deg}</div><div class="stat-change">${deg > 0 ? 'Limited service' : 'None'}</div></div>
    <div class="stat-card red"><div class="stat-label">Out of Service</div><div class="stat-value">${oos}</div><div class="stat-change">${oos > 0 ? 'Rerouting active' : 'All clear'}</div></div>
    <div class="stat-card cyan"><div class="stat-label">Active Sessions</div><div class="stat-value">12</div><div class="stat-change">Accessibility users</div></div>
  `;
}

function renderInfraTable() {
  const el = document.getElementById('infraBody');
  if (!el) return;
  el.innerHTML = INFRA_ITEMS.map(i => {
    let cls = 'status-operational';
    if (i.status === 'Degraded') cls = 'status-degraded';
    if (i.status === 'Out of Service') cls = 'status-outofservice';
    return `<tr><td>${i.name}</td><td>${i.type}</td><td>${i.zone}</td><td><span class="status-badge ${cls}">${i.status}</span></td></tr>`;
  }).join('');
}

function renderA11yAlerts() {
  const el = document.getElementById('a11yAlerts');
  if (!el) return;
  const oos = INFRA_ITEMS.filter(i => i.status !== 'Operational');
  el.innerHTML = oos.map(i => `<div class="alert-item ${i.status === 'Out of Service' ? 'critical' : ''}"><span class="alert-time">Now</span><span class="alert-text">${i.status === 'Out of Service' ? '🚨' : '⚠️'} ${i.name} (${i.zone}) — ${i.status}. ${i.status === 'Out of Service' ? 'Auto-rerouting active for affected sessions.' : 'Operating at reduced capacity.'}</span></div>`).join('');
  if (oos.length === 0) el.innerHTML = '<div style="color:var(--text-muted);font-size:0.82rem;padding:10px">✅ All infrastructure operational</div>';
}

// ---- TRANSPORT PAGE ----
function renderTransportStats() {
  const el = document.getElementById('transportStats');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-card green"><div class="stat-label">Services On Time</div><div class="stat-value">${TRANSPORT_OPTIONS.filter(t=>t.status==='On Time').length}</div><div class="stat-change">Running normally</div></div>
    <div class="stat-card amber"><div class="stat-label">Delayed</div><div class="stat-value">${TRANSPORT_OPTIONS.filter(t=>t.status==='Delayed').length}</div><div class="stat-change">Minor delays</div></div>
    <div class="stat-card blue"><div class="stat-label">Options Available</div><div class="stat-value">${TRANSPORT_OPTIONS.length}</div><div class="stat-change">All modes</div></div>
    <div class="stat-card cyan"><div class="stat-label">Post-Match ETA</div><div class="stat-value">23 min</div><div class="stat-change">Recommended departure</div></div>
  `;
}

function renderTransportOptions() {
  const el = document.getElementById('transportOptions');
  if (!el) return;
  el.innerHTML = TRANSPORT_OPTIONS.map(t => `
    <div class="transport-option">
      <div class="transport-icon">${t.icon}</div>
      <div class="transport-info"><div class="transport-name">${t.name}</div><div class="transport-detail">${t.detail}</div></div>
      <div class="transport-status ${t.statusClass}">${t.status} · ${t.eta}</div>
    </div>
  `).join('');
}

function renderDepartureRecs() {
  const el = document.getElementById('departureRecs');
  if (!el) return;
  el.innerHTML = `
    <div class="briefing-card"><div class="briefing-time">🤖 AI Analysis — Updated ${formatTimeShort(new Date())}</div><div class="briefing-text">Based on current match status (67'), historical egress data, and real-time transit status:<br><br><strong>Recommended:</strong> Depart 5 minutes before final whistle via <strong>NJ Transit Rail</strong> to avoid peak surge. Expected crowd density at Meadowlands Station peaks at +8 minutes post-match.<br><br><strong>Alternative:</strong> If staying post-match, depart at +15 minutes via <strong>FIFA Shuttle</strong> (frequency doubled for post-match). Ride-share surge expected to normalize at +25 minutes.</div></div>
  `;
}

// ---- SUSTAINABILITY PAGE ----
function renderSustainStats() {
  const el = document.getElementById('sustainStats');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-card green"><div class="stat-label">Energy Usage</div><div class="stat-value">2,847</div><div class="stat-change">kWh · +4% baseline</div></div>
    <div class="stat-card amber"><div class="stat-label">Waste Generated</div><div class="stat-value">1.2T</div><div class="stat-change">68% recycled</div></div>
    <div class="stat-card blue"><div class="stat-label">Carbon Footprint</div><div class="stat-value">4.8</div><div class="stat-change">tonnes CO₂e today</div></div>
    <div class="stat-card cyan"><div class="stat-label">Water Saved</div><div class="stat-value">3,200L</div><div class="stat-change">Rainwater recycling</div></div>
    <div class="stat-card purple"><div class="stat-label">Solar Output</div><div class="stat-value">420</div><div class="stat-change">kWh generated</div></div>
    <div class="stat-card green"><div class="stat-label">IoT Sensors</div><div class="stat-value">148</div><div class="stat-change">All reporting</div></div>
  `;
}

function renderEcoRecs() {
  const el = document.getElementById('ecoRecommendations');
  if (!el) return;
  el.innerHTML = ECO_RECOMMENDATIONS.map((r, i) => `
    <div class="rec-card"><div class="rec-rank">Recommendation #${i+1} · Priority: ${r.priority}</div><div class="rec-text">${r.text}</div><div class="rec-confidence">Estimated saving: <strong>${r.saving}</strong></div></div>
  `).join('');
}

function renderSustainAlerts() {
  const el = document.getElementById('sustainAlerts');
  if (!el) return;
  el.innerHTML = `
    <div class="alert-item"><span class="alert-time">${formatTimeShort(new Date())}</span><span class="alert-text">⚠️ Food Court waste bin #7 at 87% capacity — collection dispatched</span></div>
    <div class="alert-item info"><span class="alert-time">${formatTimeShort(new Date(Date.now()-300000))}</span><span class="alert-text">ℹ️ HVAC energy spike resolved — Concourse 2 back to baseline</span></div>
    <div class="alert-item success"><span class="alert-time">${formatTimeShort(new Date(Date.now()-600000))}</span><span class="alert-text">✅ Daily carbon report generated and delivered to organizers</span></div>
  `;
}

// ---- LANGUAGE PAGE ----
function renderLangStats() {
  const el = document.getElementById('langStats');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-card cyan"><div class="stat-label">Languages Supported</div><div class="stat-value">32</div><div class="stat-change">All FIFA tournament languages</div></div>
    <div class="stat-card blue"><div class="stat-label">Active Translations</div><div class="stat-value">142</div><div class="stat-change">This match window</div></div>
    <div class="stat-card green"><div class="stat-label">Avg Response Time</div><div class="stat-value">2.3s</div><div class="stat-change">Under 5s SLA ✓</div></div>
    <div class="stat-card purple"><div class="stat-label">Staff Bridges</div><div class="stat-value">8</div><div class="stat-change">Live conversations</div></div>
  `;
}

function renderLangGrid() {
  const el = document.getElementById('langGrid');
  if (!el) return;
  el.innerHTML = LANGUAGES.map((l, i) => `<div class="lang-chip ${i === 0 ? 'active' : ''}" onclick="this.parentElement.querySelectorAll('.lang-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active')">${l}</div>`).join('');
}

// ---- OPS DASHBOARD PAGE ----
function renderOpsStats() {
  const el = document.getElementById('opsStats');
  if (!el) return;
  const active = SimState.incidents.filter(i => i.status === 'Active').length;
  el.innerHTML = `
    <div class="stat-card blue"><div class="stat-label">Data Sources</div><div class="stat-value">7</div><div class="stat-change">All connected ✓</div></div>
    <div class="stat-card ${active > 0 ? 'red' : 'green'}"><div class="stat-label">Open Incidents</div><div class="stat-value">${active}</div><div class="stat-change">${active > 0 ? 'Requires response' : 'All resolved'}</div></div>
    <div class="stat-card cyan"><div class="stat-label">AI Briefings</div><div class="stat-value">${SimState.currentBriefingIdx + 1}</div><div class="stat-change">Every 30 minutes</div></div>
    <div class="stat-card purple"><div class="stat-label">Audit Entries</div><div class="stat-value">${SimState.auditLog.length}</div><div class="stat-change">90-day retention</div></div>
  `;
}

function renderOpsBriefings() {
  const el = document.getElementById('opsBriefings');
  if (!el) return;
  el.innerHTML = BRIEFING_TEMPLATES.map((t, i) => `<div class="briefing-card"><div class="briefing-time">Briefing #${i+1} — ${formatTime(new Date(Date.now() - (BRIEFING_TEMPLATES.length - 1 - i) * 1800000))}</div><div class="briefing-text">${t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</div></div>`).join('');
}

function renderOpsIncidents() {
  const el = document.getElementById('opsIncidents');
  if (!el) return;
  el.innerHTML = SimState.incidents.map(i => `
    <div class="incident-card">
      <div class="incident-header"><span class="incident-id">${i.id}</span><span class="incident-severity severity-${i.severity}">${i.severity}</span></div>
      <div class="incident-title">${i.title}</div>
      <div class="incident-meta">Zone: ${i.zone} · Domain: ${i.domain} · Status: ${i.status} · ${formatTimeShort(i.time)}</div>
    </div>
  `).join('');
}

function renderAuditLog() {
  const el = document.getElementById('auditBody');
  if (!el) return;
  el.innerHTML = SimState.auditLog.map(a => `<tr><td>${formatTime(a.time)}</td><td>${a.user}</td><td>${a.action}</td><td>${a.zone}</td><td>${a.details}</td></tr>`).join('');
}

// ---- DECISION ENGINE PAGE ----
function renderDecisionStats() {
  const el = document.getElementById('decisionStats');
  if (!el) return;
  const active = SimState.incidents.filter(i => i.status === 'Active');
  document.getElementById('decisionBadge').textContent = active.length;
  el.innerHTML = `
    <div class="stat-card ${active.length > 0 ? 'red' : 'green'}"><div class="stat-label">Active Incidents</div><div class="stat-value">${active.length}</div><div class="stat-change">${active.length > 0 ? '🚨 Response needed' : 'All clear'}</div></div>
    <div class="stat-card blue"><div class="stat-label">Recommendations Generated</div><div class="stat-value">${active.length * 5}</div><div class="stat-change">Ranked by priority</div></div>
    <div class="stat-card cyan"><div class="stat-label">Avg Confidence</div><div class="stat-value">0.82</div><div class="stat-change">Above 0.7 threshold</div></div>
    <div class="stat-card amber"><div class="stat-label">Human Review Needed</div><div class="stat-value">${active.reduce((s,i)=>s+i.confidences.filter(c=>c<0.7).length,0)}</div><div class="stat-change">Confidence < 0.7</div></div>
  `;
}

function renderDecisionIncidents() {
  const el = document.getElementById('decisionIncidents');
  if (!el) return;
  const active = SimState.incidents.filter(i => i.status === 'Active');
  if (active.length === 0) { el.innerHTML = '<div style="color:var(--text-muted);font-size:0.82rem;padding:10px">✅ No active incidents requiring decisions</div>'; return; }
  el.innerHTML = active.map(i => `
    <div class="incident-card">
      <div class="incident-header"><span class="incident-id">${i.id}</span><span class="incident-severity severity-${i.severity}">${i.severity}</span></div>
      <div class="incident-title">${i.title}</div>
      <div class="incident-meta">Zone: ${i.zone} · Domain: ${i.domain} · ${formatTimeShort(i.time)}</div>
      <div style="margin-top:8px"><button class="btn btn-sm btn-outline" onclick="window.StadiumApp.resolveIncident('${i.id}')">✓ Mark Resolved</button></div>
    </div>
  `).join('');
}

function renderDecisionRecs() {
  const el = document.getElementById('decisionRecs');
  if (!el) return;
  const active = SimState.incidents.filter(i => i.status === 'Active');
  if (active.length === 0) { el.innerHTML = '<div style="color:var(--text-muted);font-size:0.82rem;padding:10px">No active recommendations</div>'; return; }
  let html = '';
  active.forEach(inc => {
    html += `<div style="margin-bottom:12px;font-size:0.75rem;font-weight:600;color:var(--text-muted)">${inc.id} — ${inc.title}</div>`;
    inc.recommendations.forEach((r, i) => {
      const conf = inc.confidences[i];
      const isAmber = conf < 0.7;
      const confPct = Math.round(conf * 100);
      const barColor = conf >= 0.8 ? 'var(--accent-green)' : conf >= 0.7 ? 'var(--accent-blue)' : 'var(--accent-amber)';
      html += `<div class="rec-card ${isAmber ? 'amber-flag' : ''}">
        <div class="rec-rank">Action #${i+1}</div>
        <div class="rec-text">${r}</div>
        <div class="rec-confidence">Confidence: ${conf.toFixed(2)} <span class="conf-bar"><span class="conf-fill" style="width:${confPct}%;background:${barColor}"></span></span></div>
        ${isAmber ? '<div class="human-review-label">⚠ Requires Human Review</div>' : ''}
      </div>`;
    });
  });
  el.innerHTML = html;
}

// ---- NAV PAGE HELPERS ----
function renderPOIList() {
  const el = document.getElementById('navPOIList');
  if (!el) return;
  el.innerHTML = POIS.map(p => `
    <div class="transport-option" style="cursor:pointer" onclick="document.getElementById('navSearchInput').value='${p.name}';window.StadiumApp.generateRoute()">
      <div class="transport-icon">${p.icon}</div>
      <div class="transport-info"><div class="transport-name">${p.name}</div><div class="transport-detail">${p.zone} · ${p.dist}</div></div>
    </div>
  `).join('');
}
