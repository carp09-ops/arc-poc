// Arc 0.7.2 — Nutrition Today + Mediterranean Guided Plan
(function(){
  const BUILD='0.7.2';
  const TARGETS={calories:2000,protein:145,carbs:210,fat:70};
  const PLAN=[
    {day:'Sunday',meals:[
      {id:'breakfast',label:'BREAKFAST',name:'Banana walnut oatmeal',detail:'½ cup oats · 1 banana · ¾ cup Greek yogurt · 1 tbsp walnuts · cinnamon',cal:430,protein:24,carbs:63,fat:12,fiber:9,swap:'Eggs, whole-grain toast + fruit'},
      {id:'lunch',label:'LUNCH',name:'Turkey hummus sandwich',detail:'Whole-grain bread · 4 oz turkey · hummus · spinach · tomato · apple',cal:490,protein:36,carbs:58,fat:13,fiber:10,swap:'Chicken hummus pita + fruit'},
      {id:'dinner',label:'DINNER',name:'Sheet-pan lemon chicken',detail:'6 oz chicken · 8 oz potatoes · zucchini · peppers · onions · 2 tsp olive oil',cal:660,protein:52,carbs:64,fat:22,fiber:9,swap:'Salmon sheet pan + vegetables'},
      {id:'snack',label:'SNACK',name:'Greek yogurt + berries',detail:'1 cup Greek yogurt · 1 cup berries · 1 tsp honey',cal:250,protein:23,carbs:31,fat:3,fiber:6,swap:'Apple + 1 tbsp peanut butter'}]},
    {day:'Monday',meals:[
      {id:'breakfast',label:'BREAKFAST',name:'Greek yogurt crunch bowl',detail:'1 cup Greek yogurt · berries · ¼ cup oats · 1 tbsp walnuts · chia',cal:410,protein:32,carbs:45,fat:13,fiber:9,swap:'Eggs, toast + avocado'},
      {id:'lunch',label:'LUNCH',name:'Greek chicken salad',detail:'5 oz chicken · greens · chickpeas · cucumber · tomato · feta · olive-oil vinaigrette',cal:520,protein:47,carbs:38,fat:22,fiber:10,swap:'Tuna chickpea salad'},
      {id:'dinner',label:'DINNER',name:'Salmon, potatoes + broccoli',detail:'6 oz salmon · 8 oz roasted potatoes · 2 cups broccoli · 2 tsp olive oil',cal:650,protein:46,carbs:56,fat:26,fiber:10,swap:'Lemon chicken + potatoes'},
      {id:'snack',label:'SNACK',name:'Apple + peanut butter',detail:'1 apple · 2 tbsp natural peanut butter',cal:285,protein:8,carbs:31,fat:16,fiber:6,swap:'Greek yogurt + berries'}]},
    {day:'Tuesday',meals:[
      {id:'breakfast',label:'BREAKFAST',name:'Eggs, avocado toast + fruit',detail:'2 eggs · 1 slice whole-grain toast · ¼ avocado · orange',cal:410,protein:21,carbs:43,fat:19,fiber:10,swap:'Greek yogurt crunch bowl'},
      {id:'lunch',label:'LUNCH',name:'Chicken hummus wrap',detail:'Whole-grain wrap · 5 oz chicken · hummus · spinach · cucumber · tomato',cal:510,protein:45,carbs:49,fat:17,fiber:9,swap:'Turkey hummus sandwich'},
      {id:'dinner',label:'DINNER',name:'Chicken fajita bowl',detail:'6 oz chicken · ¾ cup brown rice · black beans · peppers · salsa · avocado',cal:690,protein:55,carbs:75,fat:20,fiber:15,swap:'Shrimp taco bowl'},
      {id:'snack',label:'SNACK',name:'Greek yogurt + walnuts',detail:'1 cup Greek yogurt · 1 tbsp walnuts · berries',cal:260,protein:24,carbs:24,fat:9,fiber:4,swap:'Hummus + vegetables'}]},
    {day:'Wednesday',meals:[
      {id:'breakfast',label:'BREAKFAST',name:'Berry chia overnight oats',detail:'½ cup oats · ¾ cup Greek yogurt · berries · 1 tbsp chia · cinnamon',cal:420,protein:31,carbs:55,fat:10,fiber:11,swap:'Greek yogurt crunch bowl'},
      {id:'lunch',label:'LUNCH',name:'Mediterranean chicken bowl',detail:'5 oz chicken · ½ cup quinoa · cucumber · tomato · chickpeas · feta · hummus',cal:535,protein:48,carbs:54,fat:17,fiber:11,swap:'Tuna quinoa bowl'},
      {id:'dinner',label:'DINNER',name:'Garlic shrimp whole-grain pasta',detail:'6 oz shrimp · 2 oz dry whole-grain pasta · spinach · tomatoes · garlic · 2 tsp olive oil',cal:655,protein:48,carbs:72,fat:20,fiber:12,swap:'Salmon pasta with spinach'},
      {id:'snack',label:'SNACK',name:'Apple, peanut butter + yogurt',detail:'1 apple · 1 tbsp peanut butter · ¾ cup Greek yogurt',cal:300,protein:20,carbs:39,fat:8,fiber:6,swap:'Carrots + hummus + yogurt'}]},
    {day:'Thursday',meals:[
      {id:'breakfast',label:'BREAKFAST',name:'Vegetable omelet + toast',detail:'2 eggs + 2 whites · spinach · peppers · feta · whole-grain toast',cal:400,protein:33,carbs:31,fat:17,fiber:7,swap:'Overnight oats'},
      {id:'lunch',label:'LUNCH',name:'Tuna chickpea salad',detail:'5 oz tuna · greens · ½ cup chickpeas · cucumber · tomato · whole-grain crackers',cal:500,protein:45,carbs:48,fat:15,fiber:12,swap:'Greek chicken salad'},
      {id:'dinner',label:'DINNER',name:'Turkey meatballs + pasta',detail:'6 oz turkey meatballs · whole-grain pasta · marinara · side salad',cal:690,protein:52,carbs:78,fat:19,fiber:13,swap:'Chicken marinara pasta'},
      {id:'snack',label:'SNACK',name:'Fruit + almonds',detail:'Pear · 1 oz almonds',cal:260,protein:7,carbs:34,fat:13,fiber:8,swap:'Greek yogurt + berries'}]},
    {day:'Friday',meals:[
      {id:'breakfast',label:'BREAKFAST',name:'Greek yogurt parfait',detail:'1 cup Greek yogurt · berries · ⅓ cup high-fiber granola · chia',cal:420,protein:31,carbs:55,fat:11,fiber:10,swap:'Eggs + whole-grain toast'},
      {id:'lunch',label:'LUNCH',name:'Mediterranean chicken quinoa bowl',detail:'5 oz chicken · ½ cup quinoa · cucumber · tomato · olives · feta · hummus',cal:545,protein:47,carbs:51,fat:19,fiber:10,swap:'Tuna chickpea bowl'},
      {id:'dinner',label:'DINNER',name:'Fish tacos + black beans',detail:'6 oz white fish · 3 corn tortillas · cabbage slaw · avocado · black beans',cal:670,protein:49,carbs:76,fat:20,fiber:16,swap:'Shrimp tacos'},
      {id:'snack',label:'SNACK',name:'Greek yogurt + dark chocolate',detail:'¾ cup Greek yogurt · berries · ½ oz dark chocolate',cal:255,protein:19,carbs:29,fat:8,fiber:5,swap:'Air-popped popcorn + yogurt'}]},
    {day:'Saturday',meals:[
      {id:'breakfast',label:'BREAKFAST',name:'Eggs, potatoes + fruit',detail:'2 eggs + 2 whites · roasted potatoes · berries',cal:430,protein:31,carbs:48,fat:14,fiber:8,swap:'Greek yogurt parfait'},
      {id:'lunch',label:'LUNCH',name:'Grilled chicken hummus pita',detail:'Whole-wheat pita · 5 oz chicken · hummus · cucumber · tomato · greens',cal:520,protein:45,carbs:53,fat:16,fiber:10,swap:'Turkey hummus wrap'},
      {id:'dinner',label:'DINNER',name:'Grilled burger + big salad',detail:'5 oz lean beef or turkey burger · whole-grain bun · corn · large salad · olive-oil vinaigrette',cal:720,protein:48,carbs:70,fat:26,fiber:12,swap:'Grilled chicken sandwich + salad'},
      {id:'snack',label:'SNACK',name:'Berries + dark chocolate',detail:'1½ cups berries · 1 oz dark chocolate · ½ cup Greek yogurt',cal:270,protein:13,carbs:34,fat:11,fiber:8,swap:'Apple + peanut butter'}]}
  ];

  const localKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const todayPlan=()=>PLAN[new Date().getDay()];
  const fmt=n=>Math.round(Number(n)||0).toLocaleString();
  const pct=(a,b)=>Math.max(0,Math.min(100,(Number(a)||0)/(Number(b)||1)*100));

  function ensureState(){
    if(!S.nutritionV1)S.nutritionV1={build:BUILD,activePlan:'Mediterranean — Fat Loss',targets:{...TARGETS},days:{},quickOpen:false};
    if(!S.nutritionV1.targets)S.nutritionV1.targets={...TARGETS};
    const key=localKey();
    if(!S.nutritionV1.days[key])S.nutritionV1.days[key]={meals:{},custom:[]};
    return S.nutritionV1.days[key];
  }

  function activeMeal(base,record){
    if(record?.swap){
      return {...base,name:base.swap,detail:'Flexible swap · keep the same meal slot',cal:Math.round(base.cal*.98),protein:Math.max(1,Math.round(base.protein*.97)),carbs:Math.round(base.carbs*.98),fat:Math.round(base.fat*.98),fiber:Math.round(base.fiber*.95)};
    }
    return base;
  }

  function totals(){
    const day=ensureState(),plan=todayPlan();
    const t={calories:0,protein:0,carbs:0,fat:0,fiber:0};
    plan.meals.forEach(m=>{
      const rec=day.meals[m.id]||{};if(!rec.logged)return;
      const meal=activeMeal(m,rec),portion=Number(rec.portion||1);
      t.calories+=meal.cal*portion;t.protein+=meal.protein*portion;t.carbs+=meal.carbs*portion;t.fat+=meal.fat*portion;t.fiber+=meal.fiber*portion;
    });
    (day.custom||[]).forEach(x=>{t.calories+=+x.calories||0;t.protein+=+x.protein||0;t.carbs+=+x.carbs||0;t.fat+=+x.fat||0;t.fiber+=+x.fiber||0});
    Object.keys(t).forEach(k=>t[k]=Math.round(t[k]*10)/10);
    return t;
  }

  function syncLegacy(){
    const t=totals();S.logs.cal=Math.round(t.calories);S.logs.protein=Math.round(t.protein);save();return t;
  }

  function metric(label,value,target,unit){return `<div class="arc-nutri-metric"><div class="arc-nutri-metric-head"><span>${label}</span><b>${fmt(value)}<small> / ${fmt(target)}${unit}</small></b></div><div class="arc-nutri-track"><i style="width:${pct(value,target)}%"></i></div></div>`}

  function mealCard(base){
    const day=ensureState(),rec=day.meals[base.id]||{},meal=activeMeal(base,rec),portion=Number(rec.portion||1),logged=!!rec.logged;
    const cal=Math.round(meal.cal*portion),protein=Math.round(meal.protein*portion),carbs=Math.round(meal.carbs*portion),fat=Math.round(meal.fat*portion);
    return `<article class="arc-meal-card ${logged?'logged':''}">
      <div class="arc-meal-top"><div><span class="arc-meal-label">${base.label}${rec.swap?' · SWAPPED':''}</span><h3>${esc(meal.name)}</h3></div><div class="arc-meal-kcal"><b>${cal}</b><span>kcal</span></div></div>
      <p>${esc(meal.detail)}</p>
      <div class="arc-meal-macros"><span><b>${protein}g</b> protein</span><span>${carbs}g carbs</span><span>${fat}g fat</span>${portion!==1?`<span>${portion}× portion</span>`:''}</div>
      <div class="arc-meal-actions"><button class="arc-meal-primary" data-arc-logmeal="${base.id}">${logged?'✓ Logged':'Ate This'}</button><button data-arc-portion="${base.id}">Portion</button><button data-arc-swap="${base.id}">${rec.swap?'Original':'Swap'}</button></div>
    </article>`;
  }

  function customRows(){
    const day=ensureState();if(!(day.custom||[]).length)return '';
    return `<section class="arc-custom-log"><div class="arc-section-head"><div><span class="eyebrow">OFF PLAN</span><h3>Other food logged</h3></div></div>${day.custom.map((x,i)=>`<div class="arc-custom-row"><div><b>${esc(x.name||'Food')}</b><span>${fmt(x.calories)} kcal · ${fmt(x.protein)}g protein</span></div><button data-arc-remove-custom="${i}" aria-label="Remove">×</button></div>`).join('')}</section>`;
  }

  function insight(t,loggedCount){
    const targets=S.nutritionV1.targets;
    if(!loggedCount&&!t.calories)return `<section class="arc-nutri-signal"><span class="eyebrow">✦ BODY INTELLIGENCE</span><h3>Today already has a shape.</h3><p>Your plan is ready. Log what actually happens and Arc will compare the plan with the day—not judge the difference.</p></section>`;
    if(loggedCount<4)return `<section class="arc-nutri-signal"><span class="eyebrow">✦ LIVE SIGNAL</span><h3>${loggedCount} of 4 planned meals logged.</h3><p>You’re at ${fmt(t.protein)}g protein and ${fmt(t.calories)} calories so far. ${targets.protein-t.protein>0?`${fmt(targets.protein-t.protein)}g protein remains in today’s target.`:'Protein target reached.'}</p></section>`;
    const delta=Math.abs(targets.calories-t.calories);
    return `<section class="arc-nutri-signal"><span class="eyebrow">✦ DAY COMPLETE</span><h3>Your nutrition day is taking shape.</h3><p>${fmt(t.protein)}g protein · ${fmt(t.fiber)}g fiber · ${fmt(t.calories)} calories. You finished ${fmt(delta)} calories ${t.calories<=targets.calories?'under':'over'} the current target.</p></section>`;
  }

  function nutritionV072(){
    const day=ensureState(),plan=todayPlan(),t=syncLegacy(),targets=S.nutritionV1.targets,loggedCount=plan.meals.filter(m=>day.meals[m.id]?.logged).length;
    const quick=S.nutritionV1.quickOpen;
    const remaining=Math.max(0,targets.calories-t.calories);
    const body=`<section class="arc-nutrition-today">
      <div class="arc-nutri-header"><button class="arc-nutri-back" data-go="today">←</button><div><span class="eyebrow">NUTRITION · TODAY</span><h1>Fuel the day you’re actually having.</h1><p>Follow the plan, change it, or log something else. Arc keeps the context either way.</p></div><button class="arc-nutri-more" data-arc-targets>Targets</button></div>

      <section class="arc-nutri-hero">
        <div class="arc-calorie-ring" style="--p:${pct(t.calories,targets.calories)}"><div><b>${fmt(t.calories)}</b><span>of ${fmt(targets.calories)} kcal</span><small>${fmt(remaining)} remaining</small></div></div>
        <div class="arc-nutri-hero-copy"><span class="eyebrow">TODAY'S TARGETS</span>${metric('Protein',t.protein,targets.protein,'g')}${metric('Carbs',t.carbs,targets.carbs,'g')}${metric('Fat',t.fat,targets.fat,'g')}</div>
      </section>

      <section class="arc-plan-banner"><div class="arc-plan-mark">🌿</div><div><span class="eyebrow">CURRENT PLAN</span><h2>${esc(S.nutritionV1.activePlan)}</h2><p>High protein · High fiber · Mediterranean-style whole foods</p></div><button data-arc-week>7-day plan →</button></section>

      <div class="arc-section-head"><div><span class="eyebrow">${plan.day.toUpperCase()}</span><h2>Today's meals</h2></div><span>${loggedCount} / 4 logged</span></div>
      <div class="arc-meal-list">${plan.meals.map(mealCard).join('')}</div>

      <button class="arc-log-other" data-arc-toggle-quick>${quick?'Hide quick log':'Log something else'} <span>${quick?'−':'+'}</span></button>
      ${quick?`<section class="arc-quick-log"><div class="arc-quick-title"><div><span class="eyebrow">FLEXIBLE LOG</span><h3>What did you have instead?</h3></div><span>No judgment. Just context.</span></div><input id="arc-food-name" class="input" placeholder="Food or meal"><div class="arc-quick-grid"><input id="arc-food-cal" class="input" type="number" inputmode="numeric" placeholder="Calories"><input id="arc-food-protein" class="input" type="number" inputmode="decimal" placeholder="Protein g"><input id="arc-food-carbs" class="input" type="number" inputmode="decimal" placeholder="Carbs g"><input id="arc-food-fat" class="input" type="number" inputmode="decimal" placeholder="Fat g"></div><button class="btn" data-arc-add-custom>Add to Today</button></section>`:''}
      ${customRows()}
      ${insight(t,loggedCount)}
    </section>`;
    shell(body,'today');
  }

  function closeModal(){document.querySelector('.arc-nutri-overlay')?.remove();document.body.classList.remove('arc-modal-open')}
  function modal(inner){closeModal();const el=document.createElement('div');el.className='arc-nutri-overlay';el.innerHTML=`<div class="arc-nutri-backdrop" data-close-nutri></div><div class="arc-nutri-sheet">${inner}</div>`;document.body.appendChild(el);document.body.classList.add('arc-modal-open')}
  function openPortion(id){
    const base=todayPlan().meals.find(x=>x.id===id);if(!base)return;const rec=ensureState().meals[id]||{};
    modal(`<div class="arc-sheet-head"><div><span class="eyebrow">PORTION</span><h2>${esc(activeMeal(base,rec).name)}</h2><p>Adjust the portion without rebuilding the meal.</p></div><button data-close-nutri>×</button></div><div class="arc-portion-grid">${[.5,.75,1,1.25,1.5].map(x=>`<button data-arc-portion-value="${x}" data-meal="${id}" class="${Number(rec.portion||1)===x?'active':''}">${x}×</button>`).join('')}</div>`)
  }
  function openTargets(){const t=S.nutritionV1.targets;modal(`<div class="arc-sheet-head"><div><span class="eyebrow">DAILY TARGETS</span><h2>Keep the plan personal.</h2><p>These are demo targets for the POC. They can be edited anytime.</p></div><button data-close-nutri>×</button></div><div class="arc-target-grid"><label>Calories<input id="arc-target-cal" class="input" type="number" value="${t.calories}"></label><label>Protein (g)<input id="arc-target-protein" class="input" type="number" value="${t.protein}"></label><label>Carbs (g)<input id="arc-target-carbs" class="input" type="number" value="${t.carbs}"></label><label>Fat (g)<input id="arc-target-fat" class="input" type="number" value="${t.fat}"></label></div><button class="btn" data-arc-save-targets>Save Targets</button>`)}
  function openWeek(){
    modal(`<div class="arc-sheet-head"><div><span class="eyebrow">MEDITERRANEAN · FAT LOSS</span><h2>Your 7-day plan</h2><p>One framework, flexible meals. Tap back into Today whenever you’re ready to log.</p></div><button data-close-nutri>×</button></div><div class="arc-week-list">${PLAN.slice(1).concat(PLAN.slice(0,1)).map(d=>`<article><span>${d.day}</span><div>${d.meals.map(m=>`<b>${esc(m.name)}</b>`).join('')}</div><strong>${fmt(d.meals.reduce((a,m)=>a+m.cal,0))} kcal</strong></article>`).join('')}</div>`)
  }

  try{nutrition=nutritionV072}catch(e){window.nutrition=nutritionV072}
  window.ArcNutrition={render:nutritionV072,plan:PLAN,totals,version:BUILD};

  document.addEventListener('click',e=>{
    const log=e.target.closest('[data-arc-logmeal]');if(log){const id=log.dataset.arcLogmeal,day=ensureState();day.meals[id]=day.meals[id]||{};day.meals[id].logged=!day.meals[id].logged;syncLegacy();nutritionV072();return}
    const portion=e.target.closest('[data-arc-portion]');if(portion){openPortion(portion.dataset.arcPortion);return}
    const pv=e.target.closest('[data-arc-portion-value]');if(pv){const day=ensureState(),id=pv.dataset.meal;day.meals[id]=day.meals[id]||{};day.meals[id].portion=Number(pv.dataset.arcPortionValue);syncLegacy();closeModal();nutritionV072();return}
    const swap=e.target.closest('[data-arc-swap]');if(swap){const id=swap.dataset.arcSwap,day=ensureState();day.meals[id]=day.meals[id]||{};day.meals[id].swap=!day.meals[id].swap;syncLegacy();nutritionV072();return}
    if(e.target.closest('[data-arc-toggle-quick]')){S.nutritionV1.quickOpen=!S.nutritionV1.quickOpen;save();nutritionV072();return}
    if(e.target.closest('[data-arc-add-custom]')){const name=document.querySelector('#arc-food-name')?.value.trim()||'Other food',cal=+document.querySelector('#arc-food-cal')?.value||0,protein=+document.querySelector('#arc-food-protein')?.value||0,carbs=+document.querySelector('#arc-food-carbs')?.value||0,fat=+document.querySelector('#arc-food-fat')?.value||0;if(!cal&&!protein)return;ensureState().custom.push({name,calories:cal,protein,carbs,fat,fiber:0,at:new Date().toISOString()});syncLegacy();nutritionV072();return}
    const rm=e.target.closest('[data-arc-remove-custom]');if(rm){ensureState().custom.splice(+rm.dataset.arcRemoveCustom,1);syncLegacy();nutritionV072();return}
    if(e.target.closest('[data-arc-targets]')){openTargets();return}
    if(e.target.closest('[data-arc-save-targets]')){S.nutritionV1.targets={calories:+document.querySelector('#arc-target-cal').value||TARGETS.calories,protein:+document.querySelector('#arc-target-protein').value||TARGETS.protein,carbs:+document.querySelector('#arc-target-carbs').value||TARGETS.carbs,fat:+document.querySelector('#arc-target-fat').value||TARGETS.fat};save();closeModal();nutritionV072();return}
    if(e.target.closest('[data-arc-week]')){openWeek();return}
    if(e.target.closest('[data-close-nutri]')){closeModal();return}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  ensureState();save();
})();
