// ARC QA Sprint 1 — resilient Nutrition route/state normalization.
(function(){
  if(typeof S==='undefined')return;
  const DEFAULT_TARGETS={calories:2000,protein:145,carbs:210,fat:70};
  const key=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};

  function normalize(){
    let n=S.nutritionV1;
    if(!n||typeof n!=='object'||Array.isArray(n))n={};
    n.build=n.build||'0.7.2';
    n.activePlan=n.activePlan||'Mediterranean — Fat Loss';
    n.targets=n.targets&&typeof n.targets==='object'&&!Array.isArray(n.targets)?n.targets:{};
    for(const [k,v] of Object.entries(DEFAULT_TARGETS)){const x=+n.targets[k];n.targets[k]=Number.isFinite(x)&&x>0?x:v;}
    n.days=n.days&&typeof n.days==='object'&&!Array.isArray(n.days)?n.days:{};
    const k=key(),d=n.days[k]&&typeof n.days[k]==='object'&&!Array.isArray(n.days[k])?n.days[k]:{};
    d.meals=d.meals&&typeof d.meals==='object'&&!Array.isArray(d.meals)?d.meals:{};
    d.custom=Array.isArray(d.custom)?d.custom:[];
    n.days[k]=d;
    n.quickOpen=!!n.quickOpen;
    n.balanceDraft=n.balanceDraft==='foundation'?'foundation':'flex';
    S.nutritionV1=n;
    try{save()}catch(e){}
    return n;
  }

  function markNutritionActive(){
    document.querySelectorAll('.arc-nav button,.arc-mobile-nav button').forEach(b=>b.classList.toggle('active',b.dataset.go==='nutrition'));
  }

  const plannedRender=window.ArcNutrition&&typeof window.ArcNutrition.render==='function'?window.ArcNutrition.render:null;
  const legacy=typeof nutrition==='function'?nutrition:null;
  function safeNutrition(){
    normalize();
    try{
      if(plannedRender)plannedRender();
      else if(legacy)legacy();
      else throw new Error('Nutrition renderer unavailable');
      markNutritionActive();
    }catch(err){
      console.error('ARC Nutrition render recovery',err);
      const p=S.profile||{},l=S.logs||{};
      shell(`<div class="tool-page-head nutrition-tool-hero"><span class="eyebrow">Nutrition</span><h1>Your nutrition is safe.</h1><p>ARC recovered the Nutrition workspace without changing your saved entries.</p></div><section class="tool-panel"><div class="tool-panel-head"><div><span class="eyebrow">TODAY</span><h2>${(+l.cal||0).toLocaleString()} kcal · ${+l.protein||0}g protein</h2></div></div><p class="muted">Tracking mode: ${typeof esc==='function'?esc(String(p.nutrition||'Guided').split(' — ')[0]):'Guided'}</p><button class="btn secondary" data-go="today">Back to Today</button></section>`,'nutrition');
      markNutritionActive();
    }
  }

  try{nutrition=safeNutrition}catch(e){window.nutrition=safeNutrition}
  window.addEventListener('arc:rendered',()=>{if(S.screen==='nutrition')markNutritionActive()});
  normalize();
  window.ArcNutritionQA={normalize,render:safeNutrition,version:'1.0'};
})();