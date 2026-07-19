/* ============================================================
   Smart Stadium Operations — Main Application Controller
   FIFA World Cup 2026 · GenAI-Enabled Platform
   ============================================================ */
'use strict';

// ---- CHART INSTANCES ----
let chartCrowdTrend;
let chartEnergyTrend;
let chartSurgePred;
let chartEnergyZone;
let chartWaste;

/** @type {object} Shared chart styling defaults */
const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#94a3b8', font: { size: 11 } }
    }
  },
  scales: {
    x: {
      ticks: { color: '#64748b', font: { size: 10 } },
      grid: { color: 'rgba(255,255,255,0.04)' }
    },
    y: {
      ticks: { color: '#64748b', font: { size: 10 } },
      grid: { color: 'rgba(255,255,255,0.04)' }
    }
  }
};

/** Initialize all Chart.js chart instances. */
function initCharts() {
  const crowdCtx = document.getElementById('chartCrowdTrend');
  if (crowdCtx) {
    chartCrowdTrend = new Chart(crowdCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Total Occupancy %',
          data: [],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 2
        }]
      },
      options: Object.assign({}, chartDefaults, {
        plugins: Object.assign({}, chartDefaults.plugins, {
          legend: { display: false }
        })
      })
    });
  }
  const energyCtx = document.getElementById('chartEnergyTrend');
  if (energyCtx) {
    chartEnergyTrend = new Chart(energyCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Energy (kWh)',
            data: [],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 2
          },
          {
            label: 'Baseline',
            data: [],
            borderColor: '#64748b',
            borderDash: [5, 5],
            pointRadius: 0
          }
        ]
      },
      options: chartDefaults
    });
  }
  const surgeCtx = document.getElementById('chartSurgePred');
  if (surgeCtx) {
    chartSurgePred = new Chart(surgeCtx, {
      type: 'bar',
      data: {
        labels: ZONES.slice(0, 8).map(function(z) { return z.name; }),
        datasets: [
          { label: 'Current %', data: [], backgroundColor: 'rgba(59,130,246,0.6)' },
          { label: 'Predicted +15 min', data: [], backgroundColor: 'rgba(245,158,11,0.6)' }
        ]
      },
      options: chartDefaults
    });
  }
  const ezCtx = document.getElementById('chartEnergyZone');
  if (ezCtx) {
    chartEnergyZone = new Chart(ezCtx, {
      type: 'bar',
      data: {
        labels: ['Gate A', 'Gate B', 'Concourse 1', 'Concourse 2', 'Food Court', 'VIP', 'Sec 100', 'Sec 200'],
        datasets: [{
          label: 'kWh',
          data: [320, 280, 410, 380, 520, 180, 350, 290],
          backgroundColor: [
            'rgba(16,185,129,0.6)',
            'rgba(16,185,129,0.6)',
            'rgba(245,158,11,0.6)',
            'rgba(59,130,246,0.6)',
            'rgba(239,68,68,0.6)',
            'rgba(139,92,246,0.6)',
            'rgba(59,130,246,0.6)',
            'rgba(16,185,129,0.6)'
          ]
        }]
      },
      options: Object.assign({}, chartDefaults, {
        plugins: Object.assign({}, chartDefaults.plugins, {
          legend: { display: false }
        })
      })
    });
  }
  const wasteCtx = document.getElementById('chartWaste');
  if (wasteCtx) {
    chartWaste = new Chart(wasteCtx, {
      type: 'doughnut',
      data: {
        labels: ['Recycled', 'Compost', 'Landfill', 'Pending Collection'],
        datasets: [{
          data: [45, 18, 22, 15],
          backgroundColor: ['#10b981', '#06b6d4', '#ef4444', '#f59e0b']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { size: 10 }, padding: 12 }
          }
        }
      }
    });
  }
}

/** Push new data points to all trend charts. */
function updateCharts() {
  const now = formatTimeShort(new Date());
  const totalPct = getAvgOccupancy();
  if (chartCrowdTrend) {
    chartCrowdTrend.data.labels.push(now);
    chartCrowdTrend.data.datasets[0].data.push(totalPct);
    if (chartCrowdTrend.data.labels.length > CHART_HISTORY_LENGTH) {
      chartCrowdTrend.data.labels.shift();
      chartCrowdTrend.data.datasets[0].data.shift();
    }
    chartCrowdTrend.update('none');
  }
  const energy = ENERGY_BASELINE_KWH - 140 + Math.random() * 400;
  if (chartEnergyTrend) {
    chartEnergyTrend.data.labels.push(now);
    chartEnergyTrend.data.datasets[0].data.push(Math.round(energy));
    chartEnergyTrend.data.datasets[1].data.push(ENERGY_BASELINE_KWH);
    if (chartEnergyTrend.data.labels.length > CHART_HISTORY_LENGTH) {
      chartEnergyTrend.data.labels.shift();
      chartEnergyTrend.data.datasets[0].data.shift();
      chartEnergyTrend.data.datasets[1].data.shift();
    }
    chartEnergyTrend.update('none');
  }
  if (chartSurgePred) {
    chartSurgePred.data.datasets[0].data = ZONES.slice(0, 8).map(function(z) { return getZoneOccupancyPct(z); });
    chartSurgePred.data.datasets[1].data = ZONES.slice(0, 8).map(function(z) { return Math.min(100, getZoneOccupancyPct(z) + Math.floor(Math.random() * 15)); });
    chartSurgePred.update('none');
  }
}

// ---- NAVIGATION ----
document.querySelectorAll('.nav-item').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.nav-item').forEach(function(b) {
      b.classList.remove('active');
      b.setAttribute('aria-current', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-current', 'page');
    const page = btn.dataset.page;
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    const target = document.getElementById('page-' + page);
    if (target) {
      target.classList.add('active');
      // Move focus to page heading for screen readers
      const heading = target.querySelector('h1');
      if (heading) heading.focus();
    }
    renderCurrentPage(page);
  });
});

/** Render all content for the currently active page. */
function renderCurrentPage(page) {
  switch (page) {
    case 'overview': renderOverviewStats(); renderOverviewIncidents(); renderOverviewBriefing(); renderServiceStatus(); break;
    case 'navigation': renderPOIList(); break;
    case 'crowd': renderCrowdStats(); renderZoneHeatmap(); renderCrowdAlerts(); break;
    case 'accessibility': renderA11yStats(); renderInfraTable(); renderA11yAlerts(); break;
    case 'transport': renderTransportStats(); renderTransportOptions(); renderDepartureRecs(); break;
    case 'sustainability': renderSustainStats(); renderEcoRecs(); renderSustainAlerts(); break;
    case 'language': renderLangStats(); renderLangGrid(); break;
    case 'ops': renderOpsStats(); renderOpsBriefings(); renderOpsIncidents(); renderAuditLog(); break;
    case 'decision': renderDecisionStats(); renderDecisionIncidents(); renderDecisionRecs(); break;
  }
}

// ---- RATE LIMITING ----
let lastSubmitTime = 0;
const RATE_LIMIT_MS = 800;

/** Check if a user action should be rate-limited. Returns true if allowed. */
function checkRateLimit() {
  const now = Date.now();
  if (now - lastSubmitTime < RATE_LIMIT_MS) return false;
  lastSubmitTime = now;
  return true;
}

/** Check route congestion along standard/alternative paths (Req 1.3). */
function checkRouteCongestion() {
  if (!SimState.activeRouteDestination) return;

  const el = document.getElementById('navRouteResult');
  if (!el) return;

  const checkZoneCongested = (name) => {
    const z = ZONES.find(x => x.name === name);
    return z ? (z.current / z.threshold >= 0.80) : false;
  };

  const stdPathCongested = checkZoneCongested('Concourse 1') || checkZoneCongested('Concourse 2');
  const altPathCongested = checkZoneCongested('Gate C') || checkZoneCongested('VIP Lounge');

  if (stdPathCongested) {
    if (altPathCongested) {
      el.innerHTML = '<div class="route-success critical" role="status">🚨 Congestion Alert: All routing paths to ' + sanitizeHTML(SimState.activeRouteDestination) + ' are currently congested.</div>' +
        '<div class="route-steps" style="margin-top: 8px; color: var(--accent-amber); font-weight: 500;">' +
        '⚠️ THE Navigation_Service recommends waiting at your current location (' + sanitizeHTML(SimState.currentZone || 'Gate B') + ') until congestion clears.' +
        '</div>';
    } else {
      const steps = ['Start from ' + (SimState.currentZone || 'Gate B'), 'Reroute via Gate C bypass corridor', 'Take Elevator E2 to VIP Lounge bypass', 'Reach ' + SimState.activeRouteDestination + ' safely'];
      el.innerHTML = '<div class="route-success" role="status">🔄 Route Automatically Recalculated: Bypassing congested Concourse 1/2.</div>' +
        '<div class="route-steps">' + steps.map(function(s) { return '<div class="route-step">' + sanitizeHTML(s) + '</div>'; }).join('') + '</div>';
    }
  }
}

// ---- INTERACTIVE FUNCTIONS ----
window.StadiumApp = {
  /** Register accommodation need (Req 3). */
  registerA11yNeed: function(val) {
    SimState.userProfile.accessibilityNeed = val;
    const statusEl = document.getElementById('a11yProfileStatus');
    if (statusEl) {
      statusEl.textContent = 'Active Profile: ' + val.charAt(0).toUpperCase() + val.slice(1);
    }
    
    // Auto-enable accessible route toggle if Mobility impairment registered
    if (val === 'mobility') {
      const toggle = document.getElementById('accessibleRouteToggle');
      if (toggle && !toggle.classList.contains('on')) {
        toggle.classList.add('on');
        toggle.setAttribute('aria-checked', 'true');
      }
    }
    
    addAuditEntry('Fan-A11y', 'Registered accommodation profile', 'All', val);
    renderA11yStats();
  },

  /** Set current zone for starting point navigation (Req 1.1). */
  setCurrentZone: function(zoneName) {
    SimState.currentZone = zoneName;
    addAuditEntry('Fan-0847', 'Confirmed current location', zoneName, 'Set starting location');
    window.StadiumApp.generateRoute();
  },

  /** Select a transport option for journey planning. */
  selectTransit: function(name) {
    SimState.selectedTransport = name;
    addAuditEntry('Fan-0847', 'Selected transit option', 'Transportation', name);
    renderTransportOptions();
  },

  /** Simulate Voice Query transcription and response flow (Req 6.4). */
  simulateVoiceQuery: function() {
    if (!checkRateLimit()) return;
    const statusEl = document.getElementById('voiceQueryStatus');
    const msgContainer = document.getElementById('langChatMessages');
    
    if (statusEl) statusEl.textContent = 'Status: Listening...';
    
    setTimeout(() => {
      if (statusEl) statusEl.textContent = 'Status: Transcribing (Spanish)...';
      
      setTimeout(() => {
        if (statusEl) statusEl.textContent = 'Status: Querying AI Engine...';
        
        setTimeout(() => {
          if (statusEl) statusEl.textContent = 'Status: Playing Audio (1.8s)...';
          
          if (msgContainer) {
            msgContainer.innerHTML += '<div class="chat-msg user" role="listitem"><div class="msg-lang">🎙️ Voice Input (Spanish)</div>¿Dónde está la salida más cercana?</div>';
            msgContainer.innerHTML += '<div class="chat-msg ai" role="listitem"><div class="msg-lang">🌐 Translated Response (Spanish)</div>🤖 La salida más cercana es la Puerta B, a 110 metros de su posición actual. <br><span class="translation-meta">🔊 Audio response played back successfully.</span></div>';
            msgContainer.scrollTop = msgContainer.scrollHeight;
          }
          
          setTimeout(() => {
            if (statusEl) statusEl.textContent = 'Status: Idle';
          }, 2000);
        }, 1200);
      }, 1200);
    }, 1200);
  },

  /** Action a Decision Engine recommendation (Req 8.3 feedback loop). */
  actionRecommendation: function(incId, recIdx) {
    const inc = SimState.incidents.find(i => i.id === incId);
    if (!inc) return;

    // Record initial metrics baseline for the incident zone
    const zone = ZONES.find(z => z.name === inc.zone);
    if (zone) {
      SimState.lastZoneMetrics[incId] = zone.current;
      SimState.actionedIncidents[incId] = recIdx;

      // Simulate a direct metric response >10% occupancy change
      const shift = Math.round(zone.threshold * 0.12);
      zone.current = Math.max(ZONE_MIN_OCCUPANCY, zone.current - shift);

      addAuditEntry('Staff-042', 'Actioned recommendation', zone.name, `Action #${recIdx + 1} applied. Zone occupancy reduced by 12%`);

      // Decision engine detects the metric shift >10% and regenerates recommendations within 1.5s
      setTimeout(() => {
        inc.recommendations = [
          'Redeploy secondary staff to surrounding sectors',
          'Adjust electronic signage to standard routing',
          'Monitor adjacent gates for potential crowd spillover',
          'Report incident resolution to tournament command center',
          'Initiate post-event crowd flow review'
        ];
        inc.confidences = [0.97, 0.93, 0.88, 0.79, 0.71];
        addAuditEntry('Decision_Engine', 'Regenerated recommendations', zone.name, `Zone metrics changed >10% after Action #${recIdx + 1}`);
        renderCurrentPage('decision');
      }, 1500);
    }
    renderCurrentPage('decision');
  },

  /** Generate a route from current location to destination (Req 1). */
  generateRoute: function() {
    if (!checkRateLimit()) return;

    const rawInput = document.getElementById('navSearchInput').value;
    const input = sanitizeHTML(truncateInput(rawInput.trim()));
    const el = document.getElementById('navRouteResult');
    if (!el) return;

    if (!input) {
      el.innerHTML = '<div class="empty-state" role="alert">Please enter a destination.</div>';
      return;
    }

    // Wayfinding prompt: starting zone must be confirmed first (Req 1.1)
    if (!SimState.currentZone) {
      el.innerHTML = '<div class="empty-state" role="alert" style="border: 1px solid var(--accent-amber)">⚠️ Current location cannot be determined. Please confirm your starting Zone:</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">' +
        ZONES.slice(0, 4).map(function(z) {
          return '<button class="btn btn-xs btn-outline" onclick="window.StadiumApp.setCurrentZone(\'' + z.name + '\')">' + sanitizeHTML(z.name) + '</button>';
        }).join('') +
        '</div>';
      return;
    }

    SimState.activeRouteDestination = input;

    const toggleA = document.getElementById('accessibleRouteToggle');
    const toggleO = document.getElementById('offlineToggle');
    const accessible = toggleA ? toggleA.classList.contains('on') : false;
    const offline = toggleO ? toggleO.classList.contains('on') : false;

    // Accessibility accomodation support: audio/visual instructions adjustment (Req 3)
    let steps = [];
    if (SimState.userProfile.accessibilityNeed === 'visual') {
      steps = [
        '🔊 Starting from ' + SimState.currentZone + '. A voice guide will now play in your headset.',
        'Walk straight along the tactile ground strip for 45 steps. Watch for the warning sound.',
        'Turn right at the audio beacon near Accessible Restroom ACC-1.',
        'Continue down the wide hallway (30 steps) until the gate notification beep.'
      ];
    } else {
      steps = accessible
        ? ['Start from your current location (' + SimState.currentZone + ')', 'Take wheelchair ramp R1 toward Concourse 1', 'Follow accessible corridor (150m) — flat surface, handrails', 'Turn right at accessible restroom ACC-1', 'Continue through wide corridor (80m) to ' + input, 'Arrive at ' + input + ' — accessible seating available']
        : ['Start from your current location (' + SimState.currentZone + ')', 'Head north through Concourse 1 (120m)', 'Take stairs/escalator to Level 2', 'Follow signage toward ' + input, 'Arrive at ' + input + ' — estimated 3 min walk'];
    }

    el.innerHTML =
      '<div class="route-success" role="status">✅ Route generated ' + (offline ? '(offline — cached map) ' : '') + (accessible ? '· ♿ Accessible route ' : '') + '· ETA: ' + (accessible ? '5' : '3') + ' min</div>' +
      '<div class="route-steps">' + steps.map(function(s) { return '<div class="route-step">' + sanitizeHTML(s) + '</div>'; }).join('') + '</div>';
    
    addAuditEntry('Fan-0847', 'Route generated', SimState.currentZone + ' → ' + input, accessible ? 'Accessible route' : 'Standard route');
  },

  /** Accessibility assistant chat (Req 3.6). */
  sendA11yChat: function() {
    if (!checkRateLimit()) return;
    const inputEl = document.getElementById('a11yChatInput');
    if (!inputEl) return;
    const msg = sanitizeHTML(truncateInput(inputEl.value.trim()));
    if (!msg) return;
    inputEl.value = '';
    const el = document.getElementById('a11yChatMessages');
    if (!el) return;
    el.innerHTML += '<div class="chat-msg user" role="listitem">' + msg + '</div>';
    setTimeout(function() {
      const responses = [
        'All wheelchair ramps at Gates A, B, and D are fully operational. Ramp R2 at Concourse 1 has degraded service — I recommend using Ramp R1 at Gate B instead.',
        'Elevator E3 in the VIP Lounge is currently out of service. Maintenance ETA is 25 minutes. I\'ve prepared an alternate accessible route via Ramp R3 at Gate D.',
        'Hearing loop systems are active in Sections 114, 200, and the VIP Lounge. You can connect your hearing aid\'s T-coil for direct audio reception.',
        'I can arrange priority seating with wheelchair space, companion seating, and clear sightlines. Would you like me to check availability in your section?'
      ];
      el.innerHTML += '<div class="chat-msg ai" role="listitem">🤖 ' + responses[Math.floor(Math.random() * responses.length)] + '</div>';
      el.scrollTop = el.scrollHeight;
    }, 800);
    el.scrollTop = el.scrollHeight;
  },

  /** Plan end-to-end journey (Req 4.4). */
  planJourney: function() {
    if (!checkRateLimit()) return;
    const fromEl = document.getElementById('journeyFrom');
    const seatEl = document.getElementById('journeySeat');
    const from = sanitizeHTML(truncateInput((fromEl ? fromEl.value.trim() : '') || 'Times Square, NYC'));
    const seat = sanitizeHTML(truncateInput((seatEl ? seatEl.value.trim() : '') || 'Section 114 Row B'));
    const el = document.getElementById('journeyResult');
    if (!el) return;
    const steps = [
      '🏠 Depart from ' + from,
      '🚇 Take NJ Transit from Penn Station → Meadowlands (22 min)',
      '🚶 Walk from Meadowlands Station to Gate B (8 min)',
      '🏟️ Enter via Gate B security checkpoint (est. 5 min)',
      '📍 Navigate to ' + seat + ' via Concourse 1 (4 min)',
      '⏱️ Estimated total: 39 minutes · Recommended departure: 2 hours before kickoff'
    ];
    el.innerHTML =
      '<div class="route-success" role="status">✅ Journey plan generated</div>' +
      '<div class="route-steps">' + steps.map(function(s) { return '<div class="route-step">' + s + '</div>'; }).join('') + '</div>' +
      '<div class="journey-return"><strong>Post-match return:</strong> Reverse route via NJ Transit. AI recommends departing +5 min post-match to avoid peak surge.</div>';
    addAuditEntry('Fan-0847', 'Journey planned', from + ' → ' + seat, 'NJ Transit route');
  },

  /** Translation panel chat (Req 6.3). */
  sendLangChat: function() {
    if (!checkRateLimit()) return;
    const inputEl = document.getElementById('langChatInput');
    if (!inputEl) return;
    const msg = sanitizeHTML(truncateInput(inputEl.value.trim()));
    if (!msg) return;
    inputEl.value = '';
    const el = document.getElementById('langChatMessages');
    if (!el) return;
    el.innerHTML += '<div class="chat-msg user" role="listitem"><div class="msg-lang">Detected: Auto</div>' + msg + '</div>';
    setTimeout(function() {
      const translations = {
        'hola': { lang: 'Spanish → English', reply: '"Hello" — How can I help you today? ¿En qué puedo ayudarte?' },
        'where': { lang: 'English', reply: 'I can help you find any location in the stadium. Please specify what you\'re looking for — seats, food, restrooms, exits, or any other facility.' },
        'food': { lang: 'English', reply: 'The Food Court is located on Concourse 1, featuring 12 vendors including halal, kosher, vegetarian, and allergen-free options. Nearest from your location: 120m via Gate B corridor.' }
      };
      const key = Object.keys(translations).find(function(k) { return msg.toLowerCase().includes(k); });
      const resp = key ? translations[key] : { lang: 'Auto-detected', reply: 'I understand your message. Here\'s my response: The stadium information desk is available at Gate A, or I can help you with navigation, transport, accessibility, or any other service. Confidence: 0.94' };
      el.innerHTML += '<div class="chat-msg ai" role="listitem"><div class="msg-lang">🌐 ' + resp.lang + '</div>🤖 ' + resp.reply + '</div>';
      el.scrollTop = el.scrollHeight;
    }, 600);
    el.scrollTop = el.scrollHeight;
  },

  /** Staff↔Fan bridge chat with live translation (Req 6.5). */
  sendBridgeChat: function() {
    if (!checkRateLimit()) return;
    const inputEl = document.getElementById('bridgeChatInput');
    if (!inputEl) return;
    const msg = sanitizeHTML(truncateInput(inputEl.value.trim()));
    if (!msg) return;
    inputEl.value = '';
    const el = document.getElementById('bridgeChatMessages');
    if (!el) return;
    el.innerHTML += '<div class="chat-msg user" role="listitem"><div class="msg-lang">Staff (English)</div>' + msg + '</div>';
    setTimeout(function() {
      const translated = msg.replace(/gate/gi, 'puerta').replace(/please/gi, 'por favor').replace(/help/gi, 'ayuda').replace(/your/gi, 'su').replace(/the/gi, 'el').replace(/is/gi, 'está').replace(/to/gi, 'a');
      el.innerHTML += '<div class="chat-msg ai" role="listitem"><div class="msg-lang">→ Fan (Spanish translation)</div>🌐 ' + translated + ' <br><span class="translation-meta">Confidence: 0.91 · Translated in 1.2s</span></div>';
      el.scrollTop = el.scrollHeight;
    }, 500);
    el.scrollTop = el.scrollHeight;
  },

  /** Natural language operational query (Req 7.6). */
  opsQuery: function() {
    if (!checkRateLimit()) return;
    const inputEl = document.getElementById('opsQueryInput');
    if (!inputEl) return;
    const query = sanitizeHTML(truncateInput(inputEl.value.trim()));
    const el = document.getElementById('opsQueryResult');
    if (!el) return;
    if (!query) { el.innerHTML = '<div class="empty-state" role="alert">Please enter a query.</div>'; return; }
    el.innerHTML = '<div class="loading-state" role="status" aria-live="polite">🤖 Analyzing...</div>';
    setTimeout(function() {
      const avgOcc = getAvgOccupancy();
      const activeCount = SimState.incidents.filter(function(i) { return i.status === 'Active'; }).length;
      const responses = {
        'crowd': 'Based on current data, <strong>Gate A</strong> has the highest crowd density at ' + getZoneOccupancyPct(ZONES[0]) + '% of capacity (' + ZONES[0].current.toLocaleString() + ' fans). The recommended action is to redirect incoming flow to Gate D, currently at ' + getZoneOccupancyPct(ZONES[3]) + '%. Average venue occupancy is ' + avgOcc + '%.',
        'incident': 'There are currently ' + activeCount + ' active incidents. The most critical is "' + sanitizeHTML((SimState.incidents[0] || {}).title || 'N/A') + '" at ' + sanitizeHTML((SimState.incidents[0] || {}).zone || 'N/A') + '. The Decision Engine has generated 5 ranked recommendations with an average confidence of 0.82.',
        'energy': 'Current venue energy consumption is 2,847 kWh, which is 4% above the baseline of ' + ENERGY_BASELINE_KWH + ' kWh. The highest consumer is the Food Court zone at 520 kWh. AI recommends reducing HVAC in unoccupied upper sections to save approximately 45 kWh/hr.',
        'transport': 'All major transport services are operational. NJ Transit is running on time with 22-minute service to Penn Station. Post-match shuttle frequency has been doubled. Ride-share surge is at 1.4x and expected to normalize 25 minutes after the final whistle.',
        'history': '<strong>Post-Event Analysis (Req 8.6):</strong> Reviewing incident data from the current match — ' + SimState.incidents.length + ' total incidents recorded, ' + activeCount + ' still active. Key lesson: Gate A consistently exceeds 80% capacity during minutes 60-75. Recommendation: Pre-position additional staff at Gate A for future matches during this window.'
      };
      const key = Object.keys(responses).find(function(k) { return query.toLowerCase().includes(k); });
      const answer = key ? responses[key] : 'Analysis complete: Based on current operational data across all 7 connected services — venue is operating at ' + avgOcc + '% average occupancy with ' + activeCount + ' active incident(s). All transport services nominal. Sustainability metrics within acceptable range. For specific insights, try asking about "crowd density", "incidents", "energy", "transport status", or "history".';
      el.innerHTML = '<div class="briefing-card" role="status" aria-live="polite"><div class="briefing-time">🤖 AI Response — ' + formatTime(new Date()) + '</div><div class="briefing-text">' + answer + '</div></div>';
      addAuditEntry('Organizer-01', 'AI Query', 'All', query);
    }, 1200);
  },

  /** Resolve an incident from the Decision Engine (Req 8.3). */
  resolveIncident: function(id) {
    const safeId = sanitizeHTML(truncateInput(String(id)));
    const inc = SimState.incidents.find(function(i) { return i.id === safeId; });
    if (inc) {
      inc.status = 'Resolved';
      addAuditEntry('Staff-042', 'Incident resolved', inc.zone, inc.title);
      renderCurrentPage('decision');
      renderOverviewIncidents();
      renderOpsIncidents();
      renderOpsStats();
      renderDecisionStats();
    }
  }
};

// ---- EVENT DELEGATION FOR DYNAMIC BUTTONS ----
document.addEventListener('click', function(e) {
  // Resolve button delegation
  const resolveBtn = e.target.closest('.resolve-btn');
  if (resolveBtn) {
    const incId = resolveBtn.getAttribute('data-incident-id');
    if (incId) window.StadiumApp.resolveIncident(incId);
    return;
  }
  // Action recommendation button delegation
  const actionRecBtn = e.target.closest('.action-rec-btn');
  if (actionRecBtn) {
    const incId = actionRecBtn.getAttribute('data-incident-id');
    const recIdx = parseInt(actionRecBtn.getAttribute('data-rec-idx'), 10);
    if (incId !== null && !isNaN(recIdx)) {
      window.StadiumApp.actionRecommendation(incId, recIdx);
    }
    return;
  }
  // Transit option select button delegation
  const transitBtn = e.target.closest('.select-transit-btn');
  if (transitBtn) {
    const transitName = transitBtn.getAttribute('data-transit-name');
    if (transitName) {
      window.StadiumApp.selectTransit(transitName);
    }
    return;
  }
  // POI item delegation
  const poiItem = e.target.closest('.poi-item');
  if (poiItem) {
    const poiName = poiItem.getAttribute('data-poi');
    const navInput = document.getElementById('navSearchInput');
    if (navInput && poiName) {
      navInput.value = poiName;
      window.StadiumApp.generateRoute();
    }
  }
});

// ---- KEYBOARD SUPPORT ----
document.addEventListener('keypress', function(e) {
  if (e.key !== 'Enter') return;
  const id = e.target.id;
  if (id === 'navSearchInput') window.StadiumApp.generateRoute();
  else if (id === 'a11yChatInput') window.StadiumApp.sendA11yChat();
  else if (id === 'langChatInput') window.StadiumApp.sendLangChat();
  else if (id === 'bridgeChatInput') window.StadiumApp.sendBridgeChat();
  else if (id === 'opsQueryInput') window.StadiumApp.opsQuery();
  // POI items keyboard activation
  if (e.target.closest('.poi-item')) {
    const poiName = e.target.closest('.poi-item').getAttribute('data-poi');
    const navInput = document.getElementById('navSearchInput');
    if (navInput && poiName) { navInput.value = poiName; window.StadiumApp.generateRoute(); }
  }
});

// Toggle keyboard support (space/enter)
document.querySelectorAll('.toggle').forEach(function(toggle) {
  toggle.setAttribute('role', 'switch');
  toggle.setAttribute('aria-checked', 'false');
  toggle.addEventListener('click', function() {
    this.classList.toggle('on');
    const isOn = this.classList.contains('on');
    this.setAttribute('aria-checked', String(isOn));
  });
  toggle.addEventListener('keydown', function(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.click();
    }
  });
  toggle.setAttribute('tabindex', '0');
});

/** Check selected transport status and generate alternative routes if delayed (Req 4.5). */
function checkTransportStatus() {
  if (!SimState.selectedTransport) return;

  const transit = TRANSPORT_OPTIONS.find(t => t.name === SimState.selectedTransport);
  if (transit && transit.status === 'Delayed') {
    const el = document.getElementById('departureRecs');
    if (el) {
      el.innerHTML = '<div class="briefing-card" style="border: 1px solid var(--accent-red)">' +
        '<div class="briefing-time">🚨 Transport Disruption Alternative Routing Plan</div>' +
        '<div class="briefing-text">' +
        `Attention: your selected transport service (<strong>${transit.name}</strong>) is currently delayed by more than 15 minutes.<br>` +
        'Here are 3 alternative routing options generated by the Transport_Service:<br><br>' +
        '1. 🚌 <strong>FIFA Shuttle Bus:</strong> Meadowlands Loop to Times Square. Operational, on time. Depart from Gate B loop.<br>' +
        '2. 🚕 <strong>Ride-Share (Uber/Lyft):</strong> Pickup Zone C. Surge is 1.4x, 12 min wait. Access via Gate C path.<br>' +
        '3. 🚲 <strong>Bike Share Station:</strong> Gate D. 8 bikes available. Direct pathway (2 min walk) from Gate D exit.' +
        '</div></div>';
    }
  }
}

// ---- SIMULATION TICK ----
function simulationTick() {
  tickZones();
  SimState.matchMinute = Math.min(90, SimState.matchMinute + 1);
  updateCharts();
  
  // Dynamic Route Congestion Check
  checkRouteCongestion();
  // Dynamic Transport Disruption Check
  checkTransportStatus();
  
  // Simulate occasional transport delay to trigger alternatives
  if (Math.random() < 0.1) {
    TRANSPORT_OPTIONS.forEach(t => {
      if (t.name === 'NJ Transit Rail') {
        t.status = 'Delayed';
        t.statusClass = 'delayed';
        t.eta = '35 min delay';
        addAuditEntry('Transport_Service', 'Service delay alert', t.name, 'NJ Transit Rail delayed 35 min');
      }
    });
  }

  const activePage = document.querySelector('.nav-item.active');
  if (activePage) renderCurrentPage(activePage.dataset.page);
}

// ---- SKIP LINK HANDLER ----
const skipLink = document.getElementById('skipLink');
if (skipLink) {
  skipLink.addEventListener('click', function(e) {
    e.preventDefault();
    const main = document.querySelector('.main-content');
    if (main) { main.setAttribute('tabindex', '-1'); main.focus(); }
  });
}

// ---- INIT ----
function init() {
  cacheDOMReferences();
  initZones();
  initIncidents();
  addAuditEntry('System', 'Platform initialized', 'All', 'Smart Stadium Operations v1.0');
  addAuditEntry('System', 'Match started', 'All', 'USA vs Mexico — MetLife Stadium');
  addAuditEntry('AI-Engine', 'Briefing generated', 'All', 'Automated 30-min briefing #1');
  addAuditEntry('Crowd_Monitor', 'Zone alert', 'Gate A', 'Occupancy threshold 80% exceeded');
  addAuditEntry('Decision_Engine', 'Recommendations generated', 'Gate A', '5 actions ranked');
  addAuditEntry('Staff-042', 'Acknowledged alert', 'Gate A', 'Crowd management initiated');
  initCharts();
  renderCurrentPage('overview');
  updateCharts();
  
  // Set initial ARIA state on active nav
  const activeNav = document.querySelector('.nav-item.active');
  if (activeNav) activeNav.setAttribute('aria-current', 'page');
  
  // Start simulation intervals
  SimState.tickIntervalId = setInterval(simulationTick, TICK_INTERVAL_MS);
  SimState.briefingIntervalId = setInterval(function() { SimState.currentBriefingIdx++; }, BRIEFING_INTERVAL_MS);
  SimState.incidentIntervalId = setInterval(function() {
    if (SimState.incidents.filter(function(i) { return i.status === 'Active'; }).length < MAX_ACTIVE_INCIDENTS) {
      const t = INCIDENT_TEMPLATES[Math.floor(Math.random() * INCIDENT_TEMPLATES.length)];
      const newInc = {
        id: 'INC-' + (1001 + SimState.incidents.length),
        type: t.type, title: t.title, severity: t.severity, zone: t.zone, domain: t.domain,
        time: new Date(),
        status: 'Active',
        recommendations: AI_RECOMMENDATIONS[Math.floor(Math.random() * AI_RECOMMENDATIONS.length)],
        confidences: [0.95, 0.88, 0.76, 0.63, 0.48].map(function(c) { return c + (Math.random() - 0.5) * 0.1; })
      };
      SimState.incidents.unshift(newInc);
      addAuditEntry('System', 'Incident created', newInc.zone, newInc.title);
      addAuditEntry('Decision_Engine', 'Recommendations generated', newInc.zone, '5 actions for ' + newInc.id);
    }
  }, INCIDENT_INTERVAL_MS);
}

init();
