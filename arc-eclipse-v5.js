/* Arc Eclipse v5 helper.
   Add after earlier Arc scripts.
   It maps your existing Arc state to the new eclipse visual and animations.
*/
(function () {
  const stateToProgress = (state, consistencyText) => {
    const text = (consistencyText || '').toLowerCase();
    const pctMatch = text.match(/(\d+(?:\.\d+)?)%/);
    const pct = pctMatch ? Math.max(0, Math.min(100, parseFloat(pctMatch[1]))) : null;
    if (pct != null) return Math.min(1, pct / 80);
    const s = (state || '').toLowerCase();
    if (s.includes('in your arc')) return 1;
    if (s.includes('closing')) return 0.78;
    if (s.includes('build')) return 0.42;
    return 0.24;
  };

  const enhance = (root) => {
    const card = root.querySelector('.arc-eclipse, .arc-hero-eclipse, .arc-visual');
    if (!card) return;

    const stateEl = root.querySelector('.arc-state, .arc-eclipse__state, .arc-visual__state, [data-arc-state]');
    const metaEl = root.querySelector('.arc-consistency, .arc-eclipse__meta, .arc-visual__meta, [data-arc-meta]');

    const stateText = stateEl ? stateEl.textContent.trim() : 'Build momentum';
    const metaText  = metaEl ? metaEl.textContent.trim()  : 'Learning';

    let label = card.querySelector('.arc-eclipse__label');
    if (!label) {
      label = document.createElement('div');
      label.className = 'arc-eclipse__label';
      label.innerHTML = '<div><div class="arc-eclipse__state"></div><div class="arc-eclipse__meta"></div></div>';
      card.appendChild(label);
    }

    label.querySelector('.arc-eclipse__state').textContent = stateText;
    label.querySelector('.arc-eclipse__meta').textContent = metaText;

    const progress = stateToProgress(stateText, metaText);
    const previous = parseFloat(getComputedStyle(card).getPropertyValue('--arc-progress')) || 0;
    card.style.setProperty('--arc-progress', String(progress));

    card.classList.remove('is-closing', 'is-complete');
    if (progress >= 1 && previous < 1) {
      card.classList.add('is-complete');
    } else if (progress > previous) {
      card.classList.add('is-closing');
    }
  };

  const run = () => {
    document.querySelectorAll('.today-hero, .arc-card, .arc-panel, body').forEach(enhance);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  const obs = new MutationObserver(() => run());
  obs.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
