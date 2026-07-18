/* ============================================================
   Smart Stadium Operations — Data & Simulation Engine
   ============================================================ */

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

const TRANSPORT_OPTIONS = [
  { icon: '🚇', name: 'NJ Transit Rail', detail: 'Meadowlands Station → Penn Station · 22 min', status: 'On Time', statusClass: 'on-time', eta: '22 min', accessible: true },
  { icon: '🚌', name: 'FIFA Shuttle Bus', detail: 'Stadium Loop → Times Square · 35 min', status: 'On Time', statusClass: 'on-time', eta: '35 min', accessible: true },
  { icon: '🚕', name: 'Ride-Share (Uber/Lyft)', detail: 'Pickup Zone C · Surge 1.4x', status: 'Delayed', statusClass: 'delayed', eta: '12 min wait', accessible: false },
  { icon: '🅿️', name: 'Parking Lot A', detail: '85% full · Exit via Route 3 West', status: 'On Time', statusClass: 'on-time', eta: '5 min walk', accessible: true },
  { icon: '🚲', name: 'Bike Share Station', detail: 'Gate D · 8 bikes available', status: 'On Time', statusClass: 'on-time', eta: '2 min walk', accessible: false },
];

const LANGUAGES = [
  'English','Spanish','French','Arabic','Portuguese','German','Japanese','Korean',
  'Mandarin','Hindi','Swahili','Italian','Dutch','Turkish','Persian','Polish',
  'Swedish','Norwegian','Danish','Finnish','Greek','Czech','Hungarian','Romanian',
  'Thai','Vietnamese','Indonesian','Malay','Bengali','Urdu','Hebrew','Russian',
];

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

const AI_RECOMMENDATIONS = [
  ['Open overflow area near Gate B to redistribute crowd flow', 'Redirect ingress through Gate D — currently at 45% capacity', 'Deploy 3 additional security personnel to Gate A perimeter', 'Activate digital signage to guide fans toward less congested routes', 'Consider temporary closure of Gate A entry for 10 minutes'],
  ['Dispatch medical team from First Aid Station (Gate A)', 'Clear path via Concourse 1 for emergency stretcher access', 'Notify nearest hospital — Hackensack University Medical Center', 'Request backup medical volunteer from Section 200 post', 'Document incident for post-event medical log'],
  ['Lock down VIP access points and verify all credentials', 'Review CCTV footage for Zone: VIP Lounge past 15 minutes', 'Deploy security team to intercept at nearest checkpoint', 'Alert VIP services coordinator', 'Escalate to tournament security operations center'],
  ['Activate backup elevator E2 for Gate C accessibility', 'Reroute wheelchair users to Ramp R1 at Gate B', 'Dispatch maintenance crew — ETA 12 minutes', 'Post temporary signage for alternate accessible route', 'Notify all active accessibility sessions of rerouting'],
];

const BRIEFING_TEMPLATES = [
  `**Match Status:** USA vs Mexico — 67th minute, Score 2-1.\n\n**Crowd:** Total venue occupancy at 78%. Gate A nearing capacity (92%). Sections 100-200 stable at 70%. Post-match egress plan activated for contingency.\n\n**Incidents:** 2 active — 1 crowd alert (Gate A), 1 medical (Section 114, responding). No security escalations.\n\n**Transport:** NJ Transit running on schedule. Shuttle frequency doubled for post-match. Ride-share surge at 1.4x.\n\n**Sustainability:** Energy consumption 8% above baseline. Waste collection on schedule. Carbon offset tracking nominal.\n\n**Accessibility:** 12 active accessibility sessions. Elevator E3 out of service — rerouting active. All other infrastructure operational.`,

  `**Match Status:** USA vs Mexico — 72nd minute, Score 2-1.\n\n**Crowd:** Venue at 80%. Gate A reduced to 85% after overflow activation. Concourse 2 rising to 68%. Predicted surge at Gate B post-match.\n\n**Incidents:** 1 active (medical, Section 114 — resolved, monitoring). Gate A crowd alert downgraded.\n\n**Transport:** All services nominal. Post-match shuttle staging complete. Parking Lot A at 85%.\n\n**Sustainability:** HVAC energy spike resolved — now 4% above baseline. 2 waste bins at 80%+ in Food Court.\n\n**Accessibility:** 12 sessions active. E3 repair ETA 25 minutes. Hearing loop operational in all zones.`,
];

const ECO_RECOMMENDATIONS = [
  { text: 'Reduce Zone C HVAC consumption by 10% — dim lighting in unoccupied upper sections (Sections 300-350 currently at 12% occupancy)', priority: 'High', saving: '~45 kWh/hr' },
  { text: 'Redirect food court ventilation fans to eco-mode — current crowd density permits 60% airflow', priority: 'Medium', saving: '~22 kWh/hr' },
  { text: 'Deploy waste collection to Food Court bins 3, 7 — both at 87% capacity, projected overflow in 25 minutes', priority: 'High', saving: 'Waste overflow prevention' },
  { text: 'Switch VIP Lounge lighting to ambient mode post-halftime — reducing 340W LED array to 40%', priority: 'Low', saving: '~8 kWh/hr' },
  { text: 'Activate rainwater recycling system for post-match pitch irrigation instead of mains supply', priority: 'Medium', saving: '~2,400L water' },
];

// Simulation state
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
};

// Initialize zone occupancy
function initZones() {
  ZONES.forEach(z => {
    z.current = Math.floor(z.threshold * (0.5 + Math.random() * 0.4));
  });
}

// Simulate zone occupancy changes
function tickZones() {
  ZONES.forEach(z => {
    const delta = Math.floor((Math.random() - 0.45) * z.threshold * 0.05);
    z.current = Math.max(50, Math.min(z.threshold * 1.05, z.current + delta));
  });
}

// Generate initial incidents
function initIncidents() {
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const t = INCIDENT_TEMPLATES[i];
    SimState.incidents.push({
      id: `INC-${1001 + i}`,
      ...t,
      time: new Date(now - (10 - i * 3) * 60000),
      status: i === 2 ? 'Resolved' : 'Active',
      recommendations: AI_RECOMMENDATIONS[i] || AI_RECOMMENDATIONS[0],
      confidences: [0.92, 0.87, 0.78, 0.65, 0.51],
    });
  }
}

function addAuditEntry(user, action, zone, details) {
  SimState.auditLog.unshift({
    time: new Date(),
    user, action, zone, details,
  });
  if (SimState.auditLog.length > 50) SimState.auditLog.pop();
}

function formatTime(d) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatTimeShort(d) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
