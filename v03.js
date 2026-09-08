// Arc POC 0.3 visual prototype — preserves the 0.2 data model and interactions.
body=function(){
  const p=S.profile||{},w=p.weight||'—',wa=p.waist||'—';
  shell(`<div class="top"><div><span class="eyebrow">Body</span><h2>Your Body</h2></div><div class="avatar"></div></div>
  <p class="muted">A visual record of how your body is changing over time.</p>
  <div class="body-layout">
    <div>
      <div class="body-hero">
        <svg class="body-figure" viewBox="0 0 260 430" role="img" aria-label="Body progress silhouette">
          <ellipse class="hair" cx="130" cy="47" rx="29" ry="34"/>
          <circle class="skin" cx="130" cy="55" r="23"/>
          <path class="skin" d="M109 80 C91 92 88 116 86 145 C83 176 75 202 67 228 C61 246 70 252 79 238 C88 220 97 198 101 176 L101 284 C98 316 96 348 98 392 C99 410 112 412 116 393 L126 293 L134 293 L144 393 C148 412 161 410 162 392 C164 348 162 316 159 284 L159 176 C163 198 172 220 181 238 C190 252 199 246 193 228 C185 202 177 176 174 145 C172 116 169 92 151 80 Z"/>
          <path class="wear" d="M106 82 C115 90 145 90 154 82 L164 151 C154 163 106 163 96 151 Z"/>
          <path class="wear" d="M98 151 C111 160 149 160 162 151 L165 232 C153 245 107 245 95 232 Z"/>
          <circle class="mark" cx="130" cy="161" r="3"/><circle class="mark" cx="130" cy="228" r="3"/>
        </svg>
        <div class="body-callout weight">Weight · ${w}${w==='—'?'':' lb'}</div>
        <div class="body-callout waist">Waist · ${wa}${wa==='—'?'':' in'}</div>
        <div class="body-callout hips">Body map</div>
      </div>
      <div class="body-caption">Your visual is a progress reference—not a judgment or a diagnosis.</div>
      <div class="body-section-title"><h3>Representation</h3><small>Optional</small></div>
      <div class="body-chip-row">
        ${['Balanced','Lower curve','Upper curve','Straight','Soft curve'].map((x,i)=>`<button class="body-chip ${i===0?'active':''}" type="button"><div class="mini"></div>${x}</button>`).join('')}
      </div>
      <p class="tiny muted">This changes only how your Body view is represented. Arc does not prescribe training based on a body-shape label.</p>
    </div>
    <div>
      <div class="card body-insight"><div class="pulse">✦</div><div><span class="eyebrow">Body Intelligence</span><h3 style="margin-top:7px">The trend is the story.</h3><p class="tiny muted">Arc compares weight, measurements, training and consistency over time so one number never defines your progress.</p></div></div>
      <div class="body-section-title"><h3>Your Measurements</h3><small>${S.logs.bodyChecks||0} check-ins</small></div>
      <div class="measure-grid">
        <div class="measure-tile"><span>Weight</span><b>${w}${w==='—'?'':' lb'}</b></div>
        <div class="measure-tile"><span>Waist</span><b>${wa}${wa==='—'?'':' in'}</b></div>
        <div class="measure-tile"><span>Hips</span><b>—</b></div>
        <div class="measure-tile"><span>Chest</span><b>—</b></div>
      </div>
      <button class="btn" style="margin-top:12px" data-measure>Update Measurements</button>
      <div class="card" style="margin-top:14px"><span class="eyebrow">Coming alive over time</span><h3 style="margin-top:7px">Your Body Map will become a timeline.</h3><p class="tiny muted">As Kimberly logs check-ins, Arc can show measurement deltas directly on the figure and connect them to training, nutrition and activity Signals.</p></div>
    </div>
  </div>`, 'body');
};

// Re-render the Body view immediately when a cached session opens there.
if(typeof S!=='undefined' && S.screen==='body') body();
