/* Preserve the last meaningful Arc position while the shell still shows its 0° placeholder.
   This lets progress pulses happen only on a real increase, and the 80% flare only on a real threshold crossing. */
const originalSetItem = Storage.prototype.setItem;
let guarding = true;

Storage.prototype.setItem = function(key, value) {
  if (guarding && String(key).startsWith('arc:last-progress:')) {
    const placeholder = document.getElementById('arcPercent')?.textContent?.trim();
    if (placeholder === '—' && Number(value) === 0) return;
  }
  return originalSetItem.call(this, key, value);
};

function releaseGuard() {
  if (!guarding) return;
  guarding = false;
  Storage.prototype.setItem = originalSetItem;
  observer.disconnect();
}

const observer = new MutationObserver(() => {
  const label = document.getElementById('arcPercent')?.textContent?.trim();
  if (label && label !== '—') releaseGuard();
});
observer.observe(document.body, { childList:true, subtree:true, characterData:true });
setTimeout(releaseGuard, 6000);
