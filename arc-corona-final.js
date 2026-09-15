(function(){
  const getProgress = (stateText, metaText) => {
    const s = (stateText || '').toLowerCase();
    const m = (metaText || '').toLowerCase();
    const pct = /([0-9]+(?:\.[0-9]+)?)%/.exec(m);
    if (pct) return Math.max(0, Math.min(1, Number(pct[1]) / 80));
    if (s.includes('in your arc')) return 1;
    if (s.includes('closing')) return 0.78;
    if (s.includes('build')) return 0.38;
    if (m.includes('learning')) return 0.14;
    return 0.12;
  };

  function applyStage(container) {
    if (!container) return;
    let stage = container.querySelector('.arc-eclipse-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'arc-eclipse-stage';
      stage.innerHTML = `
        <div class="arc-corona-base"></div>
        <div class="arc-corona-fill"></div>
        <div class="arc-disk"></div>
        <div class="arc-label"><div class="arc-label-inner"><div class="arc-state"></div><div class="arc-meta"></div></div></div>
      `;
      container.appendChild(stage);
    }

    const stateSource = container.querySelector('[data-arc-state], .arc-gauge__state, .arc-state-text, .arc-state');
    const metaSource = container.querySelector('[data-arc-meta], .arc-gauge__meta, .arc-consistency, .arc-meta');
    const state = stateSource ? stateSource.textContent.trim() : 'Build momentum';
    const meta = metaSource ? metaSource.textContent.trim() : 'Learning';

    stage.querySelector('.arc-state').textContent = state;
    stage.querySelector('.arc-meta').textContent = meta;

    const next = getProgress(state, meta);
    const prev = Number(stage.dataset.progress || 0);
    stage.style.setProperty('--arc-progress', String(next));
    stage.classList.remove('is-rise', 'is-complete');
    if (next > prev + 0.02 && next < 1) stage.classList.add('is-rise');
    if (next >= 1 && prev < 1) stage.classList.add('is-complete');
    stage.dataset.progress = String(next);
  }

  function init() {
    document.querySelectorAll('.today-hero, .arc-hero, .arc-detail-hero, .arc-card--hero').forEach(applyStage);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  new MutationObserver(init).observe(document.body, {subtree:true, childList:true, characterData:true});
})();
