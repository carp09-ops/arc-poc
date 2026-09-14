/* Hold Arc motion while the shell and legacy render passes settle.
   Only the final Arc render (THIS WEEK / CONSISTENCY / ARC COMPLETE)
   is allowed to compare against the last meaningful progress value. */
const originalSetItem = Storage.prototype.setItem;
let guarding = true;

document.body.classList.add('arc-motion-booting');

Storage.prototype.setItem = function(key, value) {
  if (guarding && String(key).startsWith('arc:last-progress:')) return;
  return originalSetItem.call(this, key, value);
};

function finalArcIsReady() {
  const percent = document.getElementById('arcPercent')?.textContent?.trim();
  const label = document.getElementById('arcGaugeLabel')?.textContent?.trim();
  if (!percent || percent === '—') return false;
  return ['THIS WEEK', 'CONSISTENCY', 'ARC COMPLETE'].includes(label);
}

function releaseGuard() {
  if (!guarding) return;
  guarding = false;
  Storage.prototype.setItem = originalSetItem;
  observer.disconnect();

  document.querySelectorAll('.arc-gauge').forEach(gauge => {
    gauge.classList.remove('arc-progress-pulse','arc-progress-pulse-strong','arc-threshold-flare');
  });
  document.body.classList.remove('arc-motion-booting');

  /* Nudge the existing Arc observer once, now that only the final state remains.
     It will compare this value to the last meaningful value from the prior session. */
  const hero = document.getElementById('arcGauge');
  if (hero) {
    hero.classList.add('arc-motion-sync');
    requestAnimationFrame(() => hero.classList.remove('arc-motion-sync'));
  }
}

const observer = new MutationObserver(() => {
  if (finalArcIsReady()) window.setTimeout(releaseGuard, 60);
});
observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['style','class'], characterData:true });

if (finalArcIsReady()) window.setTimeout(releaseGuard, 60);
setTimeout(releaseGuard, 6500);
