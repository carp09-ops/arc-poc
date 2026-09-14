import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const SUPABASE_URL = 'https://svxbzkjxihcwsbyheyxd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = (id) => document.getElementById(id);

function setGauge(el, visualPct) {
  if (!el) return;
  const pct = Math.max(0, Math.min(100, Number(visualPct) || 0));
  el.style.setProperty('--progress', `${pct * 3.6}deg`);
  el.style.setProperty('--arc-fill', `${pct}%`);
}

function titleCase(value = '') {
  return String(value).split('_').map(x => x ? x[0].toUpperCase() + x.slice(1) : '').join(' ');
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

  const heroGaugeLabel = $('arcGaugeLabel');
  const largeGaugeLabel = document.querySelector('#arcLargeGauge .arc-gauge-inner span');

  if (learning) {
    const weekly = weeklyTarget ? `${weeklyCompleted}/${weeklyTarget}` : '—';
    if ($('arcPercent')) $('arcPercent').textContent = weekly;
    if (heroGaugeLabel) heroGaugeLabel.textContent = 'THIS WEEK';
    if ($('arcLargePercent')) $('arcLargePercent').textContent = weekly;
    if (largeGaugeLabel) largeGaugeLabel.textContent = 'THIS WEEK';
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
  const stateCopy = {
    build_momentum: ['Build momentum.', 'The target is still within reach. One deliberate session can change the shape of the week.'],
    closing_the_arc: ['Closing the Arc.', 'You are close to the success zone. Keep the pressure on without chasing perfection.'],
    in_your_arc: ['In your Arc.', 'Aggressive enough to make progress. Flexible enough to sustain it.']
  };
  const [headline, copy] = stateCopy[row.arc_state] || stateCopy.build_momentum;

  if ($('arcPercent')) $('arcPercent').textContent = `${pct}%`;
  if (heroGaugeLabel) heroGaugeLabel.textContent = row.arc_state === 'in_your_arc' ? 'ARC COMPLETE' : 'CONSISTENCY';
  if ($('arcLargePercent')) $('arcLargePercent').textContent = `${pct}%`;
  if (largeGaugeLabel) largeGaugeLabel.textContent = 'CONSISTENCY';
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