/* ============================================================
   Smart Stadium Operations — Comprehensive Test Suite
   FIFA World Cup 2026 · GenAI-Enabled Platform
   ============================================================
   Tests cover: Data Layer, Security, Accessibility, Efficiency,
   all 9 requirement domains, and edge cases.
   ============================================================ */
'use strict';

const testResults = { passed: 0, failed: 0, total: 0, details: [] };

function assert(condition, testName) {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    testResults.details.push({ name: testName, status: 'PASS' });
  } else {
    testResults.failed++;
    testResults.details.push({ name: testName, status: 'FAIL' });
    console.error('FAIL: ' + testName);
  }
}

function assertEqual(actual, expected, testName) {
  assert(actual === expected, testName + ' (expected: ' + expected + ', got: ' + actual + ')');
}

function assertContains(str, substr, testName) {
  assert(typeof str === 'string' && str.includes(substr), testName);
}

function runAllTests() {
  // ========== DATA LAYER TESTS ==========
  // Constants
  assert(typeof MAX_AUDIT_LOG_ENTRIES === 'number' && MAX_AUDIT_LOG_ENTRIES === 50, 'MAX_AUDIT_LOG_ENTRIES is 50');
  assert(typeof OCCUPANCY_WARNING_PCT === 'number' && OCCUPANCY_WARNING_PCT === 0.80, 'OCCUPANCY_WARNING_PCT is 0.80');
  assert(typeof OCCUPANCY_CRITICAL_PCT === 'number' && OCCUPANCY_CRITICAL_PCT === 1.00, 'OCCUPANCY_CRITICAL_PCT is 1.00');
  assert(typeof CONFIDENCE_THRESHOLD === 'number' && CONFIDENCE_THRESHOLD === 0.70, 'CONFIDENCE_THRESHOLD is 0.70');
  assert(typeof TRANSLATION_CONFIDENCE_THRESHOLD === 'number', 'TRANSLATION_CONFIDENCE_THRESHOLD exists');
  assert(typeof MAX_INPUT_LENGTH === 'number' && MAX_INPUT_LENGTH === 500, 'MAX_INPUT_LENGTH is 500');
  assert(typeof ENERGY_BASELINE_KWH === 'number' && ENERGY_BASELINE_KWH === 2740, 'ENERGY_BASELINE_KWH is 2740');

  // Zone data
  assertEqual(ZONES.length, 12, 'ZONES has 12 entries');
  assert(ZONES.every(function(z) { return z.id && z.name && z.threshold > 0; }), 'All zones have valid id, name, threshold');

  // Zone initialization
  initZones();
  assert(ZONES.every(function(z) { return z.current > 0 && z.current <= z.threshold; }), 'initZones sets occupancy within [0, threshold]');

  // Zone tick simulation
  const prevValues = ZONES.map(function(z) { return z.current; });
  tickZones();
  assert(ZONES.every(function(z) { return z.current >= ZONE_MIN_OCCUPANCY; }), 'tickZones respects ZONE_MIN_OCCUPANCY floor');
  assert(ZONES.every(function(z) { return z.current <= z.threshold * ZONE_OVERSHOOT_MULTIPLIER; }), 'tickZones respects ZONE_OVERSHOOT_MULTIPLIER ceiling');

  // POIs
  assertEqual(POIS.length, 8, 'POIS has 8 entries');
  assert(POIS.every(function(p) { return p.name && p.icon && p.zone && p.dist; }), 'All POIs have required fields');

  // Infrastructure items (Req 3.2)
  assertEqual(INFRA_ITEMS.length, 8, 'INFRA_ITEMS has 8 entries');
  assert(INFRA_ITEMS.every(function(i) { return ['Operational','Degraded','Out of Service'].includes(i.status); }), 'All infrastructure statuses are valid');
  assert(INFRA_ITEMS.some(function(i) { return i.status === 'Degraded'; }), 'At least one degraded infrastructure item');
  assert(INFRA_ITEMS.some(function(i) { return i.status === 'Out of Service'; }), 'At least one out-of-service infrastructure item');

  // Transport options (Req 4)
  assertEqual(TRANSPORT_OPTIONS.length, 5, 'TRANSPORT_OPTIONS has 5 entries');
  assert(TRANSPORT_OPTIONS.some(function(t) { return t.accessible === true; }), 'Some transport options are accessible');
  assert(TRANSPORT_OPTIONS.some(function(t) { return t.accessible === false; }), 'Some transport options are not accessible');

  // Languages (Req 6.1)
  assertEqual(LANGUAGES.length, 32, 'LANGUAGES has 32 entries (FIFA requirement)');
  assertContains(LANGUAGES.join(','), 'English', 'Languages include English');
  assertContains(LANGUAGES.join(','), 'Spanish', 'Languages include Spanish');
  assertContains(LANGUAGES.join(','), 'Arabic', 'Languages include Arabic');

  // Incident templates (Req 8)
  assert(INCIDENT_TEMPLATES.length >= 5, 'At least 5 incident templates');
  assert(INCIDENT_TEMPLATES.every(function(t) { return t.type && t.title && t.severity && t.zone && t.domain; }), 'All incident templates have required fields');

  // AI Recommendations (Req 8.1)
  assert(AI_RECOMMENDATIONS.length >= 3, 'At least 3 recommendation sets');
  assert(AI_RECOMMENDATIONS.every(function(r) { return r.length === 5; }), 'Each recommendation set has exactly 5 actions');

  // Briefing templates (Req 7.3)
  assert(BRIEFING_TEMPLATES.length >= 2, 'At least 2 briefing templates');

  // Eco recommendations (Req 5.5)
  assert(ECO_RECOMMENDATIONS.length >= 3, 'At least 3 eco-recommendations');
  assert(ECO_RECOMMENDATIONS.every(function(r) { return r.text && r.priority && r.saving; }), 'All eco-recs have text, priority, saving');

  // Service status tracking (Req 7.1)
  assertEqual(SERVICE_STATUS.length, 7, 'SERVICE_STATUS tracks 7 services');
  assert(SERVICE_STATUS.every(function(s) { return s.name && s.status; }), 'All services have name and status');

  // AI Provider (Req 9.3)
  assert(typeof AI_PROVIDER === 'object', 'AI_PROVIDER exists');
  assertContains(AI_PROVIDER.primary, 'AWS', 'Primary provider is AWS Bedrock');
  assertContains(AI_PROVIDER.secondary, 'Azure', 'Secondary provider is Azure OpenAI');

  // ========== SECURITY TESTS ==========
  // Sanitize HTML
  assertEqual(sanitizeHTML('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;', 'sanitizeHTML escapes script tags');
  assertEqual(sanitizeHTML('Hello & "World"'), 'Hello &amp; &quot;World&quot;', 'sanitizeHTML escapes special characters');
  assertEqual(sanitizeHTML('<img onerror=alert(1)>'), '&lt;img onerror=alert(1)&gt;', 'sanitizeHTML escapes img onerror');
  assertEqual(sanitizeHTML("It's"), "It&#039;s", 'sanitizeHTML escapes single quotes');
  assertEqual(sanitizeHTML(''), '', 'sanitizeHTML handles empty string');
  assertEqual(sanitizeHTML(null), '', 'sanitizeHTML handles null');
  assertEqual(sanitizeHTML(undefined), '', 'sanitizeHTML handles undefined');
  assertEqual(sanitizeHTML(123), '', 'sanitizeHTML handles number input');

  // Truncate input
  assertEqual(truncateInput('short'), 'short', 'truncateInput preserves short strings');
  const longInput = 'a'.repeat(600);
  assertEqual(truncateInput(longInput).length, MAX_INPUT_LENGTH, 'truncateInput truncates to MAX_INPUT_LENGTH');
  assertEqual(truncateInput(null), '', 'truncateInput handles null');
  assertEqual(truncateInput(undefined), '', 'truncateInput handles undefined');

  // ========== INCIDENT MANAGEMENT TESTS ==========
  // Reset incidents
  SimState.incidents = [];
  initIncidents();
  assertEqual(SimState.incidents.length, 3, 'initIncidents creates 3 incidents');
  assert(SimState.incidents.some(function(i) { return i.status === 'Active'; }), 'Some incidents are Active');
  assert(SimState.incidents.some(function(i) { return i.status === 'Resolved'; }), 'Some incidents are Resolved');
  assert(SimState.incidents.every(function(i) { return i.id && i.title && i.severity && i.zone; }), 'All incidents have required fields');
  assert(SimState.incidents.every(function(i) { return i.recommendations && i.recommendations.length === 5; }), 'All incidents have 5 recommendations');
  assert(SimState.incidents.every(function(i) { return i.confidences && i.confidences.length === 5; }), 'All incidents have 5 confidence scores');

  // Confidence threshold (Req 8.5)
  const lowConfIncident = SimState.incidents[0];
  const belowThreshold = lowConfIncident.confidences.filter(function(c) { return c < CONFIDENCE_THRESHOLD; });
  assert(belowThreshold.length > 0, 'Some confidence scores are below threshold (require human review)');

  // ========== AUDIT LOG TESTS ==========
  SimState.auditLog = [];
  addAuditEntry('TestUser', 'TestAction', 'TestZone', 'TestDetails');
  assertEqual(SimState.auditLog.length, 1, 'addAuditEntry adds entry');
  assertEqual(SimState.auditLog[0].user, 'TestUser', 'Audit entry has correct user');
  assertEqual(SimState.auditLog[0].action, 'TestAction', 'Audit entry has correct action');

  // FIFO eviction
  SimState.auditLog = [];
  for (let i = 0; i < 55; i++) { addAuditEntry('User' + i, 'Action', 'Zone', 'Details'); }
  assertEqual(SimState.auditLog.length, MAX_AUDIT_LOG_ENTRIES, 'Audit log respects MAX_AUDIT_LOG_ENTRIES limit');

  // XSS prevention in audit entries
  SimState.auditLog = [];
  addAuditEntry('<script>alert(1)</script>', 'Test', 'Zone', 'Details');
  assert(!SimState.auditLog[0].user.includes('<script>'), 'Audit entry sanitizes user field');

  // ========== TIME FORMATTING TESTS ==========
  const testDate = new Date('2026-07-18T14:30:45');
  assert(typeof formatTime(testDate) === 'string' && formatTime(testDate).length > 0, 'formatTime returns non-empty string');
  assert(typeof formatTimeShort(testDate) === 'string' && formatTimeShort(testDate).length > 0, 'formatTimeShort returns non-empty string');
  assertEqual(formatTime('not a date'), '--:--:--', 'formatTime handles invalid input');
  assertEqual(formatTimeShort(null), '--:--', 'formatTimeShort handles null');
  assertEqual(formatTime(new Date('invalid')), '--:--:--', 'formatTime handles NaN date');

  // ========== ZONE OCCUPANCY HELPER TESTS ==========
  const testZone = { current: 2000, threshold: 2500 };
  assertEqual(getZoneOccupancyPct(testZone), 80, 'getZoneOccupancyPct calculates 80%');
  assertEqual(getZoneOccupancyPct({ current: 0, threshold: 100 }), 0, 'getZoneOccupancyPct handles 0%');
  assertEqual(getZoneOccupancyPct({ current: 100, threshold: 100 }), 100, 'getZoneOccupancyPct handles 100%');
  assertEqual(getZoneOccupancyPct(null), 0, 'getZoneOccupancyPct handles null');
  assertEqual(getZoneOccupancyPct({ current: 50, threshold: 0 }), 0, 'getZoneOccupancyPct handles zero threshold');

  // Average occupancy
  assert(typeof getAvgOccupancy() === 'number', 'getAvgOccupancy returns number');
  assert(getAvgOccupancy() >= 0 && getAvgOccupancy() <= 105, 'getAvgOccupancy within reasonable range');

  // ========== CROSS-DOMAIN DETECTION TESTS (Req 8.2) ==========
  assert(typeof detectCrossDomainIncidents === 'function', 'detectCrossDomainIncidents function exists');
  const crossDomain = detectCrossDomainIncidents();
  assert(Array.isArray(crossDomain), 'detectCrossDomainIncidents returns array');

  // ========== RENDER HELPER TESTS ==========
  assert(typeof buildStatCard === 'function', 'buildStatCard function exists');
  const card = buildStatCard('blue', 'Test Label', '42', 'Test change');
  assertContains(card, 'stat-card', 'buildStatCard produces stat-card class');
  assertContains(card, 'blue', 'buildStatCard includes color class');
  assertContains(card, 'Test Label', 'buildStatCard includes label');
  assertContains(card, '42', 'buildStatCard includes value');

  assert(typeof buildAlertItem === 'function', 'buildAlertItem function exists');
  const alert = buildAlertItem('12:00', 'Test alert', 'critical');
  assertContains(alert, 'alert-item', 'buildAlertItem produces alert-item class');
  assertContains(alert, 'critical', 'buildAlertItem includes CSS class');

  // ========== SIMULATION STATE TESTS ==========
  assert(typeof SimState === 'object', 'SimState exists');
  assert(Array.isArray(SimState.incidents), 'SimState.incidents is array');
  assert(Array.isArray(SimState.auditLog), 'SimState.auditLog is array');
  assert(typeof SimState.matchMinute === 'number', 'SimState.matchMinute is number');
  assert(typeof SimState.currentBriefingIdx === 'number', 'SimState.currentBriefingIdx is number');

  // ========== PROBLEM STATEMENT ALIGNMENT TESTS ==========
  // Req 1: Fan Navigation
  assert(typeof window.StadiumApp.generateRoute === 'function', 'Req 1: generateRoute function exists');
  assert(POIS.length >= 5, 'Req 1: Sufficient POIs for navigation');

  // Req 2: Crowd Management
  assert(OCCUPANCY_WARNING_PCT === 0.80, 'Req 2: Warning threshold at 80%');
  assert(OCCUPANCY_CRITICAL_PCT === 1.00, 'Req 2: Critical threshold at 100%');
  assert(ZONES.length >= 10, 'Req 2: Sufficient zones for crowd monitoring');

  // Req 3: Accessibility
  assert(typeof window.StadiumApp.sendA11yChat === 'function', 'Req 3: Accessibility chat function exists');
  assert(INFRA_ITEMS.some(function(i) { return i.type === 'Wheelchair Ramp'; }), 'Req 3: Wheelchair ramps tracked');
  assert(INFRA_ITEMS.some(function(i) { return i.type === 'Elevator'; }), 'Req 3: Elevators tracked');
  assert(INFRA_ITEMS.some(function(i) { return i.type === 'Hearing Loop'; }), 'Req 3: Hearing loops tracked');
  assert(INFRA_ITEMS.some(function(i) { return i.type === 'Accessible Restroom'; }), 'Req 3: Accessible restrooms tracked');

  // Req 4: Transportation
  assert(typeof window.StadiumApp.planJourney === 'function', 'Req 4: planJourney function exists');
  assert(TRANSPORT_OPTIONS.some(function(t) { return t.accessible; }), 'Req 4: Accessible transport options exist');

  // Req 5: Sustainability
  assert(ECO_RECOMMENDATIONS.length >= 2, 'Req 5: AI eco-recommendations generated');
  assert(ECO_RECOMMENDATIONS.some(function(r) { return r.saving.includes('kWh'); }), 'Req 5: Energy saving recommendations');

  // Req 6: Multilingual
  assert(typeof window.StadiumApp.sendLangChat === 'function', 'Req 6: Translation chat function exists');
  assert(typeof window.StadiumApp.sendBridgeChat === 'function', 'Req 6: Bridge chat function exists');
  assertEqual(LANGUAGES.length, 32, 'Req 6: 32 FIFA languages supported');

  // Req 7: Operational Intelligence
  assert(typeof window.StadiumApp.opsQuery === 'function', 'Req 7: Natural language query function exists');
  assert(BRIEFING_TEMPLATES.length >= 2, 'Req 7: Auto-generated briefings available');
  assert(SERVICE_STATUS.length === 7, 'Req 7: All 7 data sources tracked');

  // Req 8: Decision Engine
  assert(typeof window.StadiumApp.resolveIncident === 'function', 'Req 8: resolveIncident function exists');
  assert(CONFIDENCE_THRESHOLD === 0.70, 'Req 8: Confidence threshold set at 0.7');
  assert(AI_RECOMMENDATIONS.every(function(r) { return r.length <= 5; }), 'Req 8: Up to 5 recommendations per incident');

  // Req 9: AI Infrastructure
  assert(AI_PROVIDER.primary.includes('AWS'), 'Req 9: Primary on AWS Bedrock (non-GCP)');
  assert(AI_PROVIDER.secondary.includes('Azure'), 'Req 9: Failover to Azure OpenAI');
  assert(AI_PROVIDER.availability >= 99.5, 'Req 9: AI availability target >= 99.5%');

  // ========== ACCESSIBILITY DOM TESTS ==========
  assert(document.getElementById('skipLink') !== null, 'A11y: Skip-to-content link exists');
  assert(document.querySelector('[role="navigation"]') !== null, 'A11y: Navigation role exists');
  assert(document.querySelector('[role="main"]') !== null, 'A11y: Main role exists');
  assert(document.querySelectorAll('[aria-label]').length >= 20, 'A11y: Sufficient ARIA labels');
  assert(document.querySelectorAll('[aria-live]').length >= 5, 'A11y: Live regions for dynamic content');
  assert(document.querySelectorAll('label').length >= 5, 'A11y: Form labels present');
  assert(document.querySelectorAll('[role="log"]').length >= 2, 'A11y: Chat panels have log role');
  assert(document.querySelector('.sr-only') !== null, 'A11y: Screen reader only class used');

  // Table accessibility
  assert(document.querySelectorAll('th[scope="col"]').length >= 5, 'A11y: Table headers have scope');

  // Focus management
  const focusableH1s = document.querySelectorAll('h1[tabindex="-1"]');
  assert(focusableH1s.length >= 5, 'A11y: Page headings are programmatically focusable');

  // ========== SECURITY DOM TESTS ==========
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  assert(cspMeta !== null, 'Security: CSP meta tag present');
  const noSniff = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
  assert(noSniff !== null, 'Security: X-Content-Type-Options meta present');
  const chartScript = document.querySelector('script[crossorigin]');
  assert(chartScript !== null, 'Security: CDN script has crossorigin attribute');
  assert(document.querySelectorAll('input[maxlength]').length >= 5, 'Security: Inputs have maxlength');

  // ========== DYNAMIC OPTIMIZATION TESTS (NEW) ==========
  // 1. Accessibility accommodations (Req 3)
  window.StadiumApp.registerA11yNeed('mobility');
  assertEqual(SimState.userProfile.accessibilityNeed, 'mobility', 'Accommodation need registers mobility');
  const a11yToggle = document.getElementById('accessibleRouteToggle');
  assertEqual(a11yToggle.classList.contains('on'), true, 'Mobility registration auto-enables accessible routing toggle');

  // 2. Congestion route recalculation & local waiting (Req 1.3)
  SimState.currentZone = 'Gate B';
  document.getElementById('navSearchInput').value = 'Nearest Restroom';
  window.StadiumApp.generateRoute();
  
  // Set Concourse 1 occupancy high (>=80%) to trigger congestion recalculation
  const concourse1 = ZONES.find(z => z.name === 'Concourse 1');
  const originalOcc = concourse1.current;
  concourse1.current = Math.round(concourse1.threshold * 0.85);
  checkRouteCongestion();
  const routeEl = document.getElementById('navRouteResult');
  assertContains(routeEl.innerHTML, 'Bypassing congested Concourse 1/2', 'Bypasses congested zones automatically');

  // Set alternate path zone VIP Lounge high as well (>=80%)
  const vipL = ZONES.find(z => z.name === 'VIP Lounge');
  const originalVipOcc = vipL.current;
  vipL.current = Math.round(vipL.threshold * 0.90);
  checkRouteCongestion();
  assertContains(routeEl.innerHTML, 'recommends waiting at your current location', 'Recommends waiting if all options are congested');
  
  // Restore occupancy back to safe levels
  concourse1.current = originalOcc;
  vipL.current = originalVipOcc;

  // 3. Transport Disruption alternative options (Req 4.5)
  window.StadiumApp.selectTransit('NJ Transit Rail');
  assertEqual(SimState.selectedTransport, 'NJ Transit Rail', 'Transit option selection works');
  
  const njTransit = TRANSPORT_OPTIONS.find(t => t.name === 'NJ Transit Rail');
  const origNjtStatus = njTransit.status;
  njTransit.status = 'Delayed';
  checkTransportStatus();
  const transportRecs = document.getElementById('departureRecs');
  assertContains(transportRecs.innerHTML, 'Transport Disruption Alternative Routing Plan', 'Disruption alert is generated with alternative routes');
  njTransit.status = origNjtStatus;

  // 4. Decision Engine feedback loop >10% metric shift (Req 8.3)
  const testInc = SimState.incidents.find(i => i.status === 'Active');
  if (testInc) {
    const zone = ZONES.find(z => z.name === testInc.zone);
    const originalZoneOcc = zone.current;
    window.StadiumApp.actionRecommendation(testInc.id, 0);
    assertEqual(SimState.actionedIncidents[testInc.id], 0, 'Recommendation actioning is recorded');
    assert(zone.current < originalZoneOcc, 'Relevant zone metric reduced on actioned recommendation');
    zone.current = originalZoneOcc;
  }

  // 5. Crowd warning alerts duplicate suppression (Req 2.2)
  SimState.sentAlerts = {};
  SimState.alerts = [];
  const testZoneObj = ZONES[0];
  const origZoneVal = testZoneObj.current;
  
  testZoneObj.current = Math.round(testZoneObj.threshold * 0.82);
  checkCrowdAlerts();
  assertEqual(SimState.sentAlerts[testZoneObj.id], 'warning', 'Crowd alert warning state set');
  const countAfterWarn = SimState.alerts.length;
  
  checkCrowdAlerts();
  assertEqual(SimState.alerts.length, countAfterWarn, 'Crowd alert warning is suppressed (no duplicates)');
  
  testZoneObj.current = Math.round(testZoneObj.threshold * 0.78);
  checkCrowdAlerts();
  assertEqual(SimState.sentAlerts[testZoneObj.id], 'warning', 'Warning state remains active between 75% and 80%');
  
  testZoneObj.current = Math.round(testZoneObj.threshold * 0.83);
  checkCrowdAlerts();
  assertEqual(SimState.alerts.length, countAfterWarn, 'Crowd alert warning still suppressed (not recovered below 75%)');
  
  testZoneObj.current = Math.round(testZoneObj.threshold * 0.73);
  checkCrowdAlerts();
  assertEqual(SimState.sentAlerts[testZoneObj.id], undefined, 'Warning state cleared when recovering below 75%');
  
  testZoneObj.current = Math.round(testZoneObj.threshold * 0.82);
  checkCrowdAlerts();
  assertEqual(SimState.alerts.length, countAfterWarn + 1, 'New crowd alert is generated after recovering below 75%');
  
  testZoneObj.current = origZoneVal;

  // ========== DISPLAY RESULTS ==========
  displayResults();
}

function displayResults() {
  const container = document.getElementById('testResultsContainer');
  if (!container) return;
  const pct = testResults.total > 0 ? Math.round(testResults.passed / testResults.total * 100) : 0;
  const summary = '<div style="font-size:1.5rem;font-weight:800;margin-bottom:16px;color:' + (pct === 100 ? '#10b981' : '#f59e0b') + '">' + pct + '% Passed (' + testResults.passed + '/' + testResults.total + ')</div>';
  const html = summary + testResults.details.map(function(d) {
    const color = d.status === 'PASS' ? '#10b981' : '#ef4444';
    const icon = d.status === 'PASS' ? '✅' : '❌';
    return '<div style="padding:4px 0;font-size:0.82rem;color:' + color + '">' + icon + ' ' + d.name + '</div>';
  }).join('');
  container.innerHTML = html;
  console.log('Tests: ' + testResults.passed + '/' + testResults.total + ' passed (' + pct + '%)');
}

// Auto-run on load
window.addEventListener('load', function() {
  setTimeout(runAllTests, 1500);
});
