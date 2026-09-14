import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const SUPABASE_URL = 'https://svxbzkjxihcwsbyheyxd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = (id) => document.getElementById(id);

const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = './starting-point.css';
document.head.appendChild(styleLink);

function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fmt(v, digits = 1) { return Number(v).toFixed(digits); }
function kgToPounds(v) { return v == null ? null : Number(v) / 0.45359237; }
function cmToInches(v) { return v == null ? null : Number(v) / 2.54; }

function toast(message) {
  const el = $('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => el.classList.remove('show'), 3200);
}

async function user() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Sign in again to manage your Arc.');
  return data.user;
}

function ensurePanel() {
  if ($('startingPointPanel')) return $('startingPointPanel');
  const shell = document.createElement('div');
  shell.id = 'startingPointPanel';
  shell.className = 'starting-point-shell hidden';
  shell.innerHTML = `
    <button class="starting-point-backdrop" data-close-starting-point aria-label="Close starting point settings"></button>
    <section class="starting-point-panel" role="dialog" aria-modal="true" aria-labelledby="startingPointTitle">
      <div class="starting-point-head">
        <div>
          <span class="eyebrow">Your Arc</span>
          <h2 id="startingPointTitle">Starting point</h2>
        </div>
        <button class="starting-point-close" data-close-starting-point aria-label="Close">×</button>
      </div>
      <p class="starting-point-intro">Your life changes. Arc should be able to change with it without pretending your past progress never happened.</p>
      <div class="starting-point-current">
        <div><span>Goal</span><strong id="startingGoal">—</strong></div>
        <div><span>Training target</span><strong id="startingTarget">—</strong></div>
        <div><span>Body baseline</span><strong id="startingBaseline">—</strong></div>
      </div>
      <button id="editStartingPoint" class="starting-point-action">
        <div><strong>Edit starting point</strong><span>Update your goal, weekly commitment, and available equipment.</span></div><b>→</b>
      </button>
      <button id="resetBaseline" class="starting-point-action reset-action">
        <div><strong>Reset baseline</strong><span>Start body comparisons from today. Your workouts, measurements, and Arc history stay saved.</span></div><b>↻</b>
      </button>
      <div id="resetConfirm" class="reset-confirm hidden">
        <p><strong>Start a fresh baseline today?</strong><br />Nothing is deleted. Your next body check-in becomes the new comparison point. Your rolling Arc consistency is not reset.</p>
        <div class="reset-confirm-actions">
          <button id="confirmBaselineReset" class="button button-primary">Yes, reset baseline</button>
          <button id="cancelBaselineReset" class="button">Cancel</button>
        </div>
      </div>
    </section>`;
  document.body.appendChild(shell);
  shell.querySelectorAll('[data-close-starting-point]').forEach(btn => btn.addEventListener('click', closePanel));
  $('editStartingPoint').addEventListener('click', editStartingPoint);
  $('resetBaseline').addEventListener('click', () => $('resetConfirm').classList.remove('hidden'));
  $('cancelBaselineReset').addEventListener('click', () => $('resetConfirm').classList.add('hidden'));
  $('confirmBaselineReset').addEventListener('click', resetBaseline);
  return shell;
}

function closePanel() {
  $('startingPointPanel')?.classList.add('hidden');
  $('resetConfirm')?.classList.add('hidden');
}

async function openPanel() {
  try {
    const currentUser = await user();
    const panel = ensurePanel();
    const [profileRes, targetRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', currentUser.id).maybeSingle(),
      supabase.from('weekly_targets').select('*').eq('user_id', currentUser.id).order('starts_on', { ascending: false }).limit(1).maybeSingle()
    ]);
    if (profileRes.error) throw profileRes.error;
    if (targetRes.error) throw targetRes.error;
    const profile = profileRes.data;
    const target = targetRes.data;
    $('startingGoal').textContent = profile?.primary_goal || 'Not set';
    $('startingTarget').textContent = target ? `${target.workouts_per_week} days / week` : 'Not set';
    $('startingBaseline').textContent = profile?.baseline_started_at
      ? new Date(profile.baseline_started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Original start';
    panel.classList.remove('hidden');
  } catch (error) {
    toast(error.message || 'Could not load your starting point.');
  }
}

function selectEquipment(values = []) {
  const wanted = new Set(values);
  const chips = [...document.querySelectorAll('.equipment-chip')];
  if (!chips.length) return;
  const special = values.find(v => v === 'Bodyweight only' || v === 'Full gym');
  if (special) {
    const chip = chips.find(x => x.dataset.value === special);
    if (chip && !chip.classList.contains('selected')) chip.click();
    return;
  }

  const selectedSpecial = chips.find(x => x.classList.contains('selected') && (x.dataset.value === 'Bodyweight only' || x.dataset.value === 'Full gym'));
  if (selectedSpecial && values.length) {
    const first = chips.find(x => x.dataset.value === values[0]);
    if (first) first.click();
  } else if (selectedSpecial && !values.length) {
    const temp = chips.find(x => x.dataset.value === 'Dumbbells');
    if (temp) { temp.click(); temp.click(); }
  }

  chips.forEach(chip => {
    const should = wanted.has(chip.dataset.value);
    const is = chip.classList.contains('selected');
    if (should !== is && chip.dataset.value !== 'Bodyweight only' && chip.dataset.value !== 'Full gym') chip.click();
  });
}

async function editStartingPoint() {
  try {
    const currentUser = await user();
    const [profileRes, targetRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', currentUser.id).maybeSingle(),
      supabase.from('weekly_targets').select('*').eq('user_id', currentUser.id).order('starts_on', { ascending: false }).limit(1).maybeSingle()
    ]);
    if (profileRes.error) throw profileRes.error;
    if (targetRes.error) throw targetRes.error;
    closePanel();
    $('setupName').value = profileRes.data?.display_name || '';
    $('setupGoal').value = profileRes.data?.primary_goal || '';
    $('setupTarget').value = String(targetRes.data?.workouts_per_week || 4);
    selectEquipment(profileRes.data?.equipment || []);
    const card = $('setupGate')?.querySelector('.setup-card');
    if (card) {
      card.querySelector('h2').textContent = 'Adjust your starting point.';
      const intro = card.querySelector(':scope > p');
      if (intro) intro.textContent = 'Update what Arc should work with today. Your existing history stays intact.';
      const submit = card.querySelector('.setup-submit');
      if (submit) submit.innerHTML = 'Save my Arc <span>→</span>';
      if (!$('closeSetupEdit')) {
        const close = document.createElement('button');
        close.id = 'closeSetupEdit';
        close.type = 'button';
        close.className = 'setup-edit-close';
        close.textContent = '×';
        close.setAttribute('aria-label', 'Close edit starting point');
        close.addEventListener('click', () => $('setupGate').classList.add('hidden'));
        card.appendChild(close);
      }
    }
    $('setupGate').classList.remove('hidden');
  } catch (error) {
    toast(error.message || 'Could not edit your starting point.');
  }
}

async function saveSetup(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  try {
    const currentUser = await user();
    const equipment = $('setupEquipment').value.split(',').map(x => x.trim()).filter(Boolean);
    const now = new Date().toISOString();
    const { error: profileError } = await supabase.from('profiles').upsert({
      user_id: currentUser.id,
      display_name: $('setupName').value.trim() || null,
      primary_goal: $('setupGoal').value.trim() || null,
      equipment,
      preferred_units: 'imperial',
      updated_at: now
    });
    if (profileError) throw profileError;

    const today = localISODate();
    const { data: todayTarget, error: existingError } = await supabase.from('weekly_targets')
      .select('id').eq('user_id', currentUser.id).eq('starts_on', today).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (existingError) throw existingError;
    const targetValue = Number($('setupTarget').value);
    const targetResult = todayTarget
      ? await supabase.from('weekly_targets').update({ workouts_per_week: targetValue }).eq('id', todayTarget.id)
      : await supabase.from('weekly_targets').insert({ user_id: currentUser.id, starts_on: today, workouts_per_week: targetValue });
    if (targetResult.error) throw targetResult.error;

    $('setupGate').classList.add('hidden');
    window.setTimeout(() => window.location.reload(), 1150);
  } catch (error) {
    $('arcLoading')?.classList.remove('visible');
    toast(error.message || 'Could not save your Arc.');
  }
}

async function resetBaseline() {
  const button = $('confirmBaselineReset');
  const original = button.textContent;
  button.disabled = true;
  button.textContent = 'Resetting…';
  try {
    const currentUser = await user();
    const now = new Date().toISOString();
    const { error } = await supabase.from('profiles').update({ baseline_started_at: now, updated_at: now }).eq('user_id', currentUser.id);
    if (error) throw error;
    closePanel();
    await renderBaselineBody();
    document.querySelector('[data-view="body"]')?.click();
    $('measurementFormPanel')?.classList.remove('hidden');
    toast('Baseline reset. Log today’s measurements to establish your new starting point.');
  } catch (error) {
    toast(error.message || 'Could not reset your baseline.');
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

function summaryCard(label, current, delta, unit) {
  if (current == null) return `<article class="summary-card"><span>${label}</span><strong>—</strong><small>Log new baseline</small></article>`;
  if (delta == null) return `<article class="summary-card"><span>${label}</span><strong>${fmt(current)} ${unit}</strong><small class="good">New baseline</small></article>`;
  return `<article class="summary-card"><span>${label}</span><strong>${fmt(current)} ${unit}</strong><small class="${delta <= 0 ? 'good' : 'attention'}">${delta > 0 ? '+' : ''}${fmt(delta)} ${unit} from baseline</small></article>`;
}

async function renderBaselineBody() {
  try {
    const currentUser = await user();
    const [profileRes, measurementsRes] = await Promise.all([
      supabase.from('profiles').select('created_at,baseline_started_at').eq('user_id', currentUser.id).maybeSingle(),
      supabase.from('body_measurements').select('*').eq('user_id', currentUser.id).order('measured_at', { ascending: true }).limit(100)
    ]);
    if (profileRes.error || measurementsRes.error) return;
    const profile = profileRes.data;
    if (!profile?.baseline_started_at) return;
    const baselineAt = new Date(profile.baseline_started_at).getTime();
    const points = (measurementsRes.data || []).filter(m => new Date(m.measured_at).getTime() >= baselineAt);
    const resetIsCustom = baselineAt - new Date(profile.created_at).getTime() > 60000;

    let notice = $('bodyBaselineNotice');
    if (!notice && $('view-body')) {
      notice = document.createElement('div');
      notice.id = 'bodyBaselineNotice';
      notice.className = 'body-baseline-notice';
      $('view-body').querySelector('.section-heading')?.insertAdjacentElement('afterend', notice);
    }
    if (notice) {
      notice.innerHTML = `<div><span class="eyebrow">Current comparison window</span><strong>${new Date(profile.baseline_started_at).toLocaleDateString(undefined, { month:'long', day:'numeric', year:'numeric' })}</strong><small>${resetIsCustom ? 'History before this date is preserved but excluded from current body deltas.' : 'Your original Arc baseline.'}</small></div><button id="manageStartingPointInline" class="text-button">Manage starting point →</button>`;
      $('manageStartingPointInline')?.addEventListener('click', openPanel);
    }

    const summary = $('bodySummary');
    if (summary) {
      const metric = (field, convert, unit) => {
        const values = points.filter(p => p[field] != null).map(p => convert(p[field]));
        if (!values.length) return [null, null, unit];
        return [values.at(-1), values.length > 1 ? values.at(-1) - values[0] : null, unit];
      };
      const items = [
        ['Weight', ...metric('weight_kg', kgToPounds, 'lb')],
        ['Waist', ...metric('waist_cm', cmToInches, 'in')],
        ['Hips', ...metric('hips_cm', cmToInches, 'in')],
        ['Chest', ...metric('chest_cm', cmToInches, 'in')]
      ];
      summary.innerHTML = items.map(([label,current,delta,unit]) => summaryCard(label,current,delta,unit)).join('');
    }

    const chart = $('weightChart');
    const pill = $('weightTrendLabel');
    const weights = points.filter(p => p.weight_kg != null).map(p => kgToPounds(p.weight_kg));
    if (!chart || !pill) return;
    if (!weights.length) {
      chart.className = 'weight-chart empty-state';
      chart.textContent = 'Log your weight to establish the new baseline.';
      pill.textContent = 'New baseline';
      return;
    }
    if (weights.length === 1) {
      chart.className = 'weight-chart';
      chart.innerHTML = `<div class="trend-baseline"><div><div class="baseline-dot" aria-hidden="true"></div><div class="baseline-value">${fmt(weights[0])} lb</div><div class="baseline-help">Baseline saved. Your next weight check-in will turn this into a trend.</div></div></div>`;
      pill.textContent = 'Baseline';
      return;
    }

    const min = Math.min(...weights) - 2, max = Math.max(...weights) + 2;
    const w = 900, h = 220, pad = 24;
    const xy = weights.map((v,i) => ({ x: pad + (i/(weights.length-1))*(w-pad*2), y: pad + ((max-v)/(max-min))*(h-pad*2) }));
    const poly = xy.map(p => `${p.x},${p.y}`).join(' ');
    chart.className = 'weight-chart';
    chart.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Weight trend"><line class="grid-line" x1="${pad}" y1="55" x2="${w-pad}" y2="55"/><line class="grid-line" x1="${pad}" y1="110" x2="${w-pad}" y2="110"/><line class="grid-line" x1="${pad}" y1="165" x2="${w-pad}" y2="165"/><polyline class="trend-line" points="${poly}"/>${xy.map(p => `<circle class="dot" cx="${p.x}" cy="${p.y}" r="5"/>`).join('')}</svg>`;
    const delta = weights.at(-1) - weights[0];
    pill.textContent = `${delta > 0 ? '+' : ''}${fmt(delta)} lb`;
  } catch (_) {
    // Core body UI remains available if this enhancement cannot render.
  }
}

function install() {
  ensurePanel();
  $('profileButton')?.addEventListener('click', openPanel);
  const form = $('setupForm');
  if (form && form.dataset.startingPointHandler !== 'true') {
    form.dataset.startingPointHandler = 'true';
    form.addEventListener('submit', saveSetup, true);
  }
  window.setTimeout(renderBaselineBody, 150);
}

window.addEventListener('DOMContentLoaded', install);
window.setTimeout(install, 0);
