// ARC QA Sprint 1 — workout state isolation + no-scroll set completion.
// Loads after v05 and before v051/v052 so later workout layers receive a normalized exercise model
// and this capture handler can stop their render-on-every-check behavior first.
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

  // v051/v052 expect exercise objects while the 0.3.4 generator returns strings.
  // Normalize once at the boundary so every exercise owns an independent set array.
  try{exerciseSet=function(name){return normalizedList(name)}}catch(e){window.exerciseSet=normalizedList}

  function active(){
    const aw=S.activeWorkout;if(!aw)return null;
    const list=normalizedList(aw.name),idx=Math.max(0,Math.min(+aw.index||0,list.length-1)),ex=list[idx];
    aw.sets=aw.sets||{};
    const sets=aw.sets[ex.name]||(aw.sets[ex.name]=Array.from({length:ex.sets},()=>({weight:'',reps:ex.reps,rir:'',done:false})));
    sets.forEach(s=>{if(s.rir==null)s.rir=''});
    return {aw,list,idx,ex,sets};
  }
  function dirty(){
    try{window.dispatchEvent(new CustomEvent('arc:state-dirty',{detail:{source:'workout'}}))}catch(e){}
  }
  function control(index){
    return document.querySelector(`[data-052-done="${index}"]`)||document.querySelector(`[data-deep-done="${index}"]`);
  }
  function refreshSetUI(ctx,index){
    const button=control(index);
    const row=button?.closest('.v052-set,.deep-set');
    const set=ctx.sets[index];
    if(row)row.classList.toggle('complete',!!set.done);
    if(button)button.textContent=set.done?'✓':'○';

    const done=ctx.sets.filter(x=>x.done).length;
    const pct=Math.round(((ctx.idx+(done/Math.max(1,ctx.sets.length)))/Math.max(1,ctx.list.length))*100);
    const progress=document.querySelector('.tool-progress i');if(progress)progress.style.width=`${pct}%`;
    const status=document.querySelector('.exercise-status');
    if(status){
      const b=status.querySelector('b'),span=status.querySelector('span');
      if(b)b.textContent=`${pct}%`;
      if(span)span.textContent=document.querySelector('.v052-workout')?`${done} / ${ctx.sets.length} sets complete`:`${done} of ${ctx.sets.length} sets here`;
    }
    const next=document.querySelector('[data-052-next],[data-deep-next]');
    const finish=document.querySelector('[data-052-finish],[data-deep-finish]');
    const ready=done>=ctx.sets.length;
    if(next){next.disabled=!ready;next.textContent=ready?'Next Exercise →':'Complete all sets to continue';}
    if(finish){finish.disabled=!ready;finish.textContent=ready?'Complete Workout →':'Complete all sets to finish';}
  }

  // This listener is registered before both legacy handlers. Checking a set updates only the affected
  // row/progress controls, preserving the exact viewport position rather than rebuilding the page.
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-052-done],[data-deep-done]');if(!btn)return;
    const ctx=active();if(!ctx)return;
    const raw=btn.hasAttribute('data-052-done')?btn.getAttribute('data-052-done'):btn.getAttribute('data-deep-done');
    const index=+raw;if(!ctx.sets[index])return;
    e.preventDefault();e.stopImmediatePropagation();
    ctx.sets[index].done=!ctx.sets[index].done;
    save();
    refreshSetUI(ctx,index);
    dirty();
  },true);

  window.ArcWorkoutQA={version:'1.1',normalizeExercise,list:normalizedList};
})();