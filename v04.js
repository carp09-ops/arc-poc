// Arc POC 0.4 — longitudinal data foundation + deterministic Signal engine.
// This layer intentionally avoids changing the visible 0.3.4 tester journey.
(function(){
  if(typeof S==='undefined') return;

  const ISO=()=>new Date().toISOString();
  const DAY=86400000;
  const dateOnly=(d)=>new Date(d).toISOString().slice(0,10);
  const daysAgo=(n)=>dateOnly(Date.now()-n*DAY);
  const num=(v)=>Number.isFinite(+v)?+v:null;
  const uid=(prefix)=>`${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;

  function ensure04(){
    S.meta=S.meta||{};
    S.meta.dataVersion='0.4';
    S.meta.createdAt=S.meta.createdAt||ISO();
    S.meta.updatedAt=ISO();
    S.history=S.history||{};
    for(const k of ['workouts','nutrition','body','activity','sleep','signals']) S.history[k]=Array.isArray(S.history[k])?S.history[k]:[];
    S.profile=S.profile||{};
    S.profile.preferences=S.profile.preferences||{};
    if(S.profile.activities && !S.profile.preferences.activities) S.profile.preferences.activities=[...S.profile.activities];
    if(S.profile.equipment && !S.profile.preferences.equipment) S.profile.preferences.equipment=[...S.profile.equipment];
    save();
  }

  function normalizeWorkout(x={}){
    return {
      id:x.id||uid('wo'),
      date:x.date||dateOnly(x.completedAt||Date.now()),
      completedAt:x.completedAt||x.timestamp||ISO(),
      name:x.name||x.workout||'Workout',
      durationMin:num(x.durationMin??x.duration)??num(S.profile.duration)??30,
      planned:x.planned!==false,
      completed:x.completed!==false,
      exercises:Array.isArray(x.exercises)?x.exercises:[],
      volume:num(x.volume),
      notes:x.notes||''
    };
  }

  function normalizeNutrition(x={}){
    return {
      id:x.id||uid('meal'),
      date:x.date||dateOnly(x.loggedAt||Date.now()),
      loggedAt:x.loggedAt||x.timestamp||ISO(),
      name:x.name||x.food||'Food entry',
      meal:x.meal||null,
      calories:num(x.calories??x.cal),
      protein:num(x.protein),
      carbs:num(x.carbs),
      fat:num(x.fat)
    };
  }

  function normalizeBody(x={}){
    return {
      id:x.id||uid('body'),
      date:x.date||dateOnly(x.loggedAt||Date.now()),
      loggedAt:x.loggedAt||x.timestamp||ISO(),
      weight:num(x.weight), waist:num(x.waist), hips:num(x.hips), chest:num(x.chest), thigh:num(x.thigh), arm:num(x.arm),
      note:x.note||''
    };
  }

  function normalizeActivity(x={}){
    return {
      id:x.id||uid('activity'),
      date:x.date||dateOnly(x.loggedAt||Date.now()),
      loggedAt:x.loggedAt||ISO(),
      steps:num(x.steps), activeMinutes:num(x.activeMinutes), distanceMiles:num(x.distanceMiles), source:x.source||'manual'
    };
  }

  function normalizeSleep(x={}){
    return {
      id:x.id||uid('sleep'),
      date:x.date||dateOnly(x.loggedAt||Date.now()),
      loggedAt:x.loggedAt||ISO(),
      hours:num(x.hours), quality:x.quality||null, source:x.source||'manual'
    };
  }

  function migrate(){
    S.history.workouts=S.history.workouts.map(normalizeWorkout);
    S.history.nutrition=S.history.nutrition.map(normalizeNutrition);
    S.history.body=S.history.body.map(normalizeBody);
    S.history.activity=S.history.activity.map(normalizeActivity);
    S.history.sleep=S.history.sleep.map(normalizeSleep);
    // Preserve today's legacy steps as a dated activity record once.
    if((S.logs?.steps||0)>0 && !S.history.activity.some(x=>x.date===dateOnly(Date.now()))){
      S.history.activity.push(normalizeActivity({steps:S.logs.steps,date:dateOnly(Date.now()),source:'legacy'}));
    }
    S.meta.updatedAt=ISO();
    save();
  }

  function inLast(arr,days){const cutoff=Date.now()-(days-1)*DAY;return arr.filter(x=>new Date(`${x.date}T12:00:00`).getTime()>=cutoff).sort((a,b)=>a.date.localeCompare(b.date));}
  function byDay(arr,key){const m={};for(const x of arr){const d=x.date;(m[d]||(m[d]=[])).push(x)}return m;}
  function sum(arr,key){return arr.reduce((a,x)=>a+(num(x[key])||0),0)}
  function avg(arr,key){const vals=arr.map(x=>num(x[key])).filter(v=>v!==null);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null}

  function signal(id,title,status,confidence,summary,evidence,domains,windowDays){
    return {id,title,status,confidence,summary,evidence,domains,windowDays,evaluatedAt:ISO()};
  }

  function evaluateSignals(){
    const out=[];
    const body14=inLast(S.history.body,14).filter(x=>x.weight!==null||x.waist!==null);
    if(body14.length>=2){
      const first=body14[0],last=body14[body14.length-1];
      const w0=num(first.weight),w1=num(last.weight),a0=num(first.waist),a1=num(last.waist);
      if(w0&&w1&&a0!==null&&a1!==null){
        const weightPct=Math.abs((w1-w0)/w0*100),waistDelta=a1-a0;
        if(weightPct<1 && waistDelta<=-0.5){
          out.push(signal('body_recomp','The scale isn’t telling the whole story.','active','Moderate',`Weight has stayed within ${weightPct.toFixed(1)}% while waist changed ${waistDelta.toFixed(1)} in over this window.`,{checkIns:body14.length,weightChangeLb:+(w1-w0).toFixed(1),waistChangeIn:+waistDelta.toFixed(1)},['Body'],14));
        }
      }
    }

    const wo21=inLast(S.history.workouts,21).filter(x=>x.completed!==false);
    const plannedPerWeek=Math.max(1,num(S.profile.days)||3);
    const planned21=plannedPerWeek*3;
    const adherence=Math.min(1,wo21.length/planned21);
    if(wo21.length>=3){
      out.push(signal('plan_fit','Your schedule is becoming testable.',adherence>=.85?'active':'watching',adherence>=.85?'Moderate':'Early',adherence>=.85?`You completed ${wo21.length} sessions in the last 3 weeks—enough for Arc to tentatively treat this schedule as a good fit.`:`You completed ${wo21.length} of roughly ${planned21} planned sessions in the last 3 weeks. Arc is still watching whether this schedule fits your routine.`,{completed:wo21.length,planned:planned21,adherence:+(adherence*100).toFixed(0)},['Training'],21));
    }

    const vol28=inLast(S.history.workouts,28).filter(x=>x.volume!==null&&x.completed!==false);
    if(vol28.length>=4){
      const half=Math.floor(vol28.length/2),early=avg(vol28.slice(0,half),'volume'),late=avg(vol28.slice(half),'volume');
      if(early&&late){const delta=(late-early)/early*100;if(delta>10)out.push(signal('strength_progress','You’re getting stronger.','active','Moderate',`Average logged training volume is up ${delta.toFixed(0)}% across the available 4-week history.`,{sessions:vol28.length,volumeChangePct:+delta.toFixed(0)},['Training'],28));}
    }

    const n28=inLast(S.history.nutrition,28),w28=inLast(S.history.workouts,28).filter(x=>x.completed!==false);
    const mealDays=byDay(n28),workDays=new Set(w28.map(x=>x.date));
    const dayProtein=Object.entries(mealDays).map(([date,items])=>({date,protein:sum(items,'protein'),workout:workDays.has(date)})).filter(x=>x.protein>0);
    const workoutProtein=dayProtein.filter(x=>x.workout),otherProtein=dayProtein.filter(x=>!x.workout);
    if(workoutProtein.length>=3 && otherProtein.length>=3){
      const wp=avg(workoutProtein,'protein'),op=avg(otherProtein,'protein'),diff=wp-op;
      out.push(signal('protein_pattern','Protein is becoming a comparable pattern.','watching','Early',`On logged workout days, protein has averaged ${wp.toFixed(0)}g versus ${op.toFixed(0)}g on other logged days. Arc is observing the association—not claiming cause.`,{workoutDays:workoutProtein.length,otherDays:otherProtein.length,differenceG:+diff.toFixed(0)},['Nutrition','Training'],28));
    }

    const a14=inLast(S.history.activity,14).filter(x=>x.steps!==null);
    if(a14.length>=7){
      const mean=avg(a14,'steps'),spread=Math.max(...a14.map(x=>x.steps))-Math.min(...a14.map(x=>x.steps));
      out.push(signal('activity_baseline','Your movement baseline is taking shape.','watching','Early',`Across ${a14.length} logged days, daily movement has averaged ${Math.round(mean).toLocaleString()} steps.`,{days:a14.length,averageSteps:Math.round(mean),rangeSteps:spread},['Activity'],14));
    }

    S.history.signals=out;
    S.meta.lastSignalEvaluation=ISO();
    save();
    return out;
  }

  function evidenceStatus(){
    const streams={
      Training:S.history.workouts.length,
      Nutrition:new Set(S.history.nutrition.map(x=>x.date)).size,
      Body:S.history.body.length,
      Activity:S.history.activity.length,
      Sleep:S.history.sleep.length
    };
    const active=Object.values(streams).filter(v=>v>0).length;
    return {streams,active,total:Object.keys(streams).length,label:active<2?'Getting started':active<4?'Building context':'Context established'};
  }

  function seed(days=30){
    const d=Math.max(7,Math.min(60,+days||30));
    S.history.workouts=[];S.history.nutrition=[];S.history.body=[];S.history.activity=[];S.history.sleep=[];S.history.signals=[];
    const baseWeight=num(S.profile.weight)||166.8, baseWaist=num(S.profile.waist)||35.4;
    for(let i=d-1;i>=0;i--){
      const date=daysAgo(i),weekIndex=Math.floor((d-1-i)/7);
      const steps=5900+((i*733)%2600);
      S.history.activity.push(normalizeActivity({date,steps,activeMinutes:28+((i*7)%24),source:'seed'}));
      S.history.sleep.push(normalizeSleep({date,hours:+(6.6+((i%5)*.22)).toFixed(1),quality:['Fair','Good','Good','Great'][i%4],source:'seed'}));
      const isWorkout=(i%2===0)&&((d-i)%7<Math.max(2,num(S.profile.days)||3)+2);
      if(isWorkout){
        const volume=Math.round(5600*(1+weekIndex*.035)+(i%3)*120);
        S.history.workouts.push(normalizeWorkout({date,name:['Full Body Strength','Lower Body + Core','Upper Body + Mobility'][i%3],durationMin:num(S.profile.duration)||30,volume,completed:true,exercises:[]}));
      }
      const proteinBase=isWorkout?108:91;
      S.history.nutrition.push(normalizeNutrition({date,name:'Breakfast',calories:360+(i%3)*35,protein:24+(i%4)}));
      S.history.nutrition.push(normalizeNutrition({date,name:'Lunch',calories:520+(i%4)*25,protein:proteinBase-52}));
      S.history.nutrition.push(normalizeNutrition({date,name:'Dinner',calories:610+(i%5)*22,protein:28+(i%5)}));
      if(i%7===0 || i===d-1 || i===0){
        const progress=(d-1-i)/Math.max(1,d-1);
        S.history.body.push(normalizeBody({date,weight:+(baseWeight-(progress*.8)+((i%2)*.25)).toFixed(1),waist:+(baseWaist-(progress*.8)).toFixed(1),hips:40.2,chest:37.0,thigh:23.4,arm:11.8}));
      }
    }
    S.logs=S.logs||{};
    S.logs.workouts=S.history.workouts.length;
    const todayMeals=S.history.nutrition.filter(x=>x.date===dateOnly(Date.now()));
    S.logs.cal=sum(todayMeals,'calories');S.logs.protein=sum(todayMeals,'protein');
    const todayAct=S.history.activity.find(x=>x.date===dateOnly(Date.now()));if(todayAct)S.logs.steps=todayAct.steps;
    evaluateSignals();save();
  }

  function resetHistory(){
    for(const k of ['workouts','nutrition','body','activity','sleep','signals']) S.history[k]=[];
    S.logs=S.logs||{};S.logs.workouts=0;S.logs.cal=0;S.logs.protein=0;S.logs.steps=0;S.logs.bodyChecks=0;
    save();
  }

  function debugPanel(){
    if(!new URLSearchParams(location.search).has('debug')) return;
    const el=document.createElement('div');el.className='arc-debug';el.innerHTML=`<button class="arc-debug-toggle">ARC LAB</button><div class="arc-debug-panel"><b>POC 0.4 LAB</b><small>Local test utilities</small><div class="arc-debug-row">${[7,14,30,60].map(n=>`<button data-seed-days="${n}">${n}d</button>`).join('')}</div><button data-evaluate-signals>Evaluate Signals</button><button data-reset-history class="danger">Reset History</button><pre class="arc-debug-status"></pre></div>`;document.body.appendChild(el);
    const panel=el.querySelector('.arc-debug-panel');el.querySelector('.arc-debug-toggle').onclick=()=>panel.classList.toggle('open');
    el.onclick=(e)=>{const s=e.target.closest('[data-seed-days]');if(s){seed(+s.dataset.seedDays);render();update();}if(e.target.closest('[data-evaluate-signals]')){evaluateSignals();update();}if(e.target.closest('[data-reset-history]')){resetHistory();render();update();}};
    function update(){const e=evidenceStatus(),sig=evaluateSignals();el.querySelector('.arc-debug-status').textContent=JSON.stringify({evidence:e,signals:sig.map(x=>({id:x.id,status:x.status,confidence:x.confidence}))},null,2)}
    update();
  }

  ensure04();migrate();evaluateSignals();
  window.ArcData={version:'0.4',normalizeWorkout,normalizeNutrition,normalizeBody,normalizeActivity,normalizeSleep,evaluateSignals,evidenceStatus,seed,resetHistory};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',debugPanel);else debugPanel();
})();
