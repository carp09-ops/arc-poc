import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const SUPABASE_URL = 'https://svxbzkjxihcwsbyheyxd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = id => document.getElementById(id);

function fmtNum(value, digits = 0) {
  if (value == null) return '—';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function statusForSource(sources, provider, method) {
  return sources.find(s => s.provider === provider && s.connection_method === method)?.status || 'disconnected';
}

function ensureNutritionConnections() {
  const view = $('view-connections');
  if (!view || $('nutritionConnectionLayer')) return;
  const note = view.querySelector('.insight-note');
  const section = document.createElement('section');
  section.id = 'nutritionConnectionLayer';
  section.className = 'nutrition-connection-layer';
  section.innerHTML = `
    <div class="nutrition-layer-heading">
      <div><span class="eyebrow">Nutrition context</span><h2>Log food where you already log it.</h2><p>Arc only needs the daily pattern. Nutrition stays context — it does not change whether your Arc is complete.</p></div>
      <span class="nutrition-principle-pill">No duplicate food logging</span>
    </div>
    <div class="nutrition-source-grid">
      <article class="nutrition-source-card" data-nutrition-source="lose_it">
        <div class="nutrition-source-icon">L</div>
        <div><span class="eyebrow">Direct cloud sync</span><h3>Lose It!</h3><p>Best direct path if Arc receives partner API access.</p><span class="status-chip" data-source-status="lose_it">Partner access required</span></div>
      </article>
      <article class="nutrition-source-card" data-nutrition-source="apple_health">
        <div class="nutrition-source-icon apple">♥</div>
        <div><span class="eyebrow">Preferred iPhone path</span><h3>Apple Health</h3><p>Lose It! can remain the logger while Arc reads normalized nutrition through HealthKit in the native app.</p><span class="status-chip muted" data-source-status="apple_health">Native app path ready</span></div>
      </article>
      <article class="nutrition-source-card" data-nutrition-source="manual_import">
        <div class="nutrition-source-icon import">↥</div>
        <div><span class="eyebrow">Fallback path</span><h3>File import</h3><p>A provider-neutral import can feed the same daily nutrition model if direct integrations are unavailable.</p><span class="status-chip muted" data-source-status="manual_import">Data model ready</span></div>
      </article>
    </div>
    <p class="nutrition-layer-footnote">Arc stores normalized daily totals — calories, target, protein, carbs, fat, fiber and water — rather than recreating meals or a food database.</p>`;
  if (note) view.insertBefore(section, note); else view.appendChild(section);
}

function updateConnectionStatuses(sources) {
  const mappings = [
    ['lose_it','lose_it','oauth','Connected'],
    ['apple_health','apple_health','healthkit','Connected through Apple Health'],
    ['manual_import','manual_import','file_import','Import source active']
  ];
  for (const [key, provider, method, connectedText] of mappings) {
    const status = statusForSource(sources, provider, method);
    const pill = document.querySelector(`[data-source-status="${key}"]`);
    if (!pill) continue;
    if (status === 'connected') {
      pill.textContent = connectedText;
      pill.classList.remove('muted');
      pill.classList.add('connected');
    } else if (status === 'pending') {
      pill.textContent = 'Connection pending';
      pill.classList.remove('muted');
    }
  }
}

function ensureFuelingPanel() {
  if ($('fuelingContextPanel')) return $('fuelingContextPanel');
  const split = document.querySelector('#view-today .content-split');
  if (!split) return null;
  const panel = document.createElement('article');
  panel.id = 'fuelingContextPanel';
  panel.className = 'panel fueling-context-panel hidden';
  split.parentElement.insertBefore(panel, split);
  return panel;
}

function nutritionState(summary) {
  const consumed = Number(summary.calories_consumed || 0);
  const target = Number(summary.calorie_target || 0);
  if (!consumed || !target) return { label: 'Context available', detail: 'Arc is learning your fueling pattern.' };
  const ratio = consumed / target;
  if (ratio >= .85 && ratio <= 1.1) return { label: 'On track', detail: 'Close to today’s calorie target.' };
  if (ratio < .85) return { label: 'Below target', detail: 'Fueling is running below today’s target.' };
  return { label: 'Above target', detail: 'Fueling is running above today’s target.' };
}

function renderFueling(summary, source) {
  const panel = ensureFuelingPanel();
  if (!panel || !summary) return;
  const state = nutritionState(summary);
  const sourceName = source?.provider === 'lose_it' ? 'Lose It!' : source?.provider === 'apple_health' ? 'Apple Health' : source?.provider === 'manual_import' ? 'Imported data' : 'Nutrition source';
  panel.classList.remove('hidden');
  panel.innerHTML = `
    <div class="fueling-context-copy"><span class="eyebrow">Fueling context</span><h3>${state.label}</h3><p>${state.detail} Nutrition informs Arc insights, but it does not change your workout-consistency Arc.</p></div>
    <div class="fueling-context-metrics">
      <div><span>Calories</span><strong>${fmtNum(summary.calories_consumed)}</strong><small>${summary.calorie_target ? `of ${fmtNum(summary.calorie_target)} target` : 'logged'}</small></div>
      <div><span>Protein</span><strong>${summary.protein_g == null ? '—' : `${fmtNum(summary.protein_g,1)}g`}</strong><small>${sourceName}</small></div>
    </div>`;
}

async function loadNutritionContext() {
  ensureNutritionConnections();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return;

  const sourcesRes = await supabase.from('nutrition_sources').select('*').eq('user_id', user.id);
  if (!sourcesRes.error) updateConnectionStatuses(sourcesRes.data || []);

  const cutoff = new Date(Date.now() - 14 * 86400000).toISOString().slice(0,10);
  const summaryRes = await supabase.from('nutrition_daily_summaries')
    .select('*')
    .eq('user_id', user.id)
    .gte('nutrition_date', cutoff)
    .order('nutrition_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (summaryRes.error || !summaryRes.data) return;
  const source = (sourcesRes.data || []).find(s => s.id === summaryRes.data.source_id);
  renderFueling(summaryRes.data, source);
}

window.addEventListener('DOMContentLoaded', () => setTimeout(loadNutritionContext, 350));
supabase.auth.onAuthStateChange((_event, session) => { if (session?.user) setTimeout(loadNutritionContext, 250); });
