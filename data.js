/* ============================================================
   Smart Stadium Operations — Data & Simulation Engine
   FIFA World Cup 2026 · GenAI-Enabled Platform
   ============================================================
   Provides all data constants, simulation state, zone management,
   incident generation, audit logging, and utility functions.
   ============================================================ */
'use strict';

// ---- CONFIGURATION CONSTANTS ----
/** @constant {number} Maximum entries retained in the audit log (90-day retention policy) */
const MAX_AUDIT_LOG_ENTRIES = 50;
/** @constant {number} Zone occupancy warning threshold (80%) per Req 2.2 */
const OCCUPANCY_WARNING_PCT = 0.80;
/** @constant {number} Zone occupancy critical threshold (100%) per Req 2.2 */
const OCCUPANCY_CRITICAL_PCT = 1.00;
/** @constant {number} Max zone overshoot multiplier for simulation */
const ZONE_OVERSHOOT_MULTIPLIER = 1.05;
/** @constant {number} Minimum zone occupancy floor */
const ZONE_MIN_OCCUPANCY = 50;
/** @constant {number} Zone tick delta factor */
const ZONE_TICK_DELTA_FACTOR = 0.05;
/** @constant {number} Zone tick bias (slight upward trend) */
const ZONE_TICK_BIAS = 0.45;
/** @constant {number} Decision Engine confidence threshold — below this requires human review (Req 8.5) */
const CONFIDENCE_THRESHOLD = 0.70;
/** @constant {number} Translation confidence threshold (Req 6.7) */
const TRANSLATION_CONFIDENCE_THRESHOLD = 0.85;
/** @constant {number} Maximum input length for user-submitted text */
const MAX_INPUT_LENGTH = 500;
/** @constant {number} Simulation tick interval in ms */
const TICK_INTERVAL_MS = 5000;
/** @constant {number} Briefing rotation interval in ms (30 min) */
const BRIEFING_INTERVAL_MS = 60000;
/** @constant {number} New incident generation interval in ms */
const INCIDENT_INTERVAL_MS = 45000;
/** @constant {number} Max active incidents before pausing generation */
const MAX_ACTIVE_INCIDENTS = 4;
/** @constant {number} Chart history window length */
const CHART_HISTORY_LENGTH = 20;
/** @constant {number} Energy baseline in kWh */
const ENERGY_BASELINE_KWH = 2740;
/** @constant {number} AI availability target (Req 9.2) */
const AI_AVAILABILITY_TARGET = 99.5;

/**
 * Sanitize a string to prevent XSS when inserted into HTML.
 * Escapes &, <, >, ", and ' characters.
 * @param {string} str — The raw string to sanitize.
 * @returns {string} The escaped, safe string.
 */
function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Truncate input to the maximum allowed length.
 * @param {string} str — Raw user input.
 * @returns {string} Truncated string.
 */
function truncateInput(str) {
  if (typeof str !== 'string') return '';
  return str.slice(0, MAX_INPUT_LENGTH);
}

// ---- ZONE DATA (Req 2) ----
/** @type {Array<{id:string,name:string,threshold:number,current:number}>} */
const ZONES = [
  { id: 'gate-a', name: 'Gate A', threshold: 2500, current: 0 },
  { id: 'gate-b', name: 'Gate B', threshold: 2200, current: 0 },
  { id: 'gate-c', name: 'Gate C', threshold: 2000, current: 0 },
  { id: 'gate-d', name: 'Gate D', threshold: 2400, current: 0 },
  { id: 'sec-100', name: 'Section 100', threshold: 3500, current: 0 },
  { id: 'sec-114', name: 'Section 114', threshold: 3200, current: 0 },
  { id: 'sec-200', name: 'Section 200', threshold: 3800, current: 0 },
  { id: 'sec-300', name: 'Section 300', threshold: 3000, current: 0 },
  { id: 'conc-1', name: 'Concourse 1', threshold: 1800, current: 0 },
  { id: 'conc-2', name: 'Concourse 2', threshold: 1600, current: 0 },
  { id: 'food-court', name: 'Food Court', threshold: 1200, current: 0 },
  { id: 'vip-lounge', name: 'VIP Lounge', threshold: 500, current: 0 },
];

// ---- POINTS OF INTEREST (Req 1) ----
/** @type {Array<{name:string,icon:string,zone:string,dist:string}>} */
const POIS = [
  { name: 'Nearest Restroom', icon: '🚻', zone: 'Concourse 1', dist: '45m' },
  { name: 'Halal Food Stand', icon: '🍖', zone: 'Food Court', dist: '120m' },
  { name: 'First Aid Station', icon: '🏥', zone: 'Gate A', dist: '80m' },
  { name: 'Merchandise Store', icon: '🛍️', zone: 'Concourse 2', dist: '95m' },
  { name: 'Family Area', icon: '👨‍👩‍👧', zone: 'Section 100', dist: '150m' },
  { name: 'ATM / Cash Point', icon: '💳', zone: 'Gate B', dist: '110m' },
  { name: 'Prayer Room', icon: '🕌', zone: 'Concourse 1', dist: '130m' },
  { name: 'Lost & Found', icon: '📦', zone: 'Gate D', dist: '200m' },
];

// ---- ACCESSIBILITY INFRASTRUCTURE (Req 3) ----
/** @type {Array<{name:string,type:string,zone:string,status:string}>} */
const INFRA_ITEMS = [
  { name: 'Elevator E1', type: 'Elevator', zone: 'Gate A', status: 'Operational' },
  { name: 'Elevator E2', type: 'Elevator', zone: 'Gate C', status: 'Operational' },
  { name: 'Ramp R1', type: 'Wheelchair Ramp', zone: 'Gate B', status: 'Operational' },
  { name: 'Ramp R2', type: 'Wheelchair Ramp', zone: 'Concourse 1', status: 'Degraded' },
  { name: 'Restroom ACC-1', type: 'Accessible Restroom', zone: 'Concourse 2', status: 'Operational' },
  { name: 'Hearing Loop HL1', type: 'Hearing Loop', zone: 'Section 114', status: 'Operational' },
  { name: 'Elevator E3', type: 'Elevator', zone: 'VIP Lounge', status: 'Out of Service' },
  { name: 'Ramp R3', type: 'Wheelchair Ramp', zone: 'Gate D', status: 'Operational' },
];

// ---- TRANSPORT OPTIONS (Req 4) ----
/** @type {Array<{icon:string,name:string,detail:string,status:string,statusClass:string,eta:string,accessible:boolean}>} */
const TRANSPORT_OPTIONS = [
  { icon: '🚇', name: 'NJ Transit Rail', detail: 'Meadowlands Station → Penn Station · 22 min', status: 'On Time', statusClass: 'on-time', eta: '22 min', accessible: true },
  { icon: '🚌', name: 'FIFA Shuttle Bus', detail: 'Stadium Loop → Times Square · 35 min', status: 'On Time', statusClass: 'on-time', eta: '35 min', accessible: true },
  { icon: '🚕', name: 'Ride-Share (Uber/Lyft)', detail: 'Pickup Zone C · Surge 1.4x', status: 'Delayed', statusClass: 'delayed', eta: '12 min wait', accessible: false },
  { icon: '🅿️', name: 'Parking Lot A', detail: '85% full · Exit via Route 3 West', status: 'On Time', statusClass: 'on-time', eta: '5 min walk', accessible: true },
  { icon: '🚲', name: 'Bike Share Station', detail: 'Gate D · 8 bikes available', status: 'On Time', statusClass: 'on-time', eta: '2 min walk', accessible: false },
];

// ---- SUPPORTED LANGUAGES (Req 6 — 32 FIFA languages) ----
/** @type {string[]} */
const LANGUAGES = [
  'English','Spanish','French','Arabic','Portuguese','German','Japanese','Korean',
  'Mandarin','Hindi','Swahili','Italian','Dutch','Turkish','Persian','Polish',
  'Swedish','Norwegian','Danish','Finnish','Greek','Czech','Hungarian','Romanian',
  'Thai','Vietnamese','Indonesian','Malay','Bengali','Urdu','Hebrew','Russian',
];

// ---- INCIDENT TEMPLATES (Req 8) ----
/** @type {Array<{type:string,title:string,severity:string,zone:string,domain:string}>} */
const INCIDENT_TEMPLATES = [
  { type: 'Crowd', title: 'Zone overcrowding detected', severity: 'critical', zone: 'Gate A', domain: 'Crowd_Monitor' },
  { type: 'Medical', title: 'Medical assistance requested', severity: 'high', zone: 'Section 114', domain: 'Accessibility' },
  { type: 'Security', title: 'Unauthorized access attempt', severity: 'high', zone: 'VIP Lounge', domain: 'Security' },
  { type: 'Infrastructure', title: 'Elevator malfunction reported', severity: 'medium', zone: 'Gate C', domain: 'Accessibility' },
  { type: 'Transport', title: 'Shuttle service disruption', severity: 'medium', zone: 'Gate D', domain: 'Transport' },
  { type: 'Sustainability', title: 'Energy spike in HVAC system', severity: 'low', zone: 'Concourse 2', domain: 'Sustainability' },
  { type: 'Crowd', title: 'Exit blockage detected', severity: 'critical', zone: 'Gate B', domain: 'Crowd_Monitor' },
  { type: 'Safety', title: 'Wet floor hazard reported', severity: 'medium', zone: 'Concourse 1', domain: 'Safety' },
];

// ---- AI RECOMMENDATIONS (Req 8.1) ----
/** @type {Array<string[]>} */
const AI_RECOMMENDATIONS = [
  ['Open overflow area near Gate B to redistribute crowd flow', 'Redirect ingress through Gate D — currently at 45% capacity', 'Deploy 3 additional security personnel to Gate A perimeter', 'Activate digital signage to guide fans toward less congested routes', 'Consider temporary closure of Gate A entry for 10 minutes'],
  ['Dispatch medical team from First Aid Station (Gate A)', 'Clear path via Concourse 1 for emergency stretcher access', 'Notify nearest hospital — Hackensack University Medical Center', 'Request backup medical volunteer from Section 200 post', 'Document incident for post-event medical log'],
  ['Lock down VIP access points and verify all credentials', 'Review CCTV footage for Zone: VIP Lounge past 15 minutes', 'Deploy security team to intercept at nearest checkpoint', 'Alert VIP services coordinator', 'Escalate to tournament security operations center'],
  ['Activate backup elevator E2 for Gate C accessibility', 'Reroute wheelchair users to Ramp R1 at Gate B', 'Dispatch maintenance crew — ETA 12 minutes', 'Post temporary signage for alternate accessible route', 'Notify all active accessibility sessions of rerouting'],
];

// ---- BRIEFING TEMPLATES (Req 7.3 — auto-generated every 30 min) ----
/** @type {string[]} */
const BRIEFING_TEMPLATES = [
  `**Match Status:** USA vs Mexico — 67th minute, Score 2-1.\n\n**Crowd:** Total venue occupancy at 78%. Gate A nearing capacity (92%). Sections 100-200 stable at 70%. Post-match egress plan activated for contingency.\n\n**Incidents:** 2 active — 1 crowd alert (Gate A), 1 medical (Section 114, responding). No security escalations.\n\n**Transport:** NJ Transit running on schedule. Shuttle frequency doubled for post-match. Ride-share surge at 1.4x.\n\n**Sustainability:** Energy consumption 8% above baseline. Waste collection on schedule. Carbon offset tracking nominal.\n\n**Accessibility:** 12 active accessibility sessions. Elevator E3 out of service — rerouting active. All other infrastructure operational.`,
  `**Match Status:** USA vs Mexico — 72nd minute, Score 2-1.\n\n**Crowd:** Venue at 80%. Gate A reduced to 85% after overflow activation. Concourse 2 rising to 68%. Predicted surge at Gate B post-match.\n\n**Incidents:** 1 active (medical, Section 114 — resolved, monitoring). Gate A crowd alert downgraded.\n\n**Transport:** All services nominal. Post-match shuttle staging complete. Parking Lot A at 85%.\n\n**Sustainability:** HVAC energy spike resolved — now 4% above baseline. 2 waste bins at 80%+ in Food Court.\n\n**Accessibility:** 12 sessions active. E3 repair ETA 25 minutes. Hearing loop operational in all zones.`,
];

// ---- ECO RECOMMENDATIONS (Req 5.5) ----
/** @type {Array<{text:string,priority:string,saving:string}>} */
const ECO_RECOMMENDATIONS = [
  { text: 'Reduce Zone C HVAC consumption by 10% — dim lighting in unoccupied upper sections (Sections 300-350 currently at 12% occupancy)', priority: 'High', saving: '~45 kWh/hr' },
  { text: 'Redirect food court ventilation fans to eco-mode — current crowd density permits 60% airflow', priority: 'Medium', saving: '~22 kWh/hr' },
  { text: 'Deploy waste collection to Food Court bins 3, 7 — both at 87% capacity, projected overflow in 25 minutes', priority: 'High', saving: 'Waste overflow prevention' },
  { text: 'Switch VIP Lounge lighting to ambient mode post-halftime — reducing 340W LED array to 40%', priority: 'Low', saving: '~8 kWh/hr' },
  { text: 'Activate rainwater recycling system for post-match pitch irrigation instead of mains supply', priority: 'Medium', saving: '~2,400L water' },
];

// ---- SERVICE STATUS TRACKING (Req 7.1, 9.3) ----
/** @type {Array<{name:string,status:string,lastUpdate:Date|null,stale:boolean}>} */
const SERVICE_STATUS = [
  { name: 'Navigation_Service', status: 'Connected', lastUpdate: null, stale: false },
  { name: 'Crowd_Monitor', status: 'Connected', lastUpdate: null, stale: false },
  { name: 'Accessibility_Service', status: 'Connected', lastUpdate: null, stale: false },
  { name: 'Transport_Service', status: 'Connected', lastUpdate: null, stale: false },
  { name: 'Sustainability_Monitor', status: 'Connected', lastUpdate: null, stale: false },
  { name: 'Language_Service', status: 'Connected', lastUpdate: null, stale: false },
  { name: 'Decision_Engine', status: 'Connected', lastUpdate: null, stale: false },
];

// ---- AI PROVIDER STATUS (Req 9.3 — failover chain) ----
/** @type {{primary:string,secondary:string,tertiary:string,activeProv:string,availability:number,failCount:number}} */
const AI_PROVIDER = {
  primary: 'AWS Bedrock',
  secondary: 'Azure OpenAI',
  tertiary: 'OpenAI API',
  activeProv: 'AWS Bedrock',
  availability: 99.8,
  failCount: 0,
};

// ---- SIMULATION STATE ----
/** @type {object} */
const SimState = {
  matchMinute: 67,
  crowdHistory: [],
  energyHistory: [],
  incidents: [],
  alerts: [],
  auditLog: [],
  briefings: [],
  currentBriefingIdx: 0,
  langMessages: [],
  bridgeMessages: [],
  a11yMessages: [],
  userProfile: { accessibilityNeed: null },
  sentAlerts: {},
  sustainAlerts: [],
  lastZoneMetrics: {},
  actionedIncidents: {},
  /** @type {number|null} Tick interval ID */
  tickIntervalId: null,
  /** @type {number|null} Briefing interval ID */
  briefingIntervalId: null,
  /** @type {number|null} Incident interval ID */
  incidentIntervalId: null,
  /** @type {number} Tracks last render hash to avoid unnecessary re-renders */
  lastRenderHash: 0,
};

/**
 * Initialize all zone occupancy values with randomized starting levels.
 * Zones start between 50%–90% of their threshold capacity.
 */
function initZones() {
  ZONES.forEach(function(z) {
    z.current = Math.floor(z.threshold * (0.5 + Math.random() * 0.4));
  });
  SERVICE_STATUS.forEach(function(s) { s.lastUpdate = new Date(); });
}

/**
 * Run crowd management occupancy checks and alert routing (Req 2.2).
 * Prevents duplicate warnings unless occupancy drops below 75% first.
 */
function checkCrowdAlerts() {
  const now = new Date();
  ZONES.forEach(z => {
    const pct = z.current / z.threshold;
    const currentState = SimState.sentAlerts[z.id] || null;

    if (pct >= OCCUPANCY_CRITICAL_PCT) {
      if (currentState !== 'critical') {
        SimState.sentAlerts[z.id] = 'critical';
        const alertText = `🚨 CRITICAL: ${z.name} occupancy is at ${Math.round(pct * 100)}% — immediate evacuation/redirect required.`;
        SimState.alerts.unshift({ id: `crowd-crit-${z.id}`, text: alertText, cls: 'critical', time: now });
        addAuditEntry('Crowd_Monitor', 'Critical Alert', z.name, alertText);
      }
    } else if (pct >= OCCUPANCY_WARNING_PCT) {
      if (!currentState) {
        SimState.sentAlerts[z.id] = 'warning';
        const alertText = `⚠️ WARNING: ${z.name} occupancy is at ${Math.round(pct * 100)}% — approaching threshold.`;
        SimState.alerts.unshift({ id: `crowd-warn-${z.id}`, text: alertText, cls: '', time: now });
        addAuditEntry('Crowd_Monitor', 'Warning Alert', z.name, alertText);
      }
    } else if (pct < 0.75) {
      if (currentState) {
        delete SimState.sentAlerts[z.id];
        addAuditEntry('Crowd_Monitor', 'Alert Recovery', z.name, `Occupancy recovered below 75% (${Math.round(pct * 100)}%)`);
      }
    }
  });
}

/**
 * Run sustainability metrics validation checks (Req 5.3, 5.6, 5.7).
 * Monitors zone energy, waste bin capacity, and sensor status.
 */
function checkSustainabilityMetrics() {
  const now = new Date();
  
  // 1. Energy monitoring
  ZONES.forEach(z => {
    const baseline = Math.floor(z.threshold * 0.8);
    const currentEnergy = Math.floor(z.current * 0.9);
    const excessPct = ((currentEnergy - baseline) / baseline) * 100;
    
    if (excessPct >= 20) {
      const alertId = `sustain-energy-${z.id}`;
      if (!SimState.sustainAlerts.some(a => a.id === alertId)) {
        SimState.sustainAlerts.unshift({
          id: alertId,
          type: 'energy',
          text: `⚠️ Energy consumption in ${z.name} is ${Math.round(excessPct)}% above baseline — Alert delivered to Staff-A`,
          time: now,
          status: 'Assigned',
          assignedTo: 'Staff-A',
          escalated: false
        });
        addAuditEntry('System', 'Energy Alert', z.name, `Energy consumption ${Math.round(excessPct)}% above baseline`);
      } else {
        // Escalate after 10s (simulating 5 minutes SLA in fast simulation mode)
        const alert = SimState.sustainAlerts.find(a => a.id === alertId);
        if (alert && alert.status === 'Assigned' && (now - alert.time) >= 10000 && !alert.escalated) {
          alert.escalated = true;
          alert.text = `🚨 ESCALATED: Energy consumption in ${z.name} is ${Math.round(excessPct)}% above baseline — Staff-A unreachable. Escalated to Venue Supervisor.`;
          addAuditEntry('System', 'Energy Escalation', z.name, 'Staff-A unreachable, escalated to Supervisor');
        }
      }
    }
  });

  // 2. Waste monitoring (high traffic zones: Food Court, Gate A)
  const highTraffic = ['food-court', 'gate-a'];
  highTraffic.forEach(zoneId => {
    const z = ZONES.find(x => x.id === zoneId);
    if (z) {
      // Simulate waste levels rising with occupancy
      const wastePct = Math.min(100, Math.round((z.current / z.threshold) * 110));
      if (wastePct >= 90) {
        const alertId = `sustain-waste-${z.id}`;
        if (!SimState.sustainAlerts.some(a => a.id === alertId)) {
          SimState.sustainAlerts.unshift({
            id: alertId,
            type: 'waste',
            text: `⚠️ Waste bin in ${z.name} is at ${wastePct}% capacity — Assigned to Staff-B`,
            time: now,
            status: 'Assigned',
            assignedTo: 'Staff-B',
            escalated: false
          });
          addAuditEntry('System', 'Waste Alert', z.name, `Waste bin at ${wastePct}% capacity`);
        } else {
          const alert = SimState.sustainAlerts.find(a => a.id === alertId);
          if (alert && alert.status === 'Assigned' && (now - alert.time) >= 10000 && !alert.escalated) {
            alert.escalated = true;
            alert.text = `🚨 ESCALATED: Waste bin in ${z.name} at ${wastePct}% capacity — Staff-B unavailable. Escalated to Zone Supervisor.`;
            addAuditEntry('System', 'Waste Escalation', z.name, 'Staff-B unavailable, escalated to Supervisor');
          }
        }
      }
    }
  });

  // 3. IoT sensor staleness monitoring (simulate occasional sensor missed intervals)
  SERVICE_STATUS.forEach(s => {
    if (s.name === 'Sustainability_Monitor' && Math.random() < 0.15) {
      s.stale = true;
      const alertId = 'sustain-sensor-stale';
      if (!SimState.sustainAlerts.some(a => a.id === alertId)) {
        SimState.sustainAlerts.unshift({
          id: alertId,
          type: 'sensor',
          text: `⚠️ IoT Sensor SN-842 in Concourse 2 failed to report for 2 intervals — Staleness indicator active`,
          time: now,
          status: 'Active',
          escalated: false
        });
        addAuditEntry('System', 'Sensor Staleness', 'Concourse 2', 'Sensor SN-842 inactive for 2 intervals');
      }
    }
  });
}

/**
 * Simulate one tick of zone occupancy changes.
 * Each zone randomly increases or decreases slightly, clamped to safe bounds.
 */
function tickZones() {
  ZONES.forEach(function(z) {
    const delta = Math.floor((Math.random() - ZONE_TICK_BIAS) * z.threshold * ZONE_TICK_DELTA_FACTOR);
    z.current = Math.max(ZONE_MIN_OCCUPANCY, Math.min(z.threshold * ZONE_OVERSHOOT_MULTIPLIER, z.current + delta));
  });
  // Update service timestamps
  SERVICE_STATUS.forEach(function(s) { s.lastUpdate = new Date(); s.stale = false; });

  // Run dynamic validation checks
  checkCrowdAlerts();
  checkSustainabilityMetrics();
}

/**
 * Generate initial seed incidents for the simulation.
 * Creates 3 incidents: 2 active and 1 resolved.
 */
function initIncidents() {
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const t = INCIDENT_TEMPLATES[i];
    SimState.incidents.push({
      id: 'INC-' + (1001 + i),
      type: t.type,
      title: t.title,
      severity: t.severity,
      zone: t.zone,
      domain: t.domain,
      time: new Date(now - (10 - i * 3) * 60000),
      status: i === 2 ? 'Resolved' : 'Active',
      recommendations: AI_RECOMMENDATIONS[i] || AI_RECOMMENDATIONS[0],
      confidences: [0.92, 0.87, 0.78, 0.65, 0.51],
    });
  }
}

/**
 * Add an entry to the audit trail log. Enforces FIFO eviction at max size.
 * All entries are sanitized before storage.
 * @param {string} user — The actor (e.g., 'Staff-042', 'System').
 * @param {string} action — The action performed.
 * @param {string} zone — The affected zone.
 * @param {string} details — Additional context.
 */
function addAuditEntry(user, action, zone, details) {
  SimState.auditLog.unshift({
    time: new Date(),
    user: sanitizeHTML(truncateInput(String(user))),
    action: sanitizeHTML(truncateInput(String(action))),
    zone: sanitizeHTML(truncateInput(String(zone))),
    details: sanitizeHTML(truncateInput(String(details))),
  });

  if (SimState.auditLog.length > MAX_AUDIT_LOG_ENTRIES) {
    SimState.auditLog.pop();
  }
}

/**
 * Format a Date object as a full time string (HH:MM:SS AM/PM).
 * @param {Date} d — The date to format.
 * @returns {string} Formatted time string.
 */
function formatTime(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) return '--:--:--';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Format a Date object as a short time string (HH:MM AM/PM).
 * @param {Date} d — The date to format.
 * @returns {string} Formatted short time string.
 */
function formatTimeShort(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Compute the occupancy percentage for a given zone.
 * @param {{current:number,threshold:number}} zone — The zone object.
 * @returns {number} Occupancy percentage (0–105+).
 */
function getZoneOccupancyPct(zone) {
  if (!zone || zone.threshold <= 0) return 0;
  return Math.round(zone.current / zone.threshold * 100);
}

/**
 * Get the average occupancy percentage across all zones.
 * @returns {number} Average occupancy percentage.
 */
function getAvgOccupancy() {
  if (ZONES.length === 0) return 0;
  const total = ZONES.reduce(function(s, z) { return s + z.current / z.threshold; }, 0);
  return Math.round(total / ZONES.length * 100);
}

/**
 * Detect cross-domain incidents (Req 8.2).
 * Returns incidents that affect 2+ operational domains.
 * @returns {Array} Cross-domain incident groups.
 */
function detectCrossDomainIncidents() {
  const active = SimState.incidents.filter(function(i) { return i.status === 'Active'; });
  const domainMap = {};
  active.forEach(function(inc) {
    if (!domainMap[inc.zone]) domainMap[inc.zone] = [];
    domainMap[inc.zone].push(inc);
  });
  const crossDomain = [];
  Object.keys(domainMap).forEach(function(zone) {
    const domains = new Set(domainMap[zone].map(function(i) { return i.domain; }));
    if (domains.size >= 2) {
      crossDomain.push({ zone: zone, incidents: domainMap[zone], domains: Array.from(domains) });
    }
  });
  return crossDomain;
}
