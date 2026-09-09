// ARC 0.7.5 — Today 80/20 Arc
(function(){
  if(typeof S==='undefined') return;
  const BUILD='0.7.5';
  const priorToday=typeof today==='function'?today:null;
  let pendingCustom=null;

  const dayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const fmt=n=>Math.round(Number(n)||0).toLocaleString();
  const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Number(n)||0));
  const safe=v=>typeof esc==='function'?esc(v):String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function nutritionState(){
    if(!S.nutritionV1) return null;
    const key=dayKey();
    if(!S.nutritionV1.days)S.nutritionV1.days={};
    if(!S.nutritionV1.days[key])S.nutritionV1.days[key]={meals:{},custom:[]};
    const day=S.nutritionV1.days[key];
    if(!day.meals)day.meals={};
    if(!Array.isArray(day.custom))day.custom=[];
    day.custom.forEach(x=>{if(!x.balance)x.balance='flex'}); // Existing "off plan" logs migrate safely to Flex.
    if(!S.nutritionV1.balanceDraft)S.nutritionV1.balanceDraft='flex';
    return day;
  }

  function planToday(){return window.ArcNutrition?.plan?.[new Date().getDay()]||null}
  function mealSnapshot(base,rec={}){
    const portion=Number(rec.portion||1);
    const cal=Math.round((rec.swap?base.cal*.98:base.cal)*portion);
    const name=rec.swap?(base.swap||base.name):base.name;
    return {name,cal};
  }

  function breakdown(){
    const day=nutritionState(),plan=planToday();
    const target=Math.max(1,Number(S.nutritionV1?.targets?.calories)||2000);
    const foundationTarget=Math.round(target*.8),flexTarget=target-foundationTarget;
    let foundation=0,flex=0;
    const foundationItems=[],flexItems=[];
    if(day&&plan){
      plan.meals.forEach(base=>{
        const rec=day.meals[base.id]||{};
        if(!rec.logged)return;
        const x=mealSnapshot(base,rec);foundation+=x.cal;foundationItems.push({...x,kind:'Planned meal'});
      });
      day.custom.forEach(x=>{
        const cal=Math.max(0,+x.calories||0),item={name:x.name||'Food',cal,kind:'Custom log'};
        if(x.balance==='foundation'){foundation+=cal;foundationItems.push(item)}else{flex+=cal;flexItems.push(item)}
      });
    }
    const total=foundation+flex;
    const foundationRatio=total?foundation/total*100:0,flexRatio=total?flex/total*100:0;
    return {target,foundationTarget,flexTarget,foundation,flex,total,foundationRatio,flexRatio,foundationItems,flexItems};
  }

  function message(b){
    if(!b.total)return {kicker:'YOUR DAY IS OPEN',title:'Start with your foundation.',body:'Today doesn’t need to be perfect. Build most of it around foods that support your plan and leave some room for real life.'};
    if(!b.flex)return {kicker:'FOUNDATION BUILDING',title:'Your foundation is taking shape.',body:'Flex is available when you want it—not something you need to use.'};
    if(b.flex>b.flexTarget)return {kicker:'A MORE FLEXIBLE DAY',title:'Focus on your foundation from here.',body:'No reset required. Keep the next choice simple: protein, produce, and the plan in front of you.'};
    if(b.foundationRatio>=80)return {kicker:'BALANCED SO FAR',title:'Strong foundation today.',body:'You’re leaving room for flexibility without losing the shape of the day.'};
    if(b.flexRatio>=15)return {kicker:'FLEX IN USE',title:'There’s still room to shape the day.',body:'The 80/20 Arc is a guide, not a grade. Your next planned meal can naturally rebalance things.'};
    return {kicker:'BALANCED SO FAR',title:'Your day has a strong shape.',body:'Keep following the plan and let flexibility fit where real life needs it.'};
  }

  function arcSvg(b){
    const fFill=clamp(b.foundation/b.foundationTarget*80,0,80);
    const xFill=clamp(b.flex/b.flexTarget*20,0,20);
    return `<svg class="arc8020-svg" viewBox="0 0 320 255" role="img" aria-label="Today’s 80/20 Arc. ${b.total?`${Math.round(b.foundationRatio)} percent Foundation and ${Math.round(b.flexRatio)} percent Flex.`:'No nutrition logged yet.'}">
      <path class="arc8020-track" pathLength="100" d="M40 205 A128 128 0 1 1 280 205" />
      <path class="arc8020-guide foundation" pathLength="100" stroke-dasharray="79 21" d="M40 205 A128 128 0 1 1 280 205" />
      <path class="arc8020-guide flex" pathLength="100" stroke-dasharray="19 81" stroke-dashoffset="-81" d="M40 205 A128 128 0 1 1 280 205" />
      ${fFill?`<path class="arc8020-fill foundation" pathLength="100" stroke-dasharray="${fFill} ${100-fFill}" d="M40 205 A128 128 0 1 1 280 205" />`:''}
      ${xFill?`<path class="arc8020-fill flex" pathLength="100" stroke-dasharray="${xFill} ${100-xFill}" stroke-dashoffset="-80" d="M40 205 A128 128 0 1 1 280 205" />`:''}
      <circle class="arc8020-split" cx="270.7" cy="114.4" r="3.5" />
    </svg>`;
  }

  function cardMarkup(compact=false){
    const b=breakdown(),m=message(b);
    const ratio=b.total?`${Math.round(b.foundationRatio)} / ${Math.round(b.flexRatio)}`:'80 / 20';
    return `<section class="arc8020-card ${compact?'compact':''}" data-arc8020-card tabindex="0" aria-label="Today’s 80/20 Arc. Open balance details.">
      <div class="arc8020-copy"><div><span class="eyebrow">TODAY’S 80/20 ARC</span><h2>${safe(m.title)}</h2><p>${safe(m.body)}</p></div><button type="button" data-arc8020-details>How 80/20 works →</button></div>
      <div class="arc8020-visual">
        ${arcSvg(b)}
        <div class="arc8020-center"><small>${m.kicker}</small><b>${ratio}</b><span>${b.total?`${fmt(b.total)} kcal logged`:'guide'}</span></div>
      </div>
      <div class="arc8020-stats">
        <div class="foundation"><i></i><span><small>FOUNDATION</small><b>${fmt(b.foundation)} <em>/ ~${fmt(b.foundationTarget)} kcal</em></b></span></div>
        <div class="flex"><i></i><span><small>FLEX</small><b>${fmt(b.flex)} <em>/ ~${fmt(b.flexTarget)} kcal</em></b></span></div>
      </div>
      <footer><span>80/20 is a guide to the shape of your day—not a grade on your behavior.</span><b>View balance →</b></footer>
    </section>`;
  }

  function injectToday(){
    if(S.screen!=='today')return;
    const stage=document.querySelector('.arc-stage')||document.querySelector('.phone');if(!stage)return;
    const current=stage.querySelector('.arc8020-card');
    if(current){const wrap=document.createElement('div');wrap.innerHTML=cardMarkup();current.replaceWith(wrap.firstElementChild);return}
    const passive=stage.querySelector('.arc-passive-morning');
    const hero=stage.querySelector('.cinema-hero');
    const weekly=stage.querySelector('.v06-weekly-teaser');
    const wrap=document.createElement('div');wrap.innerHTML=cardMarkup();const card=wrap.firstElementChild;
    if(passive)passive.insertAdjacentElement('afterend',card);
    else if(hero)hero.insertAdjacentElement('afterend',card);
    else if(weekly)weekly.insertAdjacentElement('beforebegin',card);
    else stage.prepend(card);
  }

  function todayV075(){if(priorToday)priorToday();setTimeout(injectToday,0)}
  if(priorToday){try{today=todayV075}catch(e){window.today=todayV075}}

  function decorateNutrition(){
    const root=document.querySelector('.arc-nutrition-today');if(!root)return;
    const day=nutritionState();if(!day)return;
    const quick=root.querySelector('.arc-quick-log');
    if(quick&&!quick.querySelector('.arc8020-choice')){
      const add=quick.querySelector('[data-arc-add-custom]');
      if(add){
        const choice=document.createElement('div');choice.className='arc8020-choice';
        choice.innerHTML=`<div><span class="eyebrow">HOW DOES THIS FIT TODAY?</span><p>Choose Foundation if this replaces a planned meal. Choose Flex if it’s something extra.</p></div><div class="arc8020-choice-buttons"><button type="button" data-arc8020-draft="foundation" class="${S.nutritionV1.balanceDraft==='foundation'?'active':''}">Foundation</button><button type="button" data-arc8020-draft="flex" class="${S.nutritionV1.balanceDraft!=='foundation'?'active':''}">Flex</button></div>`;
        add.insertAdjacentElement('beforebegin',choice);
      }
    }
    const log=root.querySelector('.arc-custom-log');
    if(log){const eyebrow=log.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent='CUSTOM LOGS'}
    root.querySelectorAll('.arc-custom-row').forEach((row,i)=>{
      if(row.querySelector('[data-arc8020-toggle-custom]'))return;
      const x=day.custom[i];if(!x)return;
      const info=row.querySelector('div');
      if(info)info.insertAdjacentHTML('beforeend',`<button type="button" class="arc8020-custom-chip ${x.balance}" data-arc8020-toggle-custom="${i}">${x.balance==='foundation'?'Foundation':'Flex'} · change</button>`);
    });
  }

  function detailRows(items,empty){return items.length?items.map(x=>`<div class="arc8020-detail-row"><span><b>${safe(x.name)}</b><small>${safe(x.kind)}</small></span><strong>${fmt(x.cal)} kcal</strong></div>`).join(''):`<div class="arc8020-detail-empty">${empty}</div>`}
  function closeDetails(){document.querySelector('.arc8020-overlay')?.remove();document.body.classList.remove('arc8020-modal-open')}
  function openDetails(){
    closeDetails();const b=breakdown(),ratio=b.total?`${Math.round(b.foundationRatio)} / ${Math.round(b.flexRatio)}`:'80 / 20 guide';
    const el=document.createElement('div');el.className='arc8020-overlay';
    el.innerHTML=`<div class="arc8020-backdrop" data-arc8020-close></div><section class="arc8020-sheet" role="dialog" aria-modal="true" aria-label="Today’s 80/20 balance"><header><div><span class="eyebrow">TODAY’S BALANCE</span><h2>${ratio}</h2><p>${fmt(b.foundation)} kcal Foundation · ${fmt(b.flex)} kcal Flex</p></div><button type="button" data-arc8020-close aria-label="Close">×</button></header><div class="arc8020-detail-columns"><section><div class="arc8020-detail-title foundation"><i></i><span><small>FOUNDATION</small><b>${fmt(b.foundation)} / ~${fmt(b.foundationTarget)} kcal</b></span></div>${detailRows(b.foundationItems,'No Foundation foods logged yet.')}</section><section><div class="arc8020-detail-title flex"><i></i><span><small>FLEX</small><b>${fmt(b.flex)} / ~${fmt(b.flexTarget)} kcal</b></span></div>${detailRows(b.flexItems,'No Flex foods logged yet.')}</section></div><div class="arc8020-philosophy"><b>Build a strong foundation. Leave room for real life.</b><p>80/20 is not a pass/fail target. ARC uses it as a simple guide for sustainable consistency. A 100/0 day is fine. A more flexible day doesn’t require a reset.</p></div></section>`;
    document.body.appendChild(el);document.body.classList.add('arc8020-modal-open');
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-arc-add-custom]'))pendingCustom={length:nutritionState()?.custom?.length||0,balance:S.nutritionV1?.balanceDraft||'flex'};
  },true);

  document.addEventListener('click',e=>{
    const draft=e.target.closest('[data-arc8020-draft]');
    if(draft){S.nutritionV1.balanceDraft=draft.dataset.arc8020Draft;save();decorateNutrition();rootChoiceRefresh();return}

    if(e.target.closest('[data-arc-add-custom]')&&pendingCustom){
      const day=nutritionState();
      if(day&&day.custom.length>pendingCustom.length){day.custom[day.custom.length-1].balance=pendingCustom.balance;save();window.ArcNutrition?.render?.()}
      pendingCustom=null;return;
    }

    const toggle=e.target.closest('[data-arc8020-toggle-custom]');
    if(toggle){const day=nutritionState(),x=day?.custom?.[+toggle.dataset.arc8020ToggleCustom];if(x){x.balance=x.balance==='foundation'?'flex':'foundation';save();window.ArcNutrition?.render?.()}return}

    if(e.target.closest('[data-arc8020-details]')||e.target.closest('.arc8020-card')){openDetails();return}
    if(e.target.closest('[data-arc8020-close]')){closeDetails();return}
  });

  function rootChoiceRefresh(){
    document.querySelectorAll('[data-arc8020-draft]').forEach(btn=>btn.classList.toggle('active',btn.dataset.arc8020Draft===S.nutritionV1.balanceDraft));
  }

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape')closeDetails();
    const card=e.target.closest?.('.arc8020-card');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openDetails()}
  });

  const mo=new MutationObserver(()=>{if(S.screen==='today')injectToday();decorateNutrition()});
  mo.observe(document.body,{childList:true,subtree:true});

  nutritionState();save();
  if(S.screen==='today')setTimeout(injectToday,0);
  if(S.screen==='nutrition')setTimeout(decorateNutrition,0);
  window.Arc8020={breakdown,renderToday:injectToday,version:BUILD};
})();