/* Final Arc corona integration.
   Uses the existing .arc-gauge DOM and injects only true-alpha corona image layers. */

const CORONA_SRC = './assets/fiery_solar_eclipse_corona_overlay.png?v=ready24';

function readProgressRatio(gauge) {
  const fill = parseFloat(gauge.style.getPropertyValue('--arc-fill'));
  if (Number.isFinite(fill)) return Math.max(0, Math.min(1, fill / 100));
  const degrees = parseFloat(gauge.style.getPropertyValue('--progress'));
  if (Number.isFinite(degrees)) return Math.max(0, Math.min(1, degrees / 360));
  return 0;
}

function syncGauge(gauge) {
  if (!gauge) return;
  const ratio = readProgressRatio(gauge);
  const previous = Number(gauge.dataset.coronaProgress || 0);
  gauge.style.setProperty('--arc-progress-ratio', String(ratio));
  gauge.classList.remove('is-rise', 'is-complete');
  if (ratio >= 1 && previous < 1) gauge.classList.add('is-complete');
  else if (ratio > previous + .01) gauge.classList.add('is-rise');
  gauge.dataset.coronaProgress = String(ratio);
}

function ensureCorona(gauge) {
  if (!gauge) return;

  let base = gauge.querySelector(':scope > .arc-corona-base');
  let fill = gauge.querySelector(':scope > .arc-corona-fill');

  if (!base) {
    base = document.createElement('img');
    base.className = 'arc-corona-base';
    base.src = CORONA_SRC;
    base.alt = '';
    base.setAttribute('aria-hidden', 'true');
    base.decoding = 'async';
    base.draggable = false;
  }

  if (!fill) {
    fill = document.createElement('img');
    fill.className = 'arc-corona-fill';
    fill.src = CORONA_SRC;
    fill.alt = '';
    fill.setAttribute('aria-hidden', 'true');
    fill.decoding = 'async';
    fill.draggable = false;
  }

  const inner = gauge.querySelector(':scope > .arc-gauge-inner');
  if (!base.isConnected) inner ? gauge.insertBefore(base, inner) : gauge.prepend(base);
  if (!fill.isConnected) inner ? gauge.insertBefore(fill, inner) : gauge.appendChild(fill);

  /* Remove the old black-background photographic layer if it survived a cached build. */
  gauge.querySelectorAll(':scope > .arc-photo-corona').forEach(el => el.remove());
  syncGauge(gauge);
}

function enhanceAll() {
  document.querySelectorAll('.arc-gauge').forEach(ensureCorona);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', enhanceAll, { once: true });
} else {
  enhanceAll();
}

const treeObserver = new MutationObserver(enhanceAll);
treeObserver.observe(document.documentElement, { childList: true, subtree: true });

const styleObserver = new MutationObserver(records => {
  records.forEach(record => {
    if (record.target instanceof HTMLElement && record.target.matches('.arc-gauge')) syncGauge(record.target);
  });
});

function observeGaugeStyles() {
  document.querySelectorAll('.arc-gauge').forEach(gauge => {
    if (gauge.dataset.coronaObserved === '1') return;
    gauge.dataset.coronaObserved = '1';
    styleObserver.observe(gauge, { attributes: true, attributeFilter: ['style'] });
  });
}

enhanceAll();
observeGaugeStyles();
new MutationObserver(observeGaugeStyles).observe(document.documentElement, { childList: true, subtree: true });
