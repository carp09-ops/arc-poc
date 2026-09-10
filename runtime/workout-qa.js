// ARC QA Sprint 1 — workout state isolation + no-scroll set completion.
// Loads after v05 and before v051 so v051 receives a normalized exercise model.
(function(){
  if(typeof S==='undefined')return;

  const legacyExerciseSet=typeof exerciseSet==='function'?exerciseSet:null;
  const fallback=['Goblet Squat','Romanian Deadlift','Supported Row','Floor Press','Dead Bug'];

  function normalizeExercise(x){
    if(typeof x==='string')return {name:x,sets:3,reps:10};
    if(x&&typeof x==='object')return {name:String(x.name||'Movement'),sets:Math.max(1,+x.sets||3),reps:Math.max(1,+x.reps||10)};
    return {name:'Movement',sets:3,reps:10};
  }
  function normalizedList(name){
    let list=[];
    try{list=legacyExerciseSet?legacyExerciseSet(name)||[]:fallback}catch(e){list=fallback}
    return (Array.isArray(list)&&list.length?list:fallback).map(normalizeExercise);
  }

  // v051 expects exercise objects while the 0.3.4 generator returns strings.
  // Normalize once at the boundary so every exercise owns an independent set array.
  try{exerciseSet=function(name){return normalizedList(name)}}catch(e){window.exerciseSet=normalizedList}

  function active(){
    const aw=S.activeWorkout;if(!aw)return null;
    const list=normalizedList(aw.name),idx=Math.max(0,Math.min(+aw.index||0,list.length-1)),ex=list[idx];
    aw.sets=aw.sets||{};
    const sets=aw.sets[ex.name]||(aw.sets[ex.name]=Array.from({length:ex.sets},()=>({weight:'',reps:ex.reps,done:false})));
    return {aw,list,idx,ex,sets};
  }
  function dirty(){
    try{window.dispatchEvent(new CustomEvent('arc:state-dirty',{detail:{source:'workout'}}))}catch(e){}
  }
  function refreshSetUI(ctx,index){
    const row=document.querySelector(`[data-deep-done="${index}"]`)?.closest('.deep-set');
    const button=row?.querySelector('[data-deep-done]');
    const set=ctx.sets[index];
    if(row)row.classList.toggle('complete',!!set.done);
    if(button)button.textContent=set.done?'✓':'○';

    const done=ctx.sets.filter(x=>x.done).length;
    const pct=Math.round(((ctx.idx+(done/Math.max(1,ctx.sets.length)))/Math.max(1,ctx.list.length))*100);
    const progress=document.querySelector('.tool-progress i');if(progress)progress.style.width=`${pct}%`;
    const status=document.querySelector('.exercise-status');
    if(status){const b=status.querySelector('b'),span=status.querySelector('span');if(b)b.textContent=`${pct}%`;if(span)span.textContent=`${done} of ${ctx.sets.length} sets here`;}
    const next=document.querySelector('[data-deep-next]'),finish=document.querySelector('[data-deep-finish]'),ready=done>=ctx.sets.length;
    if(next){next.disabled=!ready;next.textContent=ready?'Next Exercise →':'Complete all sets to continue';}
    if(finish){finish.disabled=!ready;finish.textContent=ready?'Complete Workout →':'Complete all sets to finish';}
  }

  // Register before v051. This replaces its render-on-every-check behavior with a targeted DOM update,
  // so checking a set never rebuilds the page or changes the user's scroll position.
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-deep-done]');if(!btn)return;
    const ctx=active();if(!ctx)return;
    const index=+btn.dataset.deepDone;if(!ctx.sets[index])return;
    e.preventDefault();e.stopImmediatePropagation();
    ctx.sets[index].done=!ctx.sets[index].done;
    save();
    refreshSetUI(ctx,index);
    dirty();
  },true);

  window.ArcWorkoutQA={version:'1.0',normalizeExercise,list:normalizedList};
})();