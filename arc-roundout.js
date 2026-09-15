import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const SUPABASE_URL = 'https://svxbzkjxihcwsbyheyxd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = (id) => document.getElementById(id);

function setGauge(el, visualPct) {
  if (!el) return;
  const pct = Math.max(0, Math.min(100, Number(visualPct) || 0));
  const energy = pct / 100;
  el.style.setProperty('--progress', `${pct * 3.6}deg`);
  el.style.setProperty('--arc-fill', `${pct}%`);
  /* v8: progress is communicated by the photographic corona gaining energy,
     not by masking a pie slice. This is reliable on iOS and still makes the
     eclipse visibly evolve as the user's Arc develops. */
  el.style.setProperty('--arc-corona-opacity', (0.42 + energy * 0.50).toFixed(3));
  el.style.setProperty('--arc-corona-brightness', (0.92 + energy * 0.40).toFixed(3));
  el.style.setProperty('--arc-corona-scale', (0.99 + energy * 0.018).toFixed(3));
}

function titleCase(value = '') {
  return String(value).split('_').map(x => x ? x[0].toUpperCase() + x.slice(1) : '').join(' ');
}

function stageFromPercent(percent = 0) {
  const pct = Math.max(0, Number(percent) || 0);
  if (pct >= 80) return { key:'in_your_arc', label:'In Your Arc' };
  if (pct >= 60) return { key:'closing_the_arc', label:'Closing the Arc' };
  return { key:'build_momentum', label:'Build momentum' };
}

function setGaugeState(el, label, sublabel) {
  if (!el) return;
  const strong = el.querySelector('.arc-gauge-inner strong');
  const small = el.querySelector('.arc-gauge-inner span');
  if (strong) strong.textContent = label;
  if (small) small.textContent = sublabel;
  el.dataset.arcStage = label.toLowerCase().replaceAll(' ', '-');
}

function ensureArcSummary() {
  const story = document.querySelector('.arc-story-grid');
  if (!story || $('arcPeriodSummary')) return;
  const summary = document.createElement('div');
  summary.id = 'arcPeriodSummary';
  summary.className = 'arc-period-summary';
  summary.innerHTML = `
    <div><span>Window</span><strong id="arcWindowLabel">Learning</strong></div>
    <div><span>Completed</span><strong id="arcCompletedLabel">—</strong></div>
    <div><span>Expected</span><strong id="arcExpectedLabel">—</strong></div>
    <div><span>Consistency</span><strong id="arcConsistencyLabel">—</strong></div>`;
  story.insertAdjacentElement('afterend', summary);
}

function renderArc(row) {
  if (!row) return;
  ensureArcSummary();

  const learning = row.arc_state === 'learning';
  const completed = Number(row.completed_workouts || 0);
  const weeklyCompleted = Number(row.weekly_completed || 0);
  const weeklyTarget = Number(row.weekly_target || 0);
  const actual = row.adherence_pct == null ? null : Number(row.adherence_pct);
  const visual = Number(row.arc_completion_pct || 0);

  setGauge($('arcGauge'), visual);
  setGauge($('arcLargeGauge'), visual);

  if (learning) {
    const weeklyRate = weeklyTarget > 0 ? (weeklyCompleted / weeklyTarget) * 100 : 0;
    const stage = stageFromPercent(weeklyRate);
    setGaugeState($('arcGauge'), stage.label, 'LEARNING');
    setGaugeState($('arcLargeGauge'), stage.label, 'LEARNING');

    if ($('consistencyMetric')) $('consistencyMetric').textContent = 'Learning';
    if ($('workoutsMetric')) $('workoutsMetric').textContent = weeklyCompleted;
    if ($('workoutsMetricSub')) $('workoutsMetricSub').textContent = `${weeklyTarget} planned this week`;
    if ($('heroHeadline')) $('heroHeadline').textContent = 'Building your Arc.';
    if ($('heroSubhead')) $('heroSubhead').textContent = `${weeklyCompleted} of ${weeklyTarget} workouts this week. Arc needs a little history before consistency becomes meaningful.`;
    if ($('arcStatePill')) $('arcStatePill').textContent = 'Learning';
    if ($('arcStateHeadline')) $('arcStateHeadline').textContent = 'Build the pattern.';
    if ($('arcStateCopy')) $('arcStateCopy').textContent = 'For your first seven days, Arc tracks the commitment without pretending a tiny sample is a meaningful percentage.';
    if ($('arcWindowLabel')) $('arcWindowLabel').textContent = 'First 7 days';
    if ($('arcCompletedLabel')) $('arcCompletedLabel').textContent = `${weeklyCompleted} this week`;
    if ($('arcExpectedLabel')) $('arcExpectedLabel').textContent = `${weeklyTarget} this week`;
    if ($('arcConsistencyLabel')) $('arcConsistencyLabel').textContent = 'Learning';
    return;
  }

  const pct = Math.round(actual || 0);
  const expected = Number(row.expected_workouts || 0);
  const stage = stageFromPercent(pct);
  const stateCopy = {
    build_momentum: ['Build momentum.', 'The target is still within reach. One deliberate session can change the shape of the week.'],
    closing_the_arc: ['Closing the Arc.', 'You are close to the success zone. Keep the pressure on without chasing perfection.'],
    in_your_arc: ['In your Arc.', 'Aggressive enough to make progress. Flexible enough to sustain it.']
  };
  const [headline, copy] = stateCopy[row.arc_state] || stateCopy.build_momentum;

  setGaugeState($('arcGauge'), stage.label, `${pct}% CONSISTENCY`);
  setGaugeState($('arcLargeGauge'), stage.label, `${pct}% CONSISTENCY`);
  if ($('consistencyMetric')) $('consistencyMetric').textContent = `${pct}%`;
  if ($('heroHeadline')) $('heroHeadline').textContent = headline;
  if ($('heroSubhead')) $('heroSubhead').textContent = copy;
  if ($('arcStatePill')) $('arcStatePill').textContent = titleCase(row.arc_state);
  if ($('arcStateHeadline')) $('arcStateHeadline').textContent = headline;
  if ($('arcStateCopy')) $('arcStateCopy').textContent = copy;
  if ($('arcWindowLabel')) $('arcWindowLabel').textContent = 'Rolling 28 days';
  if ($('arcCompletedLabel')) $('arcCompletedLabel').textContent = String(completed);
  if ($('arcExpectedLabel')) $('arcExpectedLabel').textContent = expected.toFixed(1).replace('.0', '');
  if ($('arcConsistencyLabel')) $('arcConsistencyLabel').textContent = `${pct}%`;
}

async function refreshArc() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return;
  const { data, error } = await supabase.from('arc_progress_28d').select('*').eq('user_id', auth.user.id).maybeSingle();
  if (!error && data) renderArc(data);
}

supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) window.setTimeout(refreshArc, 100);
});

window.addEventListener('DOMContentLoaded', () => window.setTimeout(refreshArc, 250));
window.setTimeout(refreshArc, 700);
