/* Prevent startup render passes from being mistaken for real Arc progress. */
const originalSetItem = Storage.prototype.setItem;
let guarding = true;
document.body.classList.add('arc-motion-booting');

Storage.prototype.setItem = function(key, value) {
  if (guarding && String(key).startsWith('arc:last-progress:')) return;
  return originalSetItem.call(this, key, value);
};

function finalArcIsReady() {
  const gauge = document.getElementById('arcGauge');
  if (!gauge) return false;
  const fill = parseFloat(gauge.style.getPropertyValue('--arc-fill'));
  const label = document.getElementById('arcGaugeLabel')?.textContent?.trim();
  return Number.isFinite(fill) && !!label && label !== 'BUILDING';
}

function releaseGuard() {
  if (!guarding) return;
  guarding = false;
  Storage.prototype.setItem = originalSetItem;
  observer.disconnect();
  document.querySelectorAll('.arc-gauge').forEach(gauge => gauge.classList.remove('arc-progress-pulse','arc-progress-pulse-strong','arc-threshold-flare'));
  document.body.classList.remove('arc-motion-booting');
  window.ArcRadiant?.sync?.();
}

const observer = new MutationObserver(() => {
  if (finalArcIsReady()) window.setTimeout(releaseGuard, 60);
});
observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['style','class'], characterData:true });
if (finalArcIsReady()) window.setTimeout(releaseGuard, 60);
setTimeout(releaseGuard, 1800);
