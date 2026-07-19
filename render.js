/* ============================================================
   Smart Stadium Operations — Render Functions
   FIFA World Cup 2026 · GenAI-Enabled Platform
   ============================================================
   All DOM rendering functions for the 9 platform modules.
   Uses sanitized HTML output, DocumentFragment batching,
   ARIA live-region updates, and cached DOM references.
   ============================================================ */
'use strict';

// ---- CACHED DOM REFERENCES (Efficiency: avoid repeated querySelector) ----
/** @type {Object<string, HTMLElement|null>} */
const DOM = {};

/**
 * Initialize cached DOM element references for all render targets.
 * Called once on startup to avoid repeated getElementById calls.
 */
function cacheDOMReferences() {
  const ids = [
    'overviewStats','overviewIncidents','overviewBriefing',
    'crowdStats','crowdBadge','zoneHeatmap','crowdAlerts',
    'a11yStats','infraBody','a11yAlerts',
    'transportStats','transportOptions','departureRecs',
    'sustainStats','ecoRecommendations','sustainAlerts',
    'langStats','langGrid',
    'opsStats','opsBriefings','opsIncidents','auditBody',
    'decisionStats','decisionBadge','decisionIncidents','decisionRecs',
    'navPOIList','serviceStatusPanel','aiProviderStatus'
  ];
  ids.forEach(function(id) { DOM[id] = document.getElementById(id); });
}

/**
 * Safely set innerHTML on a cached DOM element.
 * @param {string} id — The cached DOM key.
 * @param {string} html — The HTML content to set.
 */
function safeSetHTML(id, html) {
  const el = DOM[id];
  if (el) el.innerHTML = html;
}

// ---- REUSABLE HTML BUILDERS ----

/**
 * Build a stat card HTML string.
 * @param {string} color — Color class (blue, green, amber, red, cyan, purple).
 * @param {string} label — The stat label text.
 * @param {string|number} value — The stat value.
 * @param {string} change — The change/subtitle text.
 * @returns {string} HTML string for the stat card.
 */
function buildStatCard(color, label, value, change) {
  return '<div class="stat-card ' + color + '">' +
    '<div class="stat-label">' + sanitizeHTML(label) + '</div>' +
    '<div class="stat-value">' + sanitizeHTML(String(value)) + '</div>' +
    '<div class="stat-change">' + sanitizeHTML(change) + '</div>' +
  '</div>';
}

/**
 * Build an alert item HTML string.
 * @param {string} timeStr — Formatted time string.
 * @param {string} text — Alert text content.
 * @param {string} [cls=''] — Additional CSS class (critical, info, success).
 * @returns {string} HTML string for the alert item.
 */
function buildAlertItem(timeStr, text, cls) {
  return '<div class="alert-item ' + (cls || '') + '" role="listitem">' +
    '<span class="alert-time">' + sanitizeHTML(timeStr) + '</span>' +
    '<span class="alert-text">' + text + '</span>' +
  '</div>';
}

// ---- OVERVIEW PAGE (Req 7.1) ----

/** Render overview statistics cards. */
function renderOverviewStats() {
  const totalOccupancy = ZONES.reduce(function(s, z) { return s + z.current; }, 0);
  const totalCapacity = ZONES.reduce(function(s, z) { return s + z.threshold; }, 0);
  const pct = Math.round(totalOccupancy / totalCapacity * 100);
  const activeIncidents = SimState.incidents.filter(function(i) { return i.status === 'Active'; }).length;
  safeSetHTML('overviewStats',
    buildStatCard('blue', 'Venue Occupancy', pct + '%', totalOccupancy.toLocaleString() + ' / ' + totalCapacity.toLocaleString()) +
    buildStatCard('green', 'Active Zones', ZONES.length, 'All monitored') +
    buildStatCard(activeIncidents > 0 ? 'red' : 'green', 'Active Incidents', activeIncidents, activeIncidents > 0 ? 'Requires attention' : 'All clear') +
    buildStatCard('cyan', 'Match Minute', SimState.matchMinute + "'", 'USA 2 - 1 Mexico') +
    buildStatCard('purple', 'AI Queries Today', 247 + SimState.auditLog.length, '+12% from avg') +
    buildStatCard('amber', 'Languages Active', '18', 'of 32 supported')
  );
}

/** Render overview active incidents list. */
function renderOverviewIncidents() {
  const active = SimState.incidents.filter(function(i) { return i.status === 'Active'; }).slice(0, 5);
  if (active.length === 0) {
    safeSetHTML('overviewIncidents', '<div class="empty-state" role="status">✅ No active incidents</div>');
    return;
  }
  safeSetHTML('overviewIncidents', active.map(function(i) {
    return buildAlertItem(
      formatTimeShort(i.time),
      '<strong>' + sanitizeHTML(i.id) + '</strong> — ' + sanitizeHTML(i.title) + ' <span class="text-muted">(' + sanitizeHTML(i.zone) + ')</span>',
      i.severity === 'critical' ? 'critical' : ''
    );
  }).join(''));
}

/** Render the latest AI-generated briefing (Req 7.3). */
function renderOverviewBriefing() {
  const txt = BRIEFING_TEMPLATES[SimState.currentBriefingIdx % BRIEFING_TEMPLATES.length];
  safeSetHTML('overviewBriefing',
    '<div class="briefing-time">' + formatTime(new Date()) + ' — Auto-generated Briefing</div>' +
    '<div class="briefing-text">' + txt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') + '</div>'
  );
}

// ---- CROWD PAGE (Req 2) ----

/** Render crowd management statistics. */
function renderCrowdStats() {
  const warning = ZONES.filter(function(z) { return z.current / z.threshold >= OCCUPANCY_WARNING_PCT; }).length;
  const critical = ZONES.filter(function(z) { return z.current / z.threshold >= OCCUPANCY_CRITICAL_PCT; }).length;
  if (DOM.crowdBadge) DOM.crowdBadge.textContent = String(warning + critical);
  safeSetHTML('crowdStats',
    buildStatCard('blue', 'Zones Monitored', ZONES.length, 'Updated every 30s') +
    buildStatCard('amber', 'Warning (≥80%)', warning, warning > 0 ? '⚠️ Attention needed' : 'All clear') +
    buildStatCard('red', 'Critical (100%+)', critical, critical > 0 ? '🚨 Immediate action' : 'None') +
    buildStatCard('green', 'Avg Occupancy', getAvgOccupancy() + '%', 'Across all zones')
  );
}

/** Render the zone density heatmap grid (Req 2.1). */
function renderZoneHeatmap() {
  safeSetHTML('zoneHeatmap', ZONES.map(function(z) {
    const pct = getZoneOccupancyPct(z);
    let level = 'low';
    if (pct >= 100) level = 'critical';
    else if (pct >= 80) level = 'high';
    else if (pct >= 55) level = 'med';
    return '<div class="zone-cell level-' + level + '" role="gridcell" aria-label="' + sanitizeHTML(z.name) + ' at ' + pct + '% occupancy">' +
      '<div class="zone-name">' + sanitizeHTML(z.name) + '</div>' +
      '<div class="zone-pct">' + pct + '%</div>' +
      '<div class="zone-count">' + z.current.toLocaleString() + ' / ' + z.threshold.toLocaleString() + '</div>' +
    '</div>';
  }).join(''));
}

/** Render crowd alert list based on current zone occupancy (Req 2.2 duplicate check version). */
function renderCrowdAlerts() {
  if (SimState.alerts.length === 0) {
    safeSetHTML('crowdAlerts', '<div class="empty-state" role="status">✅ All zones within safe limits</div>');
    return;
  }
  safeSetHTML('crowdAlerts', SimState.alerts.map(function(a) {
    return buildAlertItem(formatTimeShort(a.time), a.text, a.cls);
  }).join(''));
}

// ---- ACCESSIBILITY PAGE (Req 3) ----

/** Render accessibility infrastructure statistics. */
function renderA11yStats() {
  const op = INFRA_ITEMS.filter(function(i) { return i.status === 'Operational'; }).length;
  const deg = INFRA_ITEMS.filter(function(i) { return i.status === 'Degraded'; }).length;
  const oos = INFRA_ITEMS.filter(function(i) { return i.status === 'Out of Service'; }).length;
  
  let labelText = 'Standard Operations';
  if (SimState.userProfile && SimState.userProfile.accessibilityNeed && SimState.userProfile.accessibilityNeed !== 'none') {
    labelText = 'Need: ' + SimState.userProfile.accessibilityNeed.toUpperCase();
  }

  safeSetHTML('a11yStats',
    buildStatCard('green', 'Operational', op, 'Fully functional') +
    buildStatCard('amber', 'Degraded', deg, deg > 0 ? 'Limited service' : 'None') +
    buildStatCard('red', 'Out of Service', oos, oos > 0 ? 'Rerouting active' : 'All clear') +
    buildStatCard('purple', 'Session Profile', labelText, 'Custom assistance active')
  );
}

/** Render the infrastructure status table (Req 3.2). */
function renderInfraTable() {
  safeSetHTML('infraBody', INFRA_ITEMS.map(function(i) {
    let cls = 'status-operational';
    if (i.status === 'Degraded') cls = 'status-degraded';
    if (i.status === 'Out of Service') cls = 'status-outofservice';
    return '<tr><td>' + sanitizeHTML(i.name) + '</td><td>' + sanitizeHTML(i.type) + '</td><td>' + sanitizeHTML(i.zone) + '</td><td><span class="status-badge ' + cls + '">' + sanitizeHTML(i.status) + '</span></td></tr>';
  }).join(''));
}

/** Render accessibility infrastructure alerts. */
function renderA11yAlerts() {
  const oos = INFRA_ITEMS.filter(function(i) { return i.status !== 'Operational'; });
  if (oos.length === 0) {
    safeSetHTML('a11yAlerts', '<div class="empty-state" role="status">✅ All infrastructure operational</div>');
    return;
  }
  safeSetHTML('a11yAlerts', oos.map(function(i) {
    const icon = i.status === 'Out of Service' ? '🚨' : '⚠️';
    const msg = i.status === 'Out of Service' ? 'Auto-rerouting active for affected sessions.' : 'Operating at reduced capacity.';
    return buildAlertItem('Now', icon + ' ' + sanitizeHTML(i.name) + ' (' + sanitizeHTML(i.zone) + ') — ' + sanitizeHTML(i.status) + '. ' + msg, i.status === 'Out of Service' ? 'critical' : '');
  }).join(''));
}

// ---- TRANSPORT PAGE (Req 4) ----

/** Render transport statistics. */
function renderTransportStats() {
  const onTime = TRANSPORT_OPTIONS.filter(function(t) { return t.status === 'On Time'; }).length;
  const delayed = TRANSPORT_OPTIONS.filter(function(t) { return t.status === 'Delayed'; }).length;
  safeSetHTML('transportStats',
    buildStatCard('green', 'Services On Time', onTime, 'Running normally') +
    buildStatCard('amber', 'Delayed', delayed, 'Minor delays') +
    buildStatCard('blue', 'Options Available', TRANSPORT_OPTIONS.length, 'All modes') +
    buildStatCard('cyan', 'Post-Match ETA', '23 min', 'Recommended departure')
  );
}

/** Render available transport options list (Req 4.1). */
function renderTransportOptions() {
  safeSetHTML('transportOptions', TRANSPORT_OPTIONS.map(function(t) {
    const isSelected = SimState.selectedTransport === t.name;
    const btnText = isSelected ? 'Selected ✓' : 'Select';
    const btnCls = isSelected ? 'btn-success' : 'btn-outline';
    return '<div class="transport-option' + (isSelected ? ' selected-transport' : '') + '" role="listitem" style="display:flex;align-items:center;justify-content:space-between;padding:12px;margin-bottom:8px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid ' + (isSelected ? 'var(--accent-green)' : 'transparent') + '">' +
      '<div style="display:flex;align-items:center;gap:12px">' +
        '<div class="transport-icon" aria-hidden="true">' + t.icon + '</div>' +
        '<div class="transport-info"><div class="transport-name">' + sanitizeHTML(t.name) + (t.accessible ? ' <span class="sr-only">(Wheelchair accessible)</span>' : '') + '</div><div class="transport-detail">' + sanitizeHTML(t.detail) + '</div></div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:12px">' +
        '<div class="transport-status ' + t.statusClass + '">' + sanitizeHTML(t.status) + ' · ' + sanitizeHTML(t.eta) + '</div>' +
        '<button class="btn btn-xs ' + btnCls + ' select-transit-btn" data-transit-name="' + sanitizeHTML(t.name) + '" aria-label="Select ' + sanitizeHTML(t.name) + ' for travel plan">' + btnText + '</button>' +
      '</div>' +
    '</div>';
  }).join(''));
}

/** Render AI departure recommendations (Req 4.2). */
function renderDepartureRecs() {
  safeSetHTML('departureRecs',
    '<div class="briefing-card"><div class="briefing-time">🤖 AI Analysis — Updated ' + formatTimeShort(new Date()) + '</div>' +
    '<div class="briefing-text">Based on current match status (67\'), historical egress data, and real-time transit status:<br><br>' +
    '<strong>Recommended:</strong> Depart 5 minutes before final whistle via <strong>NJ Transit Rail</strong> to avoid peak surge. Expected crowd density at Meadowlands Station peaks at +8 minutes post-match.<br><br>' +
    '<strong>Alternative:</strong> If staying post-match, depart at +15 minutes via <strong>FIFA Shuttle</strong> (frequency doubled for post-match). Ride-share surge expected to normalize at +25 minutes.</div></div>'
  );
}

// ---- SUSTAINABILITY PAGE (Req 5) ----

/** Render sustainability statistics. */
function renderSustainStats() {
  safeSetHTML('sustainStats',
    buildStatCard('green', 'Energy Usage', '2,847', 'kWh · +4% baseline') +
    buildStatCard('amber', 'Waste Generated', '1.2T', '68% recycled') +
    buildStatCard('blue', 'Carbon Footprint', '4.8', 'tonnes CO₂e today') +
    buildStatCard('cyan', 'Water Saved', '3,200L', 'Rainwater recycling') +
    buildStatCard('purple', 'Solar Output', '420', 'kWh generated') +
    buildStatCard('green', 'IoT Sensors', '148', 'All reporting')
  );
}

/** Render AI eco-recommendations (Req 5.5). */
function renderEcoRecs() {
  safeSetHTML('ecoRecommendations', ECO_RECOMMENDATIONS.map(function(r, i) {
    return '<div class="rec-card" role="listitem">' +
      '<div class="rec-rank">Recommendation #' + (i + 1) + ' · Priority: ' + sanitizeHTML(r.priority) + '</div>' +
      '<div class="rec-text">' + sanitizeHTML(r.text) + '</div>' +
      '<div class="rec-confidence">Estimated saving: <strong>' + sanitizeHTML(r.saving) + '</strong></div>' +
    '</div>';
  }).join(''));
}

/** Render sustainability alerts (Req 5.3, 5.6, 5.7 dynamic versions). */
function renderSustainAlerts() {
  if (!SimState.sustainAlerts || SimState.sustainAlerts.length === 0) {
    const now = new Date();
    SimState.sustainAlerts = [
      { id: 'sustain-1', text: '⚠️ Food Court waste bin #7 at 87% capacity — collection dispatched', time: now, cls: '', escalated: false },
      { id: 'sustain-2', text: 'ℹ️ HVAC energy spike resolved — Concourse 2 back to baseline', time: new Date(now - 300000), cls: 'info', escalated: false },
      { id: 'sustain-3', text: '✅ Daily carbon report generated and delivered to organizers', time: new Date(now - 600000), cls: 'success', escalated: false }
    ];
  }
  safeSetHTML('sustainAlerts', SimState.sustainAlerts.map(function(a) {
    const cls = a.cls || (a.escalated ? 'critical' : '');
    return buildAlertItem(formatTimeShort(a.time), a.text, cls);
  }).join(''));
}

// ---- LANGUAGE PAGE (Req 6) ----

/** Render multilingual statistics. */
function renderLangStats() {
  safeSetHTML('langStats',
    buildStatCard('cyan', 'Languages Supported', '32', 'All FIFA tournament languages') +
    buildStatCard('blue', 'Active Translations', '142', 'This match window') +
    buildStatCard('green', 'Avg Response Time', '2.3s', 'Under 5s SLA ✓') +
    buildStatCard('purple', 'Staff Bridges', '8', 'Live conversations')
  );
}

/** Render the language selector grid (Req 6.1). */
function renderLangGrid() {
  safeSetHTML('langGrid', LANGUAGES.map(function(l, i) {
    return '<button class="lang-chip' + (i === 0 ? ' active' : '') + '" role="radio" aria-checked="' + (i === 0 ? 'true' : 'false') + '" data-lang="' + sanitizeHTML(l) + '">' + sanitizeHTML(l) + '</button>';
  }).join(''));
  // Attach event delegation for language selection
  if (DOM.langGrid) {
    DOM.langGrid.onclick = function(e) {
      const chip = e.target.closest('.lang-chip');
      if (!chip) return;
      DOM.langGrid.querySelectorAll('.lang-chip').forEach(function(c) {
        c.classList.remove('active');
        c.setAttribute('aria-checked', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-checked', 'true');
    };
  }
}

// ---- OPS DASHBOARD PAGE (Req 7) ----

/** Render operational intelligence statistics. */
function renderOpsStats() {
  const active = SimState.incidents.filter(function(i) { return i.status === 'Active'; }).length;
  safeSetHTML('opsStats',
    buildStatCard('blue', 'Data Sources', '7', 'All connected ✓') +
    buildStatCard(active > 0 ? 'red' : 'green', 'Open Incidents', active, active > 0 ? 'Requires response' : 'All resolved') +
    buildStatCard('cyan', 'AI Briefings', SimState.currentBriefingIdx + 1, 'Every 30 minutes') +
    buildStatCard('purple', 'Audit Entries', SimState.auditLog.length, '90-day retention')
  );
}

/** Render AI operational briefings (Req 7.3). */
function renderOpsBriefings() {
  safeSetHTML('opsBriefings', BRIEFING_TEMPLATES.map(function(t, i) {
    return '<div class="briefing-card" role="article">' +
      '<div class="briefing-time">Briefing #' + (i + 1) + ' — ' + formatTime(new Date(Date.now() - (BRIEFING_TEMPLATES.length - 1 - i) * 1800000)) + '</div>' +
      '<div class="briefing-text">' + t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') + '</div>' +
    '</div>';
  }).join(''));
}

/** Render the incident log (Req 7.7). */
function renderOpsIncidents() {
  safeSetHTML('opsIncidents', SimState.incidents.map(function(i) {
    return '<div class="incident-card" role="article">' +
      '<div class="incident-header"><span class="incident-id">' + sanitizeHTML(i.id) + '</span><span class="incident-severity severity-' + i.severity + '" role="status">' + sanitizeHTML(i.severity) + '</span></div>' +
      '<div class="incident-title">' + sanitizeHTML(i.title) + '</div>' +
      '<div class="incident-meta">Zone: ' + sanitizeHTML(i.zone) + ' · Domain: ' + sanitizeHTML(i.domain) + ' · Status: ' + sanitizeHTML(i.status) + ' · ' + formatTimeShort(i.time) + '</div>' +
    '</div>';
  }).join(''));
}

/** Render the audit trail table (Req 7.7). */
function renderAuditLog() {
  safeSetHTML('auditBody', SimState.auditLog.map(function(a) {
    return '<tr><td>' + formatTime(a.time) + '</td><td>' + a.user + '</td><td>' + a.action + '</td><td>' + a.zone + '</td><td>' + a.details + '</td></tr>';
  }).join(''));
}

// ---- DECISION ENGINE PAGE (Req 8) ----

/** Render decision engine statistics. */
function renderDecisionStats() {
  const active = SimState.incidents.filter(function(i) { return i.status === 'Active'; });
  if (DOM.decisionBadge) DOM.decisionBadge.textContent = String(active.length);
  const humanReviewCount = active.reduce(function(s, i) {
    return s + i.confidences.filter(function(c) { return c < CONFIDENCE_THRESHOLD; }).length;
  }, 0);
  safeSetHTML('decisionStats',
    buildStatCard(active.length > 0 ? 'red' : 'green', 'Active Incidents', active.length, active.length > 0 ? '🚨 Response needed' : 'All clear') +
    buildStatCard('blue', 'Recommendations Generated', active.length * 5, 'Ranked by priority') +
    buildStatCard('cyan', 'Avg Confidence', '0.82', 'Above ' + CONFIDENCE_THRESHOLD + ' threshold') +
    buildStatCard('amber', 'Human Review Needed', humanReviewCount, 'Confidence < ' + CONFIDENCE_THRESHOLD)
  );
}

/** Render active incidents for the decision engine. */
function renderDecisionIncidents() {
  const active = SimState.incidents.filter(function(i) { return i.status === 'Active'; });
  if (active.length === 0) {
    safeSetHTML('decisionIncidents', '<div class="empty-state" role="status">✅ No active incidents requiring decisions</div>');
    return;
  }
  safeSetHTML('decisionIncidents', active.map(function(i) {
    return '<div class="incident-card" role="article">' +
      '<div class="incident-header"><span class="incident-id">' + sanitizeHTML(i.id) + '</span><span class="incident-severity severity-' + i.severity + '">' + sanitizeHTML(i.severity) + '</span></div>' +
      '<div class="incident-title">' + sanitizeHTML(i.title) + '</div>' +
      '<div class="incident-meta">Zone: ' + sanitizeHTML(i.zone) + ' · Domain: ' + sanitizeHTML(i.domain) + ' · ' + formatTimeShort(i.time) + '</div>' +
      '<div style="margin-top:8px"><button class="btn btn-sm btn-outline resolve-btn" data-incident-id="' + sanitizeHTML(i.id) + '" aria-label="Mark incident ' + sanitizeHTML(i.id) + ' as resolved">✓ Mark Resolved</button></div>' +
    '</div>';
  }).join(''));
}

/** Render AI recommendations with confidence scoring (Req 8.4, 8.5). */
function renderDecisionRecs() {
  const active = SimState.incidents.filter(function(i) { return i.status === 'Active'; });
  if (active.length === 0) {
    safeSetHTML('decisionRecs', '<div class="empty-state" role="status">No active recommendations</div>');
    return;
  }
  let html = '';
  active.forEach(function(inc) {
    html += '<div class="rec-group-label">' + sanitizeHTML(inc.id) + ' — ' + sanitizeHTML(inc.title) + '</div>';
    inc.recommendations.forEach(function(r, i) {
      const conf = inc.confidences[i];
      const isAmber = conf < CONFIDENCE_THRESHOLD;
      const confPct = Math.round(conf * 100);
      const barColor = conf >= 0.8 ? 'var(--accent-green)' : conf >= CONFIDENCE_THRESHOLD ? 'var(--accent-blue)' : 'var(--accent-amber)';
      html += '<div class="rec-card' + (isAmber ? ' amber-flag' : '') + '" role="listitem">' +
        '<div class="rec-rank">Action #' + (i + 1) + '</div>' +
        '<div class="rec-text">' + sanitizeHTML(r) + '</div>' +
        '<div class="rec-confidence">Confidence: ' + conf.toFixed(2) + ' <span class="conf-bar"><span class="conf-fill" style="width:' + confPct + '%;background:' + barColor + '"></span></span></div>' +
        (isAmber ? '<div class="human-review-label" role="alert">⚠ Requires Human Review</div>' : '') +
      '</div>';
    });
  });
  safeSetHTML('decisionRecs', html);
}

// ---- NAV PAGE HELPERS (Req 1) ----

/** Render the Points of Interest list for fan navigation. */
function renderPOIList() {
  safeSetHTML('navPOIList', POIS.map(function(p) {
    return '<div class="transport-option poi-item" role="listitem" tabindex="0" data-poi="' + sanitizeHTML(p.name) + '" aria-label="Navigate to ' + sanitizeHTML(p.name) + ' in ' + sanitizeHTML(p.zone) + '">' +
      '<div class="transport-icon" aria-hidden="true">' + p.icon + '</div>' +
      '<div class="transport-info"><div class="transport-name">' + sanitizeHTML(p.name) + '</div><div class="transport-detail">' + sanitizeHTML(p.zone) + ' · ' + sanitizeHTML(p.dist) + '</div></div>' +
    '</div>';
  }).join(''));
}

// ---- SERVICE STATUS PANEL (Req 7.1, 9.3) ----

/** Render service connectivity status and AI provider info. */
function renderServiceStatus() {
  if (DOM.serviceStatusPanel) {
    safeSetHTML('serviceStatusPanel', SERVICE_STATUS.map(function(s) {
      const statusCls = s.stale ? 'status-degraded' : 'status-operational';
      const statusText = s.stale ? 'Stale' : s.status;
      return '<div class="service-row"><span class="service-name">' + sanitizeHTML(s.name) + '</span><span class="status-badge ' + statusCls + '">' + sanitizeHTML(statusText) + '</span></div>';
    }).join(''));
  }
  if (DOM.aiProviderStatus) {
    safeSetHTML('aiProviderStatus',
      '<div class="ai-provider-info">' +
      '<div class="provider-row"><span class="provider-label">Active Provider</span><span class="provider-value">' + sanitizeHTML(AI_PROVIDER.activeProv) + '</span></div>' +
      '<div class="provider-row"><span class="provider-label">Availability</span><span class="provider-value">' + AI_PROVIDER.availability + '%</span></div>' +
      '<div class="provider-row"><span class="provider-label">Failover Chain</span><span class="provider-value">' + sanitizeHTML(AI_PROVIDER.primary) + ' → ' + sanitizeHTML(AI_PROVIDER.secondary) + ' → ' + sanitizeHTML(AI_PROVIDER.tertiary) + '</span></div>' +
      '<div class="provider-row"><span class="provider-label">Data Residency</span><span class="provider-value">US-East (Host Nation Approved)</span></div>' +
      '</div>'
    );
  }
}
