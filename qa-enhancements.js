const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = './qa-enhancements.css';
document.head.appendChild(styleLink);

const $ = (id) => document.getElementById(id);

function installEquipmentPicker() {
  const input = $('setupEquipment');
  if (!input || input.dataset.pickerInstalled === 'true') return;
  input.dataset.pickerInstalled = 'true';
  input.type = 'hidden';

  const label = input.closest('label');
  if (!label) return;
  label.classList.add('equipment-picker');
  label.childNodes[0].textContent = '';

  const title = document.createElement('span');
  title.textContent = 'Equipment you regularly have access to';
  const helper = document.createElement('div');
  helper.className = 'equipment-helper';
  helper.textContent = 'Choose all that apply. Arc uses this to keep workouts practical.';
  const options = document.createElement('div');
  options.className = 'equipment-options';

  const choices = [
    'Bodyweight only',
    'Dumbbells',
    'Adjustable bench',
    'Barbell + rack',
    'Kettlebells',
    'Resistance bands',
    'Cable machine',
    'Pull-up bar',
    'Cardio equipment',
    'Full gym'
  ];
  const selected = new Set();

  function sync() {
    input.value = [...selected].join(',');
    options.querySelectorAll('.equipment-chip').forEach(btn => {
      btn.classList.toggle('selected', selected.has(btn.dataset.value));
      btn.setAttribute('aria-pressed', selected.has(btn.dataset.value) ? 'true' : 'false');
    });
  }

  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'equipment-chip';
    btn.dataset.value = choice;
    btn.textContent = choice;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      if (choice === 'Bodyweight only') {
        selected.clear();
        selected.add(choice);
      } else if (choice === 'Full gym') {
        selected.clear();
        selected.add(choice);
      } else {
        selected.delete('Bodyweight only');
        selected.delete('Full gym');
        selected.has(choice) ? selected.delete(choice) : selected.add(choice);
      }
      sync();
    });
    options.appendChild(btn);
  });

  label.insertBefore(title, input);
  label.insertBefore(helper, input);
  label.insertBefore(options, input);
}

function createLoadingScene() {
  if ($('arcLoading')) return $('arcLoading');
  const overlay = document.createElement('div');
  overlay.id = 'arcLoading';
  overlay.className = 'arc-loading';
  overlay.setAttribute('aria-live', 'polite');
  overlay.innerHTML = `
    <div class="arc-loading-image" aria-hidden="true"></div>
    <div class="arc-loading-content">
      <div class="loading-arc" aria-hidden="true"></div>
      <span class="eyebrow light">Building your starting point</span>
      <h2>Your Arc is taking shape.</h2>
      <p>80 is the new 100. We’re setting your commitment so progress can stay aggressive without demanding perfection.</p>
    </div>`;
  document.body.appendChild(overlay);
  return overlay;
}

function installSetupLoading() {
  const form = $('setupForm');
  const gate = $('setupGate');
  if (!form || !gate || form.dataset.loadingInstalled === 'true') return;
  form.dataset.loadingInstalled = 'true';
  const overlay = createLoadingScene();

  form.addEventListener('submit', () => {
    const started = Date.now();
    overlay.classList.add('visible');

    const hide = () => {
      const elapsed = Date.now() - started;
      const delay = Math.max(0, 1100 - elapsed);
      window.setTimeout(() => overlay.classList.remove('visible'), delay);
    };

    const observer = new MutationObserver(() => {
      if (gate.classList.contains('hidden')) {
        observer.disconnect();
        hide();
      }
    });
    observer.observe(gate, { attributes: true, attributeFilter: ['class'] });

    window.setTimeout(() => {
      if (!gate.classList.contains('hidden')) overlay.classList.remove('visible');
      observer.disconnect();
    }, 6500);
  }, true);
}

function enhanceWeightTrend() {
  const chart = $('weightChart');
  const history = $('measurementHistory');
  const pill = $('weightTrendLabel');
  if (!chart || !history || !pill) return;

  const weightCells = [...history.querySelectorAll('tbody tr td:nth-child(2)')]
    .map(td => td.textContent.trim())
    .filter(value => value && value !== '—');

  if (weightCells.length === 1 && chart.classList.contains('empty-state')) {
    chart.className = 'weight-chart';
    chart.innerHTML = `
      <div class="trend-baseline">
        <div>
          <div class="baseline-dot" aria-hidden="true"></div>
          <div class="baseline-value">${weightCells[0]}</div>
          <div class="baseline-help">Baseline saved. Your next weight check-in will turn this into a trend.</div>
        </div>
      </div>`;
    pill.textContent = 'Baseline';
  }
}

function installWeightObserver() {
  const history = $('measurementHistory');
  const chart = $('weightChart');
  if (!history || !chart) return;
  const observer = new MutationObserver(() => window.setTimeout(enhanceWeightTrend, 0));
  observer.observe(history, { childList: true, subtree: true });
  observer.observe(chart, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  enhanceWeightTrend();
}

function install() {
  installEquipmentPicker();
  installSetupLoading();
  installWeightObserver();
}

window.addEventListener('DOMContentLoaded', install);
window.setTimeout(install, 0);