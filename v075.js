// ARC 0.7.5 — Today 80/20 Arc
(function(){
if(typeof S==='undefined')return;
const BUILD='0.7.5',oldToday=typeof today==='function'?today:null;
let pending=null;
const key=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const fmt=n=>Math.round(+n||0).toLocaleString();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,+n||0));
const safe=v=>typeof esc==='function'?esc(v):String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

function state(){
 if(!S.nutritionV1)return null;
 S.nutritionV1.days=S.nutritionV1.days||{};
 const d=S.nutritionV1.days[key()]||(S.nutritionV1.days[key()]={meals:{},custom:[]});
 d.meals=d.meals||{};d.custom=Array.isArray(d.custom)?d.custom:[];
 d.custom.forEach(x=>{if(!x.balance)x.balance='flex'});
 S.nutritionV1.balanceDraft=S.nutritionV1.balanceDraft||'flex';
 return d;
}
function plan(){return window.ArcNutrition?.plan?.[new Date().getDay()]||null}
function snap(m,r={}){const p=+r.portion||1;return{name:r.swap?(m.swap||m.name):m.name,cal:Math.round((r.swap?m.cal*.98:m.cal)*p)}}
function breakdown(){
 const d=state(),p=plan(),target=Math.max(1,+S.nutritionV1?.targets?.calories||2000),foundationTarget=Math.round(target*.8),flexTarget=target-foundationTarget;
 let foundation=0,flex=0;const foundationItems=[],flexItems=[];
 if(d&&p){p.meals.forEach(m=>{const r=d.meals[m.id]||{};if(!r.logged)return;const x=snap(m,r);foundation+=x.cal;foundationItems.push({...x,kind:'Planned meal'})});d.custom.forEach(x=>{const item={name:x.name||'Food',cal:Math.max(0,+x.calories||0),kind:'Custom log'};if(x.balance==='foundation'){foundation+=item.cal;foundationItems.push(item)}else{flex+=item.cal;flexItems.push(item)}})}
 const total=foundation+flex,foundationRatio=total?foundation/total*100:0,flexRatio=total?flex/total*100:0;
 return{target,foundationTarget,flexTarget,foundation,flex,total,foundationRatio,flexRatio,foundationItems,flexItems};
}
function copy(b){
 if(!b.total)return{k:'YOUR DAY IS OPEN',h:'Start with your foundation.',p:'Today doesn’t need to be perfect. Build most of it around foods that support your plan and leave some room for real life.'};
 if(!b.flex)return{k:'FOUNDATION BUILDING',h:'Your foundation is taking shape.',p:'Flex is available when you want it—not something you need to use.'};
 if(b.flex>b.flexTarget)return{k:'A MORE FLEXIBLE DAY',h:'Focus on your foundation from here.',p:'No reset required. Keep the next choice simple: protein, produce, and the plan in front of you.'};
 if(b.foundationRatio>=80)return{k:'BALANCED SO FAR',h:'Strong foundation today.',p:'You’re leaving room for flexibility without losing the shape of the day.'};
 return{k:'FLEX IN USE',h:'There’s still room to shape the day.',p:'The 80/20 Arc is a guide, not a grade. Your next planned meal can naturally rebalance things.'};
}
function svg(b){
 const f=clamp(b.foundation/b.foundationTarget*80,0,80),x=clamp(b.flex/b.flexTarget*20,0,20);
 return `<svg class="arc8020-svg" viewBox="0 0 320 255" role="img" aria-label="Today’s 80/20 Arc. ${b.total?`${Math.round(b.foundationRatio)} percent Foundation and ${Math.round(b.flexRatio)} percent Flex.`:'No nutrition logged yet.'}"><path class="arc8020-track" pathLength="100" d="M40 205 A128 128 0 1 1 280 205"/><path class="arc8020-guide foundation" pathLength="100" stroke-dasharray="79 21" d="M40 205 A128 128 0 1 1 280 205"/><path class="arc8020-guide flex" pathLength="100" stroke-dasharray="19 81" stroke-dashoffset="-81" d="M40 205 A128 128 0 1 1 280 205"/>${f?`<path class="arc8020-fill foundation" pathLength="100" stroke-dasharray="${f} ${100-f}" d="M40 205 A128 128 0 1 1 280 205"/>`:''}${x?`<path class="arc8020-fill flex" pathLength="100" stroke-dasharray="${x} ${100-x}" stroke-dashoffset="-80" d="M40 205 A128 128 0 1 1 280 205"/>`:''}<circle class="arc8020-split" cx="270.7" cy="114.4" r="3.5"/></svg>`;
}
function markup(){
 const b=breakdown(),c=copy(b),ratio=b.total?`${Math.round(b.foundationRatio)} / ${Math.round(b.flexRatio)}`:'80 / 20';
 return `<section class="arc8020-card" data-arc8020-card tabindex="0" aria-label="Today’s 80/20 Arc. Open balance details."><div class="arc8020-copy"><div><span class="eyebrow">TODAY’S 80/20 ARC</span><h2>${safe(c.h)}</h2><p>${safe(c.p)}</p></div><button type="button" data-arc8020-details>How 80/20 works →</button></div><div class="arc8020-visual">${svg(b)}<div class="arc8020-center"><small>${c.k}</small><b>${ratio}</b><span>${b.total?`${fmt(b.total)} kcal logged`:'guide'}</span></div></div><div class="arc8020-stats"><div class="foundation"><i></i><span><small>FOUNDATION</small><b>${fmt(b.foundation)} <em>/ ~${fmt(b.foundationTarget)} kcal</em></b></span></div><div class="flex"><i></i><span><small>FLEX</small><b>${fmt(b.flex)} <em>/ ~${fmt(b.flexTarget)} kcal</em></b></span></div></div><footer><span>80/20 is a guide to the shape of your day—not a grade on your behavior.</span><b>View balance →</b></footer></section>`;
}
function inject(){
 if(S.screen!=='today')return;const stage=document.querySelector('.arc-stage')||document.querySelector('.phone');if(!stage||stage.querySelector('.arc8020-card'))return;
 const w=document.createElement('div');w.innerHTML=markup();const card=w.firstElementChild,passive=stage.querySelector('.arc-passive-morning'),hero=stage.querySelector('.cinema-hero'),weekly=stage.querySelector('.v06-weekly-teaser');
 if(passive)passive.insertAdjacentElement('afterend',card);else if(hero)hero.insertAdjacentElement('afterend',card);else if(weekly)weekly.insertAdjacentElement('beforebegin',card);else stage.prepend(card);
}
function today075(){if(oldToday)oldToday();setTimeout(inject,0)}
if(oldToday){try{today=today075}catch(e){window.today=today075}}

function decorateNutrition(){
 const root=document.querySelector('.arc-nutrition-today'),d=state();if(!root||!d)return;
 const quick=root.querySelector('.arc-quick-log');if(quick&&!quick.querySelector('.arc8020-choice')){const add=quick.querySelector('[data-arc-add-custom]');if(add){const el=document.createElement('div');el.className='arc8020-choice';el.innerHTML=`<div><span class="eyebrow">HOW DOES THIS FIT TODAY?</span><p>Choose Foundation if this replaces a planned meal. Choose Flex if it’s something extra.</p></div><div class="arc8020-choice-buttons"><button type="button" data-arc8020-draft="foundation" class="${S.nutritionV1.balanceDraft==='foundation'?'active':''}">Foundation</button><button type="button" data-arc8020-draft="flex" class="${S.nutritionV1.balanceDraft!=='foundation'?'active':''}">Flex</button></div>`;add.insertAdjacentElement('beforebegin',el)}}
 const log=root.querySelector('.arc-custom-log');if(log){const eyebrow=log.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent='CUSTOM LOGS'}
 root.querySelectorAll('.arc-custom-row').forEach((row,i)=>{if(row.querySelector('[data-arc8020-toggle-custom]')||!d.custom[i])return;const x=d.custom[i],info=row.querySelector('div');if(info)info.insertAdjacentHTML('beforeend',`<button type="button" class="arc8020-custom-chip ${x.balance}" data-arc8020-toggle-custom="${i}">${x.balance==='foundation'?'Foundation':'Flex'} · change</button>`)})
}
function rows(items,empty){return items.length?items.map(x=>`<div class="arc8020-detail-row"><span><b>${safe(x.name)}</b><small>${safe(x.kind)}</small></span><strong>${fmt(x.cal)} kcal</strong></div>`).join(''):`<div class="arc8020-detail-empty">${empty}</div>`}
function close(){document.querySelector('.arc8020-overlay')?.remove();document.body.classList.remove('arc8020-modal-open')}
function details(){
 close();const b=breakdown(),ratio=b.total?`${Math.round(b.foundationRatio)} / ${Math.round(b.flexRatio)}`:'80 / 20 guide',el=document.createElement('div');el.className='arc8020-overlay';el.innerHTML=`<div class="arc8020-backdrop" data-arc8020-close></div><section class="arc8020-sheet" role="dialog" aria-modal="true" aria-label="Today’s 80/20 balance"><header><div><span class="eyebrow">TODAY’S BALANCE</span><h2>${ratio}</h2><p>${fmt(b.foundation)} kcal Foundation · ${fmt(b.flex)} kcal Flex</p></div><button type="button" data-arc8020-close aria-label="Close">×</button></header><div class="arc8020-detail-columns"><section><div class="arc8020-detail-title foundation"><i></i><span><small>FOUNDATION</small><b>${fmt(b.foundation)} / ~${fmt(b.foundationTarget)} kcal</b></span></div>${rows(b.foundationItems,'No Foundation foods logged yet.')}</section><section><div class="arc8020-detail-title flex"><i></i><span><small>FLEX</small><b>${fmt(b.flex)} / ~${fmt(b.flexTarget)} kcal</b></span></div>${rows(b.flexItems,'No Flex foods logged yet.')}</section></div><div class="arc8020-philosophy"><b>Build a strong foundation. Leave room for real life.</b><p>80/20 is not a pass/fail target. ARC uses it as a simple guide for sustainable consistency. A 100/0 day is fine. A more flexible day doesn’t require a reset.</p></div></section>`;document.body.appendChild(el);document.body.classList.add('arc8020-modal-open');
}

document.addEventListener('click',e=>{if(e.target.closest('[data-arc-add-custom]'))pending={n:state()?.custom?.length||0,b:S.nutritionV1?.balanceDraft||'flex'}},true);
document.addEventListener('click',e=>{
 const draft=e.target.closest('[data-arc8020-draft]');if(draft){S.nutritionV1.balanceDraft=draft.dataset.arc8020Draft;save();document.querySelectorAll('[data-arc8020-draft]').forEach(x=>x.classList.toggle('active',x.dataset.arc8020Draft===S.nutritionV1.balanceDraft));return}
 if(e.target.closest('[data-arc-add-custom]')&&pending){const d=state();if(d&&d.custom.length>pending.n){d.custom[d.custom.length-1].balance=pending.b;save();window.ArcNutrition?.render?.()}pending=null;return}
 const toggle=e.target.closest('[data-arc8020-toggle-custom]');if(toggle){const x=state()?.custom?.[+toggle.dataset.arc8020ToggleCustom];if(x){x.balance=x.balance==='foundation'?'flex':'foundation';save();window.ArcNutrition?.render?.()}return}
 if(e.target.closest('[data-arc8020-details]')||e.target.closest('.arc8020-card')){details();return}
 if(e.target.closest('[data-arc8020-close]'))close();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close();const c=e.target.closest?.('.arc8020-card');if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();details()}});
const mo=new MutationObserver(()=>{if(S.screen==='today')inject();decorateNutrition()});mo.observe(document.body,{childList:true,subtree:true});
state();save();if(S.screen==='today')setTimeout(inject,0);if(S.screen==='nutrition')setTimeout(decorateNutrition,0);
window.Arc8020={breakdown,renderToday:inject,version:BUILD};
})();