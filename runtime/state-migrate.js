// ARC QA Sprint 1 — non-destructive state migration guard.
// Normalizes missing structures around existing user data before legacy feature layers execute.
(function(){
  if(typeof S==='undefined'||!S||typeof S!=='object')return;
  const rawBefore=(()=>{try{return localStorage.getItem('arcState')||''}catch(e){return ''}})();
  const before=(()=>{try{return JSON.stringify(S)}catch(e){return ''}})();
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
  const array=x=>Array.isArray(x)?x:[];

  S.profile=object(S.profile);
  S.logs=object(S.logs);
  S.history=object(S.history);
  for(const k of ['workouts','nutrition','body','activity','sleep','signals','weight','context','measurements'])S.history[k]=array(S.history[k]);
  S.meta=object(S.meta);

  if(S.nutritionV1!=null){
    const n=object(S.nutritionV1);
    n.build=n.build||'0.7.2';
    n.activePlan=n.activePlan||'Mediterranean — Fat Loss';
    n.targets=object(n.targets);
    const defaults={calories:2000,protein:145,carbs:210,fat:70};
    for(const [k,v] of Object.entries(defaults)){
      const existing=+n.targets[k];
      n.targets[k]=Number.isFinite(existing)&&existing>0?existing:v;
    }
    n.days=object(n.days);
    for(const [dayKey,value] of Object.entries(n.days)){
      const d=object(value);d.meals=object(d.meals);d.custom=array(d.custom);
      d.custom.forEach(x=>{if(x&&typeof x==='object'&&!x.balance)x.balance='flex'});
      n.days[dayKey]=d;
    }
    n.quickOpen=!!n.quickOpen;
    n.balanceDraft=n.balanceDraft==='foundation'?'foundation':'flex';
    S.nutritionV1=n;
  }

  if(S.activeWorkout!=null){
    const w=object(S.activeWorkout);w.sets=object(w.sets);
    for(const [exercise,sets] of Object.entries(w.sets)){
      if(!Array.isArray(sets))continue;
      w.sets[exercise]=sets.map(s=>{
        const row=object(s);
        if(row.weight==null)row.weight='';
        if(row.reps==null)row.reps='';
        if(row.rir==null)row.rir='';
        row.done=!!row.done;
        return row;
      });
    }
    S.activeWorkout=w;
  }

  S.meta.schemaVersion='qa1';
  const after=(()=>{try{return JSON.stringify(S)}catch(e){return before}})();
  if(after&&after!==before){
    try{
      if(rawBefore&&!localStorage.getItem('arcStateMigrationBackup'))localStorage.setItem('arcStateMigrationBackup',rawBefore);
      localStorage.setItem('arcState',after);
    }catch(e){}
  }
  window.ArcStateMigration={version:'1.0',changed:after!==before};
})();