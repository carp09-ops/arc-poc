import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const SUPABASE_URL='https://svxbzkjxihcwsbyheyxd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';
const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
});

const DAY=86400000;
let refreshTimer=null;
let activeUserId=null;

const pounds=kg=>Number(kg)/0.45359237;
const mean=values=>values.length?values.reduce((sum,value)=>sum+Number(value||0),0)/values.length:0;
const dateMs=value=>new Date(value).getTime();
const daysBetween=(a,b)=>Math.max(0,(dateMs(b)-dateMs(a))/DAY);

function ensureCard(){
  const card=document.querySelector('#view-today .dashboard-grid .slate-card');
  if(!card) return null;
  if(card.dataset.arcSeesReady==='1') return card;
  card.dataset.arcSeesReady='1';
  card.classList.add('arc-sees-card');
  card.innerHTML=`
    <span class="metric-label">What Arc sees</span>
    <blockquote id="arcSeesSummary">Arc is learning your pattern.</blockquote>
    <div id="arcSeesSources" class="arc-sees-sources" aria-label="Signals Arc is learning from">
      <span class="arc-sees-source" data-signal="training">Training</span>
      <span class="arc-sees-source" data-signal="readiness">Readiness</span>
      <span class="arc-sees-source" data-signal="body">Body</span>
    </div>
    <div class="gold-rule"></div>`;
  return card;
}

function setSignalState(signal,ready){
  const el=document.querySelector(`#arcSeesSources [data-signal="${signal}"]`);
  if(!el) return;
  el.classList.toggle('is-ready',!!ready);
  el.classList.toggle('is-learning',!ready);
  el.title=ready?'Active signal':'Still learning';
}

function trainingSignal(workouts,target){
  const now=Date.now();
  const last7=workouts.filter(row=>dateMs(row.completed_at)>=now-(7*DAY)).length;
  const prior7=workouts.filter(row=>{
    const t=dateMs(row.completed_at);
    return t<now-(7*DAY)&&t>=now-(14*DAY);
  }).length;
  const weekly=Number(target?.workouts_per_week||0);

  if(weekly>0){
    if(last7===0) return {ready:true,copy:`No completed sessions in the last 7 days against your ${weekly}-day target. One deliberate session restarts the pattern.`};
    const successLine=Math.max(1,Math.ceil(weekly*.8));
    if(last7>=successLine) return {ready:true,copy:`${last7} session${last7===1?'':'s'} in the last 7 days against your ${weekly}-day target. Your training rhythm is in the success zone.`};
    if(prior7>0&&last7>prior7) return {ready:true,copy:`${last7} session${last7===1?'':'s'} in the last 7 days, up from ${prior7} the week before. Momentum is building.`};
    return {ready:true,copy:`${last7} session${last7===1?'':'s'} in the last 7 days against your ${weekly}-day target. The pattern is still within reach.`};
  }

  if(workouts.length) return {ready:true,copy:`${last7} completed session${last7===1?'':'s'} in the last 7 days. Set a weekly target to give that rhythm more context.`};
  return {ready:false,copy:null};
}

function readinessSignal(checkins){
  const cutoff=Date.now()-(14*DAY);
  const recent=checkins.filter(row=>dateMs(row.checked_in_at)>=cutoff).slice(0,8);
  if(recent.length<3) return {ready:false,copy:null};

  const energy=mean(recent.map(row=>row.energy));
  const soreness=mean(recent.map(row=>row.soreness));
  if(energy<=2.4||soreness>=3.5) return {ready:true,copy:'Recent readiness check-ins are leaning recovery-first.'};
  if(energy>=3.8&&soreness<=2.3) return {ready:true,copy:'Recent readiness check-ins show strong training runway.'};
  return {ready:true,copy:'Recent readiness has been balanced.'};
}

function regressionDelta(points){
  const firstTime=dateMs(points[0].measured_at);
  const xs=points.map(point=>(dateMs(point.measured_at)-firstTime)/DAY);
  const ys=points.map(point=>pounds(point.weight_kg));
  const xMean=mean(xs),yMean=mean(ys);
  let numerator=0,denominator=0;
  xs.forEach((x,index)=>{
    numerator+=(x-xMean)*(ys[index]-yMean);
    denominator+=(x-xMean)*(x-xMean);
  });
  if(!denominator) return 0;
  return (numerator/denominator)*(xs.at(-1)-xs[0]);
}

function bodySignal(measurements,baselineStartedAt){
  const points=measurements
    .filter(row=>row.weight_kg!=null&&(!baselineStartedAt||dateMs(row.measured_at)>=dateMs(baselineStartedAt)))
    .sort((a,b)=>dateMs(a.measured_at)-dateMs(b.measured_at));
  if(points.length<3) return {ready:false,copy:null};

  const span=Math.round(daysBetween(points[0].measured_at,points.at(-1).measured_at));
  if(span<7) return {ready:false,copy:null};
  const delta=regressionDelta(points);
  if(Math.abs(delta)<0.7) return {ready:true,copy:`Your weight trend has been broadly steady across ${span} days.`};
  const direction=delta<0?'lower':'higher';
  return {ready:true,copy:`Your weight trend is about ${Math.abs(delta).toFixed(1)} lb ${direction} across ${span} days.`};
}

function composeInsight(training,readiness,body){
  const ready=[training,readiness,body].filter(signal=>signal.ready&&signal.copy);
  if(!ready.length) return 'Arc is still learning. A few more training, readiness, and body check-ins will turn activity into a useful pattern.';
  return ready.map(signal=>signal.copy).join(' ');
}

function cacheKey(uid){return `arc.what-sees.v1.${uid}`;}

function renderInsight(insight){
  const card=ensureCard();
  if(!card) return;
  const summary=document.getElementById('arcSeesSummary');
  if(summary) summary.textContent=insight.summary;
  setSignalState('training',insight.training);
  setSignalState('readiness',insight.readiness);
  setSignalState('body',insight.body);
  card.classList.toggle('arc-sees-learning',![insight.training,insight.readiness,insight.body].some(Boolean));
}

function renderCached(uid){
  try{
    const cached=JSON.parse(localStorage.getItem(cacheKey(uid))||'null');
    if(cached?.summary) renderInsight(cached);
  }catch(_){/* ignore corrupt cache */}
}

async function refresh(){
  clearTimeout(refreshTimer);
  ensureCard();
  const {data:{session}}=await supabase.auth.getSession();
  const uid=session?.user?.id;
  if(!uid) return;
  activeUserId=uid;
  renderCached(uid);

  const since28=new Date(Date.now()-(28*DAY)).toISOString();
  const [profileRes,targetRes,workoutsRes,readinessRes,bodyRes]=await Promise.all([
    supabase.from('profiles').select('baseline_started_at').eq('user_id',uid).maybeSingle(),
    supabase.from('weekly_targets').select('workouts_per_week,starts_on').eq('user_id',uid).order('starts_on',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('workout_sessions').select('completed_at').eq('user_id',uid).eq('status','completed').eq('counts_toward_arc',true).gte('completed_at',since28).order('completed_at',{ascending:false}),
    supabase.from('readiness_checkins').select('checked_in_at,energy,soreness,desired_effort').eq('user_id',uid).gte('checked_in_at',since28).order('checked_in_at',{ascending:false}).limit(12),
    supabase.from('body_measurements').select('measured_at,weight_kg').eq('user_id',uid).gte('measured_at',since28).order('measured_at',{ascending:false}).limit(12)
  ]);

  const error=[profileRes,targetRes,workoutsRes,readinessRes,bodyRes].find(result=>result.error)?.error;
  if(error){
    if(!navigator.onLine){
      const summary=document.getElementById('arcSeesSummary');
      if(summary&&!localStorage.getItem(cacheKey(uid))) summary.textContent='Arc will refresh your pattern when you reconnect.';
    }
    return;
  }

  const training=trainingSignal(workoutsRes.data||[],targetRes.data);
  const readiness=readinessSignal(readinessRes.data||[]);
  const body=bodySignal(bodyRes.data||[],profileRes.data?.baseline_started_at||null);
  const insight={
    summary:composeInsight(training,readiness,body),
    training:training.ready,
    readiness:readiness.ready,
    body:body.ready,
    updatedAt:new Date().toISOString()
  };
  renderInsight(insight);
  try{localStorage.setItem(cacheKey(uid),JSON.stringify(insight));}catch(_){/* storage may be unavailable */}
}

function scheduleRefresh(delay=700){
  clearTimeout(refreshTimer);
  refreshTimer=setTimeout(()=>refresh().catch(()=>{}),delay);
}

ensureCard();
scheduleRefresh(500);
window.addEventListener('pageshow',()=>scheduleRefresh(350));
window.addEventListener('online',()=>scheduleRefresh(250));
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible') scheduleRefresh(300);
});
document.addEventListener('submit',event=>{
  const id=event.target?.id;
  if(id==='readinessForm'||id==='measurementForm'||id==='startingPointForm') scheduleRefresh(id==='readinessForm'?2600:1300);
});
document.addEventListener('click',event=>{
  if(event.target?.closest?.('#completeWorkout')) scheduleRefresh(1600);
});

supabase.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'){
    activeUserId=null;
    return;
  }
  if(session?.user?.id&&session.user.id!==activeUserId) scheduleRefresh(400);
});
