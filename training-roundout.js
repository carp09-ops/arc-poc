import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const SUPABASE_URL='https://svxbzkjxihcwsbyheyxd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';
const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const $=id=>document.getElementById(id);
const escapeHTML=(value='')=>String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
let historyFilter='all';
let historyCache=null;

function toast(message){const el=$('toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('show'),2800)}
function kgToLb(v){return Number(v||0)/0.45359237}
function fmtDuration(start,end){if(!start||!end)return '—';const mins=Math.max(1,Math.round((new Date(end)-new Date(start))/60000));return mins<60?`${mins} min`:`${Math.floor(mins/60)}h ${mins%60}m`}
function sessionMinutes(s){return s.started_at&&s.completed_at?Math.max(0,(new Date(s.completed_at)-new Date(s.started_at))/60000):0}

function ensureHistoryView(){
  if($('view-history'))return;
  const side=document.querySelector('.side-nav');
  const connectionsSide=side?.querySelector('[data-view="connections"]');
  if(side&&!side.querySelector('[data-view="history"]')){
    const b=document.createElement('button');b.className='nav-item';b.dataset.view='history';b.innerHTML='<span>↺</span> History';side.insertBefore(b,connectionsSide||null);
  }
  const mobile=document.querySelector('.mobile-nav');
  const connectMobile=mobile?.querySelector('[data-view="connections"]');
  if(connectMobile){connectMobile.dataset.view='history';connectMobile.innerHTML='<span>↺</span><small>History</small>';}
  const connections=$('view-connections');
  const section=document.createElement('section');
  section.id='view-history';section.className='view';
  section.innerHTML=`
    <div class="section-heading inline-heading history-heading"><div><span class="eyebrow">Training history</span><h1>The work adds up.</h1><p>Useful history without turning every workout into homework.</p></div><button class="button" data-view-target="train">Start today's workout →</button></div>
    <div id="historyStats" class="history-stats"></div>
    <div class="history-toolbar"><div class="history-filters"><button class="active" data-history-filter="all">All workouts</button><button data-history-filter="favorites">Favorites</button></div><button class="text-button" data-view-target="connections">Manage connections →</button></div>
    <div id="historyList" class="history-list"><div class="empty-state">Loading training history…</div></div>`;
  connections?.parentElement?.insertBefore(section,connections);
  document.querySelectorAll('[data-history-filter]').forEach(btn=>btn.addEventListener('click',()=>{historyFilter=btn.dataset.historyFilter;document.querySelectorAll('[data-history-filter]').forEach(x=>x.classList.toggle('active',x===btn));renderHistory();}));
  const recent=$('recentWorkouts');
  const viewAll=recent?.closest('.panel')?.querySelector('[data-view-target="train"]');
  if(viewAll)viewAll.dataset.viewTarget='history';
  const trainHeading=$('view-train')?.querySelector('.section-heading');
  if(trainHeading&&!$('trainingHistoryShortcut')){const b=document.createElement('button');b.id='trainingHistoryShortcut';b.className='text-button history-shortcut';b.dataset.viewTarget='history';b.textContent='View training history →';trainHeading.appendChild(b);}
}

async function authUser(){const{data,error}=await supabase.auth.getUser();if(error||!data.user)throw new Error('Sign in again to view history.');return data.user}

async function loadHistory(){
  ensureHistoryView();
  try{
    const user=await authUser();
    const [sessionsRes,savedRes]=await Promise.all([
      supabase.from('workout_sessions').select('*').eq('user_id',user.id).eq('status','completed').order('completed_at',{ascending:false}).limit(60),
      supabase.from('saved_workouts').select('*').eq('user_id',user.id)
    ]);
    if(sessionsRes.error)throw sessionsRes.error;if(savedRes.error)throw savedRes.error;
    const sessions=sessionsRes.data||[];const saved=savedRes.data||[];
    const ids=sessions.map(s=>s.id);
    let exercises=[],sets=[];
    if(ids.length){const exRes=await supabase.from('workout_session_exercises').select('*').in('workout_session_id',ids).order('sort_order');if(exRes.error)throw exRes.error;exercises=exRes.data||[];const exIds=exercises.map(e=>e.id);if(exIds.length){const setRes=await supabase.from('workout_sets').select('*').in('workout_exercise_id',exIds).order('set_number');if(setRes.error)throw setRes.error;sets=setRes.data||[];}}
    historyCache={sessions,saved,exercises,sets};renderHistory();
  }catch(error){if($('historyList'))$('historyList').innerHTML=`<div class="empty-state">${escapeHTML(error.message||'Could not load training history.')}</div>`;}
}

function groupedHistory(){
  const c=historyCache||{sessions:[],saved:[],exercises:[],sets:[]};
  const savedIds=new Set(c.saved.map(x=>x.workout_session_id));
  const setsByExercise=new Map();for(const set of c.sets){if(!setsByExercise.has(set.workout_exercise_id))setsByExercise.set(set.workout_exercise_id,[]);setsByExercise.get(set.workout_exercise_id).push(set)}
  const exercisesBySession=new Map();for(const ex of c.exercises){if(!exercisesBySession.has(ex.workout_session_id))exercisesBySession.set(ex.workout_session_id,[]);exercisesBySession.get(ex.workout_session_id).push({...ex,sets:setsByExercise.get(ex.id)||[]})}
  return c.sessions.map(s=>({...s,isFavorite:savedIds.has(s.id),exercises:exercisesBySession.get(s.id)||[]}));
}

function workoutMetrics(session){
  const allSets=session.exercises.flatMap(e=>e.sets);const completed=allSets.filter(s=>s.completed);const volumeKg=completed.reduce((sum,s)=>sum+(Number(s.reps)||0)*(Number(s.weight_kg)||0),0);
  return {sets:completed.length||allSets.length,volumeLb:kgToLb(volumeKg)};
}

function renderStats(sessions){
  const el=$('historyStats');if(!el)return;
  const cutoff=Date.now()-30*86400000;const recent=sessions.filter(s=>new Date(s.completed_at).getTime()>=cutoff);const mins=Math.round(recent.reduce((sum,s)=>sum+sessionMinutes(s),0));const efforts=recent.map(s=>Number(s.perceived_effort)).filter(Boolean);const avg=efforts.length?(efforts.reduce((a,b)=>a+b,0)/efforts.length).toFixed(1):'—';const fav=sessions.filter(s=>s.isFavorite).length;
  el.innerHTML=`<article><span>Last 30 days</span><strong>${recent.length}</strong><small>workouts</small></article><article><span>Training time</span><strong>${mins<60?mins:`${(mins/60).toFixed(1)}`}</strong><small>${mins<60?'minutes':'hours'}</small></article><article><span>Avg effort</span><strong>${avg}</strong><small>${avg==='—'?'log RPE to learn':'out of 10'}</small></article><article><span>Favorites</span><strong>${fav}</strong><small>ready to repeat</small></article>`;
}

function detailHTML(session){
  if(!session.exercises.length)return '<div class="history-detail-empty">No set detail was logged for this workout.</div>';
  return session.exercises.map(ex=>{const setText=ex.sets.length?ex.sets.map(s=>{const weight=s.weight_kg!=null?`${kgToLb(s.weight_kg).toFixed(1).replace('.0','')} lb`:'';const work=s.duration_seconds!=null?`${s.duration_seconds}s`:s.reps!=null?`${s.reps} reps`:'';return `<span class="history-set ${s.completed?'done':''}">${s.set_number}. ${work}${weight?` · ${weight}`:''}</span>`}).join(''):'<span class="history-set">No sets logged</span>';return `<div class="history-exercise"><strong>${escapeHTML(ex.exercise_name)}</strong><div>${setText}</div></div>`}).join('');
}

function renderHistory(){
  const all=groupedHistory();renderStats(all);const sessions=historyFilter==='favorites'?all.filter(s=>s.isFavorite):all;const el=$('historyList');if(!el)return;
  if(!sessions.length){el.innerHTML=`<div class="empty-state">${historyFilter==='favorites'?'Favorite a workout and it will live here for quick reuse.':'Complete your first workout and its story will start here.'}</div>`;return;}
  el.innerHTML=sessions.map(s=>{const m=workoutMetrics(s);const date=new Date(s.completed_at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});return `<article class="history-card" data-session-card="${s.id}"><div class="history-card-main"><div><span class="eyebrow">${date}</span><h3>${escapeHTML(s.name)}</h3><div class="history-meta"><span>◷ ${fmtDuration(s.started_at,s.completed_at)}</span>${s.perceived_effort?`<span>◇ Effort ${s.perceived_effort}/10</span>`:''}${m.sets?`<span>✓ ${m.sets} sets</span>`:''}${m.volumeLb>0?`<span>↗ ${Math.round(m.volumeLb).toLocaleString()} lb volume</span>`:''}</div>${s.notes?`<p>${escapeHTML(s.notes)}</p>`:''}</div><button class="favorite-history ${s.isFavorite?'active':''}" data-favorite-session="${s.id}" aria-label="${s.isFavorite?'Remove favorite':'Favorite workout'}">${s.isFavorite?'♥':'♡'}</button></div><div class="history-actions"><button class="text-button" data-toggle-detail="${s.id}">View workout ↓</button><button class="button" data-repeat-session="${s.id}">Repeat workout</button></div><div id="historyDetail-${s.id}" class="history-detail hidden">${detailHTML(s)}</div></article>`}).join('');
  el.querySelectorAll('[data-toggle-detail]').forEach(btn=>btn.addEventListener('click',()=>{const d=$(`historyDetail-${btn.dataset.toggleDetail}`);d?.classList.toggle('hidden');btn.textContent=d?.classList.contains('hidden')?'View workout ↓':'Hide workout ↑';}));
  el.querySelectorAll('[data-favorite-session]').forEach(btn=>btn.addEventListener('click',()=>toggleFavorite(btn.dataset.favoriteSession)));
  el.querySelectorAll('[data-repeat-session]').forEach(btn=>btn.addEventListener('click',()=>repeatWorkout(btn.dataset.repeatSession,btn)));
}

async function toggleFavorite(sessionId){
  try{const user=await authUser();const saved=historyCache?.saved.find(x=>x.workout_session_id===sessionId);if(saved){const{error}=await supabase.from('saved_workouts').delete().eq('id',saved.id);if(error)throw error;toast('Removed from favorites.');}else{const{error}=await supabase.from('saved_workouts').insert({user_id:user.id,workout_session_id:sessionId});if(error)throw error;toast('Saved to favorites.');}await loadHistory();}catch(error){toast(error.message||'Could not update favorite.');}
}

async function repeatWorkout(sessionId,button){
  const original=button.textContent;button.disabled=true;button.textContent='Preparing…';
  try{
    const user=await authUser();const source=groupedHistory().find(s=>s.id===sessionId);if(!source)throw new Error('Workout not found.');
    const{data:newSession,error}=await supabase.from('workout_sessions').insert({user_id:user.id,source_option_id:source.source_option_id||null,name:source.name,status:'in_progress',started_at:new Date().toISOString()}).select().single();if(error)throw error;
    let rows=[];
    if(source.source_option_id){const{data:plan,error:planError}=await supabase.from('workout_option_exercises').select('*').eq('workout_option_id',source.source_option_id).order('sort_order');if(planError)throw planError;rows=(plan||[]).map(x=>({user_id:user.id,workout_session_id:newSession.id,sort_order:x.sort_order,exercise_name:x.exercise_name,notes:`Target: ${x.target_sets||''} x ${x.target_reps||''}`}));}
    if(!rows.length)rows=source.exercises.map((x,i)=>({user_id:user.id,workout_session_id:newSession.id,sort_order:i+1,exercise_name:x.exercise_name,notes:x.notes||`Target: ${Math.max(1,x.sets.length||3)} x repeat prior performance`}));
    if(rows.length){const{error:copyError}=await supabase.from('workout_session_exercises').insert(rows);if(copyError)throw copyError;}
    toast('Workout ready. Picking up where you left off.');setTimeout(()=>window.location.reload(),500);
  }catch(error){toast(error.message||'Could not repeat workout.');button.disabled=false;button.textContent=original;}
}

async function completeWithReceipt(button){
  const original=button.textContent;button.disabled=true;button.textContent='Saving workout…';
  try{
    const user=await authUser();
    const{data:session,error:sessionError}=await supabase.from('workout_sessions').select('*').eq('user_id',user.id).eq('status','in_progress').order('started_at',{ascending:false}).limit(1).maybeSingle();
    if(sessionError||!session)throw sessionError||new Error('No active workout found.');
    const effortValue=document.querySelector('input[name="sessionEffort"]:checked')?.value;const note=$('sessionNote')?.value.trim()||null;const completedAt=new Date().toISOString();
    const{data:exercises,error:exError}=await supabase.from('workout_session_exercises').select('id').eq('workout_session_id',session.id);if(exError)throw exError;
    const exIds=(exercises||[]).map(x=>x.id);let sets=[];
    if(exIds.length){const{data,error}=await supabase.from('workout_sets').select('*').in('workout_exercise_id',exIds);if(error)throw error;sets=data||[];}
    const{error:updateError}=await supabase.from('workout_sessions').update({status:'completed',completed_at:completedAt,counts_toward_arc:true,perceived_effort:effortValue?Number(effortValue):null,notes:note}).eq('id',session.id);if(updateError)throw updateError;
    const completedSets=sets.filter(s=>s.completed);const volumeLb=kgToLb(completedSets.reduce((sum,s)=>sum+(Number(s.reps)||0)*(Number(s.weight_kg)||0),0));
    const duration=fmtDuration(session.started_at,completedAt);
    const{data:arc}=await supabase.from('arc_progress_28d').select('*').eq('user_id',user.id).maybeSingle();
    const arcLine=arc?.arc_state==='learning'?`${arc.weekly_completed} of ${arc.weekly_target} workouts this week.`:arc?.adherence_pct!=null?`${Math.round(Number(arc.adherence_pct))}% rolling consistency.`:'The pattern moved forward.';
    historyCache=null;
    const active=$('activeWorkout');
    if(active){active.innerHTML=`<div class="completion-receipt"><span class="eyebrow">Workout complete</span><h2>That counts.</h2><p>You showed up. Arc records the pattern—not perfection.</p><div class="receipt-stats"><div><span>Time</span><strong>${duration}</strong></div><div><span>Sets</span><strong>${completedSets.length||'—'}</strong></div>${volumeLb>0?`<div><span>Logged volume</span><strong>${Math.round(volumeLb).toLocaleString()} lb</strong></div>`:''}${effortValue?`<div><span>Effort</span><strong>${effortValue}/10</strong></div>`:''}</div><div class="receipt-arc"><strong>${escapeHTML(arcLine)}</strong><span>80% is still the finish line.</span></div><div class="receipt-actions"><button id="receiptDone" class="button button-primary">Back to Today</button><button id="receiptHistory" class="button">View history</button></div></div>`;active.scrollIntoView({behavior:'smooth',block:'start'});}
    $('receiptDone')?.addEventListener('click',()=>window.location.reload());
    $('receiptHistory')?.addEventListener('click',async()=>{await loadHistory();document.querySelector('[data-view="history"]')?.click();});
  }catch(error){toast(error.message||'Could not complete workout.');button.disabled=false;button.textContent=original;}
}

function install(){
  ensureHistoryView();
  document.addEventListener('click',e=>{if(e.target.closest('[data-view="history"],[data-view-target="history"]'))setTimeout(loadHistory,100);});
  document.addEventListener('click',e=>{const button=e.target.closest('#confirmFinishWorkout');if(!button)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();completeWithReceipt(button);},true);
  const history=$('view-history');if(history){new MutationObserver(()=>{if(history.classList.contains('active-view'))loadHistory();}).observe(history,{attributes:true,attributeFilter:['class']});}
  supabase.auth.onAuthStateChange((_event,session)=>{if(session?.user)setTimeout(loadHistory,250)});
}

window.addEventListener('DOMContentLoaded',install);setTimeout(install,0);