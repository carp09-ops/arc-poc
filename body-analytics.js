import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const SUPABASE_URL = 'https://svxbzkjxihcwsbyheyxd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = (id) => document.getElementById(id);

const metrics = {
  weight: { field: 'weight_kg', label: 'Weight', unit: 'lb', convert: v => Number(v) / 0.45359237, decimals: 1 },
  waist: { field: 'waist_cm', label: 'Waist', unit: 'in', convert: v => Number(v) / 2.54, decimals: 1 },
  hips: { field: 'hips_cm', label: 'Hips', unit: 'in', convert: v => Number(v) / 2.54, decimals: 1 },
  chest: { field: 'chest_cm', label: 'Chest', unit: 'in', convert: v => Number(v) / 2.54, decimals: 1 },
  arm: { field: 'arm_cm', label: 'Arms', unit: 'in', convert: v => Number(v) / 2.54, decimals: 1 },
  thigh: { field: 'thigh_cm', label: 'Thighs', unit: 'in', convert: v => Number(v) / 2.54, decimals: 1 }
};

const ranges = { '30d': 30, '90d': 90, '6m': 183, all: null };
let activeMetric = 'weight';
let activeRange = '90d';
let cached = null;
let refreshTimer = null;

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function fmt(value, digits = 1) {
  return Number(value).toFixed(digits);
}

function signed(value, digits = 1) {
  return `${value > 0 ? '+' : ''}${fmt(value, digits)}`;
}

function shortDate(date) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function longDate(date) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function metricPoints(measurements, metricKey, baselineMs) {
  const metric = metrics[metricKey];
  return measurements
    .filter(m => m[metric.field] != null && new Date(m.measured_at).getTime() >= baselineMs)
    .map(m => ({ ...m, t: new Date(m.measured_at).getTime(), value: metric.convert(m[metric.field]) }))
    .sort((a,b) => a.t - b.t);
}

function filterRange(points, rangeKey) {
  const days = ranges[rangeKey];
  if (!days || !points.length) return points;
  const cutoff = Date.now() - days * 86400000;
  return points.filter(p => p.t >= cutoff);
}

function regression(points) {
  if (points.length < 2) return null;
  const t0 = points[0].t;
  const xs = points.map(p => (p.t - t0) / 86400000);
  const ys = points.map(p => p.value);
  const n = points.length;
  const sx = xs.reduce((a,b) => a+b, 0);
  const sy = ys.reduce((a,b) => a+b, 0);
  const sxx = xs.reduce((a,b) => a + b*b, 0);
  const sxy = xs.reduce((a,x,i) => a + x*ys[i], 0);
  const denom = n*sxx - sx*sx;
  if (!denom) return null;
  const slope = (n*sxy - sx*sy) / denom;
  const intercept = (sy - slope*sx) / n;
  return {
    slopePerDay: slope,
    predict: time => intercept + slope * ((time - t0) / 86400000),
    spanDays: (points.at(-1).t - points[0].t) / 86400000
  };
}

function ensureUI() {
  const panel = document.querySelector('#view-body .chart-panel');
  if (!panel) return;

  const headerTitle = panel.querySelector('.panel-header h3');
  if (headerTitle) headerTitle.id = 'bodyChartMetricTitle';

  if (!$('bodyAnalyticsControls')) {
    const controls = document.createElement('div');
    controls.id = 'bodyAnalyticsControls';
    controls.className = 'body-analytics-controls';
    controls.innerHTML = `
      <div class="analytics-control-group">
        <span>Metric</span>
        <div class="analytics-segments" id="bodyMetricSelector">
          ${Object.entries(metrics).map(([key,m]) => `<button type="button" data-body-metric="${key}" class="${key === activeMetric ? 'active' : ''}">${m.label}</button>`).join('')}
        </div>
      </div>
      <div class="analytics-control-group compact">
        <span>Range</span>
        <div class="analytics-segments" id="bodyRangeSelector">
          <button type="button" data-body-range="30d">30D</button>
          <button type="button" data-body-range="90d" class="active">90D</button>
          <button type="button" data-body-range="6m">6M</button>
          <button type="button" data-body-range="all">ALL</button>
        </div>
      </div>`;
    panel.querySelector('.panel-header')?.insertAdjacentElement('afterend', controls);

    controls.addEventListener('click', event => {
      const metricBtn = event.target.closest('[data-body-metric]');
      const rangeBtn = event.target.closest('[data-body-range]');
      if (metricBtn) {
        activeMetric = metricBtn.dataset.bodyMetric;
        controls.querySelectorAll('[data-body-metric]').forEach(b => b.classList.toggle('active', b === metricBtn));
        render();
      }
      if (rangeBtn) {
        activeRange = rangeBtn.dataset.bodyRange;
        controls.querySelectorAll('[data-body-range]').forEach(b => b.classList.toggle('active', b === rangeBtn));
        render();
      }
    });
  }

  const historyPanel = $('measurementHistory')?.closest('.panel');
  if (historyPanel && !$('bodyTimelinePanel')) {
    const timeline = document.createElement('article');
    timeline.id = 'bodyTimelinePanel';
    timeline.className = 'panel body-timeline-panel';
    timeline.innerHTML = `<div class="panel-header"><div><span class="eyebrow">Recent history</span><h3>Check-ins</h3></div><small id="bodyTimelineCount" class="pill">—</small></div><div id="bodyTimeline" class="body-timeline"></div>`;
    historyPanel.insertAdjacentElement('beforebegin', timeline);
    const oldTitle = historyPanel.querySelector('.panel-header h3');
    if (oldTitle) oldTitle.textContent = 'All measurements';
  }
}

function summaryCard(label, value, sub, className = '') {
  return `<article class="summary-card body-analytic-card"><span>${esc(label)}</span><strong>${esc(value)}</strong><small class="${className}">${esc(sub)}</small></article>`;
}

function renderSummary(allPoints, visiblePoints) {
  const summary = $('bodySummary');
  if (!summary) return;
  const metric = metrics[activeMetric];
  const current = allPoints.at(-1);
  if (!current) {
    summary.innerHTML = [
      summaryCard(`Current ${metric.label.toLowerCase()}`, '—', 'Log a measurement'),
      summaryCard('From baseline', '—', 'Need a baseline'),
      summaryCard('Recent pace', '—', 'Building trend'),
      summaryCard('30-day projection', '—', 'Learning your trend')
    ].join('');
    return;
  }

  const baseline = allPoints[0];
  const delta = current.value - baseline.value;
  const reg = regression(visiblePoints);
  const paceReady = reg && visiblePoints.length >= 2 && reg.spanDays >= 7;
  const projectionReady = reg && visiblePoints.length >= 3 && reg.spanDays >= 14;
  const weekly = paceReady ? reg.slopePerDay * 7 : null;
  const projection = projectionReady ? Math.max(0, current.value + reg.slopePerDay * 30) : null;

  summary.innerHTML = [
    summaryCard(`Current ${metric.label.toLowerCase()}`, `${fmt(current.value, metric.decimals)} ${metric.unit}`, `Latest · ${shortDate(current.measured_at)}`),
    summaryCard('From baseline', `${signed(delta, metric.decimals)} ${metric.unit}`, `Since ${shortDate(baseline.measured_at)}`, delta <= 0 ? 'good' : 'attention'),
    summaryCard('Recent pace', weekly == null ? 'Learning' : `${signed(weekly, metric.decimals)} ${metric.unit}/wk`, weekly == null ? 'Need at least 7 days' : `${activeRange.toUpperCase()} trajectory`, weekly != null && weekly <= 0 ? 'good' : ''),
    summaryCard('30-day projection', projection == null ? 'Learning' : `≈ ${fmt(projection, metric.decimals)} ${metric.unit}`, projection == null ? '3 check-ins across ~2 weeks' : 'If your recent trend continued')
  ].join('');
}

function renderChart(points) {
  const chart = $('weightChart');
  const pill = $('weightTrendLabel');
  const title = $('bodyChartMetricTitle');
  const metric = metrics[activeMetric];
  if (!chart || !pill) return;
  if (title) title.textContent = metric.label;

  if (!points.length) {
    chart.className = 'weight-chart empty-state';
    chart.textContent = `No ${metric.label.toLowerCase()} check-ins in this range.`;
    pill.textContent = 'Need data';
    return;
  }

  if (points.length === 1) {
    chart.className = 'weight-chart';
    chart.innerHTML = `<div class="trend-baseline"><div><div class="baseline-dot" aria-hidden="true"></div><div class="baseline-value">${fmt(points[0].value, metric.decimals)} ${metric.unit}</div><div class="baseline-help">Baseline saved. Your next check-in will turn this into a trend.</div></div></div>`;
    pill.textContent = 'Baseline';
    return;
  }

  chart.className = 'weight-chart body-chart-rich';
  const W = 920, H = 320, left = 68, right = 24, top = 24, bottom = 48;
  const innerW = W - left - right, innerH = H - top - bottom;
  const minT = points[0].t, maxT = points.at(-1).t;
  const vals = points.map(p => p.value);
  const rawMin = Math.min(...vals), rawMax = Math.max(...vals);
  const span = Math.max(rawMax - rawMin, metric.unit === 'lb' ? 2 : 0.5);
  const padValue = span * 0.18;
  const minV = rawMin - padValue, maxV = rawMax + padValue;
  const x = t => left + ((t - minT) / (maxT - minT || 1)) * innerW;
  const y = v => top + ((maxV - v) / (maxV - minV || 1)) * innerH;
  const coords = points.map(p => ({ x: x(p.t), y: y(p.value), p }));
  const polyline = coords.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const yTicks = Array.from({ length: 5 }, (_,i) => maxV - (i/4)*(maxV-minV));
  const xTickCount = window.innerWidth < 700 ? 3 : 5;
  const xTicks = Array.from({ length: xTickCount }, (_,i) => minT + (i/(xTickCount-1))*(maxT-minT));
  const reg = regression(points);
  const trend = reg ? { x1:x(minT), y1:y(reg.predict(minT)), x2:x(maxT), y2:y(reg.predict(maxT)) } : null;
  const delta = points.at(-1).value - points[0].value;
  pill.textContent = `${signed(delta, metric.decimals)} ${metric.unit}`;

  chart.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${metric.label} trend from ${longDate(points[0].measured_at)} to ${longDate(points.at(-1).measured_at)}">
      ${yTicks.map(v => `<line class="grid-line" x1="${left}" y1="${y(v)}" x2="${W-right}" y2="${y(v)}"/><text class="axis-label y-label" x="${left-10}" y="${y(v)+4}" text-anchor="end">${fmt(v, metric.decimals)}</text>`).join('')}
      ${xTicks.map(t => `<line class="axis-tick" x1="${x(t)}" y1="${H-bottom}" x2="${x(t)}" y2="${H-bottom+5}"/><text class="axis-label x-label" x="${x(t)}" y="${H-16}" text-anchor="middle">${shortDate(t)}</text>`).join('')}
      <text class="axis-unit" x="${left-8}" y="${top-7}" text-anchor="end">${metric.unit}</text>
      ${trend ? `<line class="trend-regression" x1="${trend.x1}" y1="${trend.y1}" x2="${trend.x2}" y2="${trend.y2}"/>` : ''}
      <polyline class="trend-line" points="${polyline}"/>
      ${coords.map((c,i) => `<circle class="dot ${i === coords.length-1 ? 'latest-dot' : ''}" cx="${c.x}" cy="${c.y}" r="${i === coords.length-1 ? 6 : 4}"><title>${shortDate(c.p.measured_at)} · ${fmt(c.p.value, metric.decimals)} ${metric.unit}</title></circle>`).join('')}
    </svg>
    <div class="body-chart-legend"><span><i class="actual-key"></i>Actual check-ins</span><span><i class="trend-key"></i>Trend</span></div>`;
}

function renderTimeline(measurements, baselineMs) {
  const timeline = $('bodyTimeline');
  const count = $('bodyTimelineCount');
  if (!timeline) return;
  const valid = measurements.filter(m => new Date(m.measured_at).getTime() >= baselineMs).sort((a,b) => new Date(b.measured_at) - new Date(a.measured_at));
  if (count) count.textContent = `${valid.length} check-in${valid.length === 1 ? '' : 's'}`;
  if (!valid.length) {
    timeline.innerHTML = '<div class="empty-state">No check-ins in your current baseline yet.</div>';
    return;
  }

  const metric = metrics[activeMetric];
  const chronological = [...valid].reverse();
  const previousById = new Map();
  chronological.forEach((row, index) => previousById.set(row.id, chronological[index-1] || null));

  timeline.innerHTML = valid.slice(0,8).map(row => {
    const pieces = [];
    if (row.weight_kg != null) pieces.push(`${fmt(metrics.weight.convert(row.weight_kg))} lb`);
    if (row.waist_cm != null) pieces.push(`${fmt(metrics.waist.convert(row.waist_cm))}\" waist`);
    if (row.hips_cm != null) pieces.push(`${fmt(metrics.hips.convert(row.hips_cm))}\" hips`);
    const prev = previousById.get(row.id);
    let change = '';
    if (row[metric.field] != null && prev?.[metric.field] != null) {
      const d = metric.convert(row[metric.field]) - metric.convert(prev[metric.field]);
      change = `<small class="${d <= 0 ? 'good' : ''}">${signed(d, metric.decimals)} ${metric.unit} vs prior ${metric.label.toLowerCase()}</small>`;
    }
    return `<div class="body-timeline-row"><div class="timeline-dot"></div><div><strong>${longDate(row.measured_at)}</strong><span>${esc(pieces.join(' · ') || 'Measurement check-in')}</span>${change}</div></div>`;
  }).join('');
}

function render() {
  if (!cached) return;
  ensureUI();
  const { profile, measurements } = cached;
  const baselineMs = new Date(profile.baseline_started_at || profile.created_at).getTime();
  const all = metricPoints(measurements, activeMetric, baselineMs);
  const visible = filterRange(all, activeRange);
  renderSummary(all, visible);
  renderChart(visible);
  renderTimeline(measurements, baselineMs);
}

async function refresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;
    const [profileRes, measurementsRes] = await Promise.all([
      supabase.from('profiles').select('created_at,baseline_started_at').eq('user_id', auth.user.id).maybeSingle(),
      supabase.from('body_measurements').select('id,measured_at,weight_kg,waist_cm,hips_cm,chest_cm,arm_cm,thigh_cm,note').eq('user_id', auth.user.id).order('measured_at', { ascending: true }).limit(500)
    ]);
    if (profileRes.error || measurementsRes.error || !profileRes.data) return;
    cached = { profile: profileRes.data, measurements: measurementsRes.data || [] };
    render();
  }, 120);
}

function installObservers() {
  const history = $('measurementHistory');
  if (history) {
    const observer = new MutationObserver(() => refresh());
    observer.observe(history, { childList: true, subtree: true });
  }
  document.addEventListener('click', event => {
    if (event.target.closest('#confirmBaselineReset')) setTimeout(refresh, 1300);
  });
  window.addEventListener('resize', () => cached && renderChart(filterRange(metricPoints(cached.measurements, activeMetric, new Date(cached.profile.baseline_started_at || cached.profile.created_at).getTime()), activeRange)));
}

supabase.auth.onAuthStateChange((_event, session) => { if (session?.user) refresh(); });
window.addEventListener('DOMContentLoaded', () => { ensureUI(); installObservers(); refresh(); });
window.setTimeout(() => { ensureUI(); installObservers(); refresh(); }, 800);
