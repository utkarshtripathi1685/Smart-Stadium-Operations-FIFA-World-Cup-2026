/* ============================================================
   Smart Stadium Operations — Main Application Controller
   ============================================================ */

// ---- CHART INSTANCES ----
let chartCrowdTrend, chartEnergyTrend, chartSurgePred, chartEnergyZone, chartWaste;

function initCharts() {
  const chartDefaults = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } }, scales: { x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } } } };

  // Crowd Trend
  const crowdCtx = document.getElementById('chartCrowdTrend');
  if (crowdCtx) {
    chartCrowdTrend = new Chart(crowdCtx, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Total Occupancy %', data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, pointRadius: 2 }] },
      options: { ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }
    });
  }

  // Energy Trend
  const energyCtx = document.getElementById('chartEnergyTrend');
  if (energyCtx) {
    chartEnergyTrend = new Chart(energyCtx, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Energy (kWh)', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4, pointRadius: 2 }, { label: 'Baseline', data: [], borderColor: '#64748b', borderDash: [5,5], pointRadius: 0 }] },
      options: chartDefaults
    });
  }

  // Surge Prediction
  const surgeCtx = document.getElementById('chartSurgePred');
  if (surgeCtx) {
    chartSurgePred = new Chart(surgeCtx, {
      type: 'bar',
      data: { labels: ZONES.slice(0,8).map(z => z.name), datasets: [{ label: 'Current %', data: [], backgroundColor: 'rgba(59,130,246,0.6)' }, { label: 'Predicted +15 min', data: [], backgroundColor: 'rgba(245,158,11,0.6)' }] },
      options: chartDefaults
    });
  }

  // Energy by Zone
  const ezCtx = document.getElementById('chartEnergyZone');
  if (ezCtx) {
    chartEnergyZone = new Chart(ezCtx, {
      type: 'bar',
      data: { labels: ['Gate A','Gate B','Concourse 1','Concourse 2','Food Court','VIP','Sec 100','Sec 200'], datasets: [{ label: 'kWh', data: [320,280,410,380,520,180,350,290], backgroundColor: ['rgba(16,185,129,0.6)','rgba(16,185,129,0.6)','rgba(245,158,11,0.6)','rgba(59,130,246,0.6)','rgba(239,68,68,0.6)','rgba(139,92,246,0.6)','rgba(59,130,246,0.6)','rgba(16,185,129,0.6)'] }] },
      options: { ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }
    });
  }

  // Waste Levels
  const wasteCtx = document.getElementById('chartWaste');
  if (wasteCtx) {
    chartWaste = new Chart(wasteCtx, {
      type: 'doughnut',
      data: { labels: ['Recycled','Compost','Landfill','Pending Collection'], datasets: [{ data: [45,18,22,15], backgroundColor: ['#10b981','#06b6d4','#ef4444','#f59e0b'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, padding: 12 } } } }
    });
  }
}

function updateCharts() {
  const now = formatTimeShort(new Date());
  const totalPct = Math.round(ZONES.reduce((s,z) => s + z.current/z.threshold, 0) / ZONES.length * 100);

  if (chartCrowdTrend) {
    chartCrowdTrend.data.labels.push(now);
    chartCrowdTrend.data.datasets[0].data.push(totalPct);
    if (chartCrowdTrend.data.labels.length > 20) { chartCrowdTrend.data.labels.shift(); chartCrowdTrend.data.datasets[0].data.shift(); }
    chartCrowdTrend.update('none');
  }

  const energy = 2600 + Math.random() * 400;
  if (chartEnergyTrend) {
    chartEnergyTrend.data.labels.push(now);
    chartEnergyTrend.data.datasets[0].data.push(Math.round(energy));
    chartEnergyTrend.data.datasets[1].data.push(2740);
    if (chartEnergyTrend.data.labels.length > 20) { chartEnergyTrend.data.labels.shift(); chartEnergyTrend.data.datasets[0].data.shift(); chartEnergyTrend.data.datasets[1].data.shift(); }
    chartEnergyTrend.update('none');
  }

  if (chartSurgePred) {
    chartSurgePred.data.datasets[0].data = ZONES.slice(0,8).map(z => Math.round(z.current/z.threshold*100));
    chartSurgePred.data.datasets[1].data = ZONES.slice(0,8).map(z => Math.min(100, Math.round(z.current/z.threshold*100) + Math.floor(Math.random()*15)));
    chartSurgePred.update('none');
  }
}

// ---- NAVIGATION ----
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const page = btn.dataset.page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    renderCurrentPage(page);
  });
});

function renderCurrentPage(page) {
  switch(page) {
    case 'overview': renderOverviewStats(); renderOverviewIncidents(); renderOverviewBriefing(); break;
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

// ---- INTERACTIVE FUNCTIONS ----
window.StadiumApp = {
  generateRoute() {
    const input = document.getElementById('navSearchInput').value.trim();
    const el = document.getElementById('navRouteResult');
    if (!input) { el.innerHTML = '<div style="color:var(--accent-amber);font-size:0.82rem">Please enter a destination.</div>'; return; }
    const accessible = document.getElementById('accessibleRouteToggle').classList.contains('on');
    const offline = document.getElementById('offlineToggle').classList.contains('on');
    const steps = accessible
      ? [`Start from your current location (Gate B area)`, `Take wheelchair ramp R1 toward Concourse 1`, `Follow accessible corridor (150m) — flat surface, handrails`, `Turn right at accessible restroom ACC-1`, `Continue through wide corridor (80m) to ${input}`, `Arrive at ${input} — accessible seating available`]
      : [`Start from your current location (Gate B area)`, `Head north through Concourse 1 (120m)`, `Take stairs/escalator to Level 2`, `Follow signage toward ${input}`, `Arrive at ${input} — estimated 3 min walk`];
    el.innerHTML = `
      <div style="font-size:0.82rem;color:var(--accent-green);margin-bottom:8px">✅ Route generated ${offline ? '(offline — cached map)' : ''}${accessible ? ' · ♿ Accessible route' : ''} · ETA: ${accessible ? '5' : '3'} min</div>
      <div class="route-steps">${steps.map(s => `<div class="route-step">${s}</div>`).join('')}</div>
    `;
    addAuditEntry('Fan-0847', 'Route generated', 'Gate B → ' + input, accessible ? 'Accessible route' : 'Standard route');
  },

  sendA11yChat() {
    const input = document.getElementById('a11yChatInput');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    const el = document.getElementById('a11yChatMessages');
    el.innerHTML += `<div class="chat-msg user">${msg}</div>`;
    setTimeout(() => {
      const responses = [
        `All wheelchair ramps at Gates A, B, and D are fully operational. Ramp R2 at Concourse 1 has degraded service — I recommend using Ramp R1 at Gate B instead.`,
        `Elevator E3 in the VIP Lounge is currently out of service. Maintenance ETA is 25 minutes. I've prepared an alternate accessible route via Ramp R3 at Gate D.`,
        `Hearing loop systems are active in Sections 114, 200, and the VIP Lounge. You can connect your hearing aid's T-coil for direct audio reception.`,
        `I can arrange priority seating with wheelchair space, companion seating, and clear sightlines. Would you like me to check availability in your section?`,
      ];
      el.innerHTML += `<div class="chat-msg ai">🤖 ${responses[Math.floor(Math.random() * responses.length)]}</div>`;
      el.scrollTop = el.scrollHeight;
    }, 800);
    el.scrollTop = el.scrollHeight;
  },

  planJourney() {
    const from = document.getElementById('journeyFrom').value.trim() || 'Times Square, NYC';
    const seat = document.getElementById('journeySeat').value.trim() || 'Section 114 Row B';
    const el = document.getElementById('journeyResult');
    const steps = [
      `🏠 Depart from ${from}`,
      `🚇 Take NJ Transit from Penn Station → Meadowlands (22 min)`,
      `🚶 Walk from Meadowlands Station to Gate B (8 min)`,
      `🏟️ Enter via Gate B security checkpoint (est. 5 min)`,
      `📍 Navigate to ${seat} via Concourse 1 (4 min)`,
      `⏱️ Estimated total: 39 minutes · Recommended departure: 2 hours before kickoff`,
    ];
    el.innerHTML = `
      <div style="font-size:0.82rem;color:var(--accent-green);margin-bottom:8px">✅ Journey plan generated</div>
      <div class="route-steps">${steps.map(s => `<div class="route-step">${s}</div>`).join('')}</div>
      <div style="margin-top:12px;font-size:0.78rem;color:var(--text-secondary)"><strong>Post-match return:</strong> Reverse route via NJ Transit. AI recommends departing +5 min post-match to avoid peak surge.</div>
    `;
    addAuditEntry('Fan-0847', 'Journey planned', from + ' → ' + seat, 'NJ Transit route');
  },

  sendLangChat() {
    const input = document.getElementById('langChatInput');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    const el = document.getElementById('langChatMessages');
    el.innerHTML += `<div class="chat-msg user"><div class="msg-lang">Detected: Auto</div>${msg}</div>`;
    setTimeout(() => {
      const translations = {
        'hola': { lang: 'Spanish → English', reply: '"Hello" — How can I help you today? ¿En qué puedo ayudarte?' },
        'where': { lang: 'English', reply: 'I can help you find any location in the stadium. Please specify what you\'re looking for — seats, food, restrooms, exits, or any other facility.' },
        'food': { lang: 'English', reply: 'The Food Court is located on Concourse 1, featuring 12 vendors including halal, kosher, vegetarian, and allergen-free options. Nearest from your location: 120m via Gate B corridor.' },
      };
      const key = Object.keys(translations).find(k => msg.toLowerCase().includes(k));
      const resp = key ? translations[key] : { lang: 'Auto-detected', reply: `I understand your message. Here's my response: The stadium information desk is available at Gate A, or I can help you with navigation, transport, accessibility, or any other service. Confidence: 0.94` };
      el.innerHTML += `<div class="chat-msg ai"><div class="msg-lang">🌐 ${resp.lang}</div>🤖 ${resp.reply}</div>`;
      el.scrollTop = el.scrollHeight;
    }, 600);
    el.scrollTop = el.scrollHeight;
  },

  sendBridgeChat() {
    const input = document.getElementById('bridgeChatInput');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    const el = document.getElementById('bridgeChatMessages');
    el.innerHTML += `<div class="chat-msg user"><div class="msg-lang">Staff (English)</div>${msg}</div>`;
    setTimeout(() => {
      el.innerHTML += `<div class="chat-msg ai"><div class="msg-lang">→ Fan (Spanish translation)</div>🌐 ${msg.replace(/gate/gi,'puerta').replace(/please/gi,'por favor').replace(/help/gi,'ayuda').replace(/your/gi,'su').replace(/the/gi,'el').replace(/is/gi,'está').replace(/to/gi,'a')} <br><span style="font-size:0.65rem;color:var(--text-muted)">Confidence: 0.91 · Translated in 1.2s</span></div>`;
      el.scrollTop = el.scrollHeight;
    }, 500);
    el.scrollTop = el.scrollHeight;
  },

  opsQuery() {
    const input = document.getElementById('opsQueryInput');
    const query = input.value.trim();
    const el = document.getElementById('opsQueryResult');
    if (!query) { el.innerHTML = '<div style="color:var(--accent-amber);font-size:0.82rem">Please enter a query.</div>'; return; }
    el.innerHTML = '<div style="color:var(--text-muted);font-size:0.82rem">🤖 Analyzing...</div>';
    setTimeout(() => {
      const responses = {
        'crowd': `Based on current data, **Gate A** has the highest crowd density at ${Math.round(ZONES[0].current/ZONES[0].threshold*100)}% of capacity (${ZONES[0].current.toLocaleString()} fans). The recommended action is to redirect incoming flow to Gate D, currently at ${Math.round(ZONES[3].current/ZONES[3].threshold*100)}%. Average venue occupancy is ${Math.round(ZONES.reduce((s,z)=>s+z.current/z.threshold,0)/ZONES.length*100)}%.`,
        'incident': `There are currently ${SimState.incidents.filter(i=>i.status==='Active').length} active incidents. The most critical is "${SimState.incidents[0]?.title}" at ${SimState.incidents[0]?.zone}. The Decision Engine has generated 5 ranked recommendations with an average confidence of 0.82.`,
        'energy': `Current venue energy consumption is 2,847 kWh, which is 4% above the baseline of 2,740 kWh. The highest consumer is the Food Court zone at 520 kWh. AI recommends reducing HVAC in unoccupied upper sections to save approximately 45 kWh/hr.`,
        'transport': `All major transport services are operational. NJ Transit is running on time with 22-minute service to Penn Station. Post-match shuttle frequency has been doubled. Ride-share surge is at 1.4x and expected to normalize 25 minutes after the final whistle.`,
      };
      const key = Object.keys(responses).find(k => query.toLowerCase().includes(k));
      const answer = key ? responses[key] : `Analysis complete: Based on current operational data across all 7 connected services — venue is operating at ${Math.round(ZONES.reduce((s,z)=>s+z.current/z.threshold,0)/ZONES.length*100)}% average occupancy with ${SimState.incidents.filter(i=>i.status==='Active').length} active incident(s). All transport services nominal. Sustainability metrics within acceptable range. For specific insights, try asking about "crowd density", "incidents", "energy", or "transport status".`;
      el.innerHTML = `<div class="briefing-card"><div class="briefing-time">🤖 AI Response — ${formatTime(new Date())}</div><div class="briefing-text">${answer.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}</div></div>`;
      addAuditEntry('Organizer-01', 'AI Query', 'All', query);
    }, 1200);
  },

  resolveIncident(id) {
    const inc = SimState.incidents.find(i => i.id === id);
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

// ---- SIMULATION TICK ----
function simulationTick() {
  tickZones();
  SimState.matchMinute = Math.min(90, SimState.matchMinute + 1);
  updateCharts();
  // Re-render active page
  const activePage = document.querySelector('.nav-item.active')?.dataset?.page;
  if (activePage) renderCurrentPage(activePage);
}

// ---- INIT ----
function init() {
  initZones();
  initIncidents();
  // Seed audit log
  addAuditEntry('System', 'Platform initialized', 'All', 'Smart Stadium Operations v1.0');
  addAuditEntry('System', 'Match started', 'All', 'USA vs Mexico — MetLife Stadium');
  addAuditEntry('AI-Engine', 'Briefing generated', 'All', 'Automated 30-min briefing #1');
  addAuditEntry('Crowd_Monitor', 'Zone alert', 'Gate A', 'Occupancy threshold 80% exceeded');
  addAuditEntry('Decision_Engine', 'Recommendations generated', 'Gate A', '5 actions ranked');
  addAuditEntry('Staff-042', 'Acknowledged alert', 'Gate A', 'Crowd management initiated');

  initCharts();
  renderCurrentPage('overview');
  updateCharts();

  // Tick every 5 seconds
  setInterval(simulationTick, 5000);
  // Rotate briefings every 60 seconds
  setInterval(() => { SimState.currentBriefingIdx++; }, 60000);
  // Random new incident every 45 seconds
  setInterval(() => {
    if (SimState.incidents.filter(i => i.status === 'Active').length < 4) {
      const t = INCIDENT_TEMPLATES[Math.floor(Math.random() * INCIDENT_TEMPLATES.length)];
      const newInc = {
        id: `INC-${1001 + SimState.incidents.length}`,
        ...t,
        time: new Date(),
        status: 'Active',
        recommendations: AI_RECOMMENDATIONS[Math.floor(Math.random() * AI_RECOMMENDATIONS.length)],
        confidences: [0.95, 0.88, 0.76, 0.63, 0.48].map(c => c + (Math.random() - 0.5) * 0.1),
      };
      SimState.incidents.unshift(newInc);
      addAuditEntry('System', 'Incident created', newInc.zone, newInc.title);
      addAuditEntry('Decision_Engine', 'Recommendations generated', newInc.zone, `5 actions for ${newInc.id}`);
    }
  }, 45000);
}

// Handle Enter key on inputs
document.getElementById('navSearchInput')?.addEventListener('keypress', e => { if (e.key === 'Enter') window.StadiumApp.generateRoute(); });
document.getElementById('a11yChatInput')?.addEventListener('keypress', e => { if (e.key === 'Enter') window.StadiumApp.sendA11yChat(); });
document.getElementById('langChatInput')?.addEventListener('keypress', e => { if (e.key === 'Enter') window.StadiumApp.sendLangChat(); });
document.getElementById('bridgeChatInput')?.addEventListener('keypress', e => { if (e.key === 'Enter') window.StadiumApp.sendBridgeChat(); });
document.getElementById('opsQueryInput')?.addEventListener('keypress', e => { if (e.key === 'Enter') window.StadiumApp.opsQuery(); });

init();
