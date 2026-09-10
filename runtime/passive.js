// ARC stable Passive Morning runtime — event driven and idempotent.
(function(){
  const cloud=()=>window.ArcCloud;
  const client=()=>cloud()?.client;
  const user=()=>cloud()?.user;
  const lab=()=>new URLSearchParams(location.search).has('debug');
  let samples=[];
  let appleSource=null;
  let lastLoaded=0;
  let loading=false;

  const fmt1=n=>Number.isFinite(+n)?(+n).toFixed(1):'—';
  const localDay=d=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
  const todayKey=()=>localDay(new Date());
  const latest=type=>samples.find(x=>x.sample_type===type)||null;
  const sameDay=x=>localDay(x.start_at)===todayKey();
  const sumToday=type=>samples.filter(x=>x.sample_type===type&&sameDay(x)).reduce((a,x)=>a+(+x.value_numeric||0),0);
  const sleepHours=()=>{const cutoff=Date.now()-20*3600000;return samples.filter(x=>x.sample_type==='sleep_analysis'&&String(x.value_text||'').startsWith('asleep')&&new Date(x.end_at||x.start_at).getTime()>cutoff).reduce((a,x)=>a+Math.max(0,(new Date(x.end_at||x.start_at)-new Date(x.start_at))/3600000),0)};
  const sourceName=x=>x?.source_bundle_id?.includes('com.apple.health')?'Apple Health':x?.metadata?.source_name||'Apple Health';

  async function load(force=false){
    if(loading||lab()||!client()||!user())return;
    if(!force&&Date.now()-lastLoaded<20000)return;
    loading=true;
    try{
      const since=new Date(Date.now()-4*86400000).toISOString();
      const [{data:hs,error:he},{data:ds,error:de}]=await Promise.all([
        client().from('health_samples').select('sample_type,value_numeric,value_text,unit,start_at,end_at,source_record_id,source_bundle_id,metadata,imported_at').eq('user_id',user().id).gte('start_at',since).order('start_at',{ascending:false}).limit(600),
        client().from('data_sources').select('*').eq('user_id',user().id).eq('provider','apple_health').eq('is_active',true).maybeSingle()
      ]);
      if(he)throw he;if(de)throw de;
      samples=hs||[];appleSource=ds||null;lastLoaded=Date.now();
      renderPassive();decorateProvenance();decorateModal();
    }catch(e){console.warn('Arc passive evidence load',e)}finally{loading=false}
  }

  function summary(){
    const sleep=sleepHours(),rhr=latest('resting_heart_rate'),weight=latest('body_mass'),steps=Math.round(sumToday('step_count')),energy=Math.round(sumToday('active_energy_burned')),workout=latest('workout');
    return {sleep,rhr,weight,steps,energy,workout,has:samples.length>0};
  }
  function signature(){
    const s=summary();
    return encodeURIComponent(JSON.stringify([samples.length,fmt1(s.sleep),s.rhr?.value_numeric||'',s.weight?.value_numeric||'',s.steps,s.energy,s.workout?.start_at||'',appleSource?.last_sync_at||'']));
  }
  function metric(label,value,sub,ready=true){return `<div class="arc-passive-metric ${ready?'live':'waiting'}"><small>${label}</small><b>${value}</b><span>${sub}</span></div>`}

  function cardMarkup(sig){
    const s=summary();
    if(!s.has){
      return `<section class="arc-passive-morning waiting" data-arc-passive-sig="${sig}"><div class="arc-passive-lead"><div class="arc-passive-orbit"><img src="assets/arc-monogram-transparent.svg" alt=""></div><div><span class="eyebrow">PASSIVE MORNING</span><h2>The next version of Today is mostly automatic.</h2><p>When the native iOS pilot connects Apple Health, Arc can wake up with the objective parts of your day already assembled.</p></div></div><div class="arc-passive-grid">${metric('SLEEP','—','Apple Health',false)}${metric('RESTING HR','—','Apple Health',false)}${metric('ACTIVITY','—','Apple Health',false)}${metric('WEIGHT','—','Compatible scale',false)}</div><div class="arc-passive-foot"><span><i></i>Waiting for first HealthKit sync</span><button data-connected-data>View Connected Data →</button></div></section>`;
    }
    const observed=[s.sleep>0,s.rhr,Number.isFinite(s.steps)&&s.steps>0,s.weight].filter(Boolean).length;
    return `<section class="arc-passive-morning live" data-arc-passive-sig="${sig}"><div class="arc-passive-lead"><div class="arc-passive-orbit"><img src="assets/arc-monogram-transparent.svg" alt=""></div><div><span class="eyebrow">PASSIVE MORNING · ${observed} STREAM${observed===1?'':'S'} OBSERVED</span><h2>${s.sleep>0||s.rhr?'Arc already has your night.':'Arc already has your devices.'}</h2><p>Objective context arrived without another form. Add only the part a device cannot know.</p></div></div><div class="arc-passive-grid">${metric('SLEEP',s.sleep>0?`${fmt1(s.sleep)}h`:'—',s.sleep>0?'Observed overnight':'No sleep sample')}${metric('RESTING HR',s.rhr?`${Math.round(+s.rhr.value_numeric)} bpm`:'—',s.rhr?sourceName(s.rhr):'No reading')}${metric('STEPS',s.steps?s.steps.toLocaleString():'—',s.steps?'Observed today':'No steps yet')}${metric('WEIGHT',s.weight?`${fmt1(s.weight.value_numeric)} lb`:'—',s.weight?sourceName(s.weight):'No device weight')}</div><div class="arc-passive-secondary"><span>${s.energy?`Active energy · ${s.energy} kcal`:''}</span><span>${s.workout?`Latest workout · ${Math.round(+s.workout.value_numeric||0)} min`:''}</span></div><div class="arc-passive-foot"><span class="live-status"><i></i>${appleSource?.last_sync_at?`Synced ${new Date(appleSource.last_sync_at).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}`:'Apple Health evidence received'}</span><button data-context-jump>How do you feel today? →</button></div></section>`;
  }

  function htmlElement(html){const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstElementChild}
  function renderPassive(){
    if(typeof S==='undefined'||S.screen!=='today')return;
    const stage=document.querySelector('.arc-stage');if(!stage)return;
    stage.querySelector('.arc-automation-teaser')?.remove();
    const sig=signature(),existing=stage.querySelector('.arc-passive-morning');
    if(existing?.dataset.arcPassiveSig===sig)return;
    const next=htmlElement(cardMarkup(sig));
    if(existing){existing.replaceWith(next);return}
    const anchor=stage.querySelector('.v052-today-context')||stage.querySelector('.cinema-hero');
    if(anchor)anchor.insertAdjacentElement('afterend',next);else stage.prepend(next);
  }

  function decorateProvenance(){
    const s=summary();if(!s.weight)return;
    const chip=document.querySelector('.v052-weight-card .v052-card-head .arc-source-chip');
    if(chip&&chip.dataset.arcPassiveDevice!=='1'){chip.dataset.arcPassiveDevice='1';chip.className='arc-source-chip device';chip.innerHTML='<i></i>APPLE HEALTH';}
  }
  function labelFor(t){return ({step_count:'Steps',sleep_analysis:'Sleep',resting_heart_rate:'Resting heart rate',heart_rate:'Heart rate',body_mass:'Weight',body_fat_percentage:'Body fat',active_energy_burned:'Active energy',distance_walking_running:'Distance',workout:'Workout'})[t]||String(t).replaceAll('_',' ')}
  function valueFor(x){if(x.sample_type==='sleep_analysis')return String(x.value_text||'sleep').replaceAll('_',' ');if(x.sample_type==='workout')return `${Math.round(+x.value_numeric||0)} min`;if(x.value_numeric!=null)return `${Number(x.value_numeric).toLocaleString(undefined,{maximumFractionDigits:1})}${x.unit?' '+x.unit:''}`;return x.value_text||'observed'}
  function evidenceMarkup(){
    const s=summary(),recent=samples.slice(0,8);
    return `<section class="arc-device-evidence"><div class="arc-device-evidence-head"><div><span class="eyebrow">DEVICE EVIDENCE</span><h2>${s.has?'Arc can see the stream.':'Ready for the first sync.'}</h2><p>${s.has?'Recent samples are stored with their original timestamps and source provenance.':'The ingestion pipeline is live; the native iOS build is the missing piece.'}</p></div><b>${samples.length}</b></div>${recent.length?`<div class="arc-evidence-list">${recent.map(x=>`<div><i></i><span><b>${labelFor(x.sample_type)}</b><small>${valueFor(x)} · ${sourceName(x)}</small></span><time>${new Date(x.start_at).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</time></div>`).join('')}</div>`:`<div class="arc-evidence-empty">No HealthKit samples yet. Nothing has been fabricated or pre-seeded.</div>`}</section>`;
  }
  function decorateModal(){
    const modal=document.querySelector('.arc-connect-modal');if(!modal)return;
    modal.querySelector('.arc-device-evidence')?.remove();
    const hero=modal.querySelector('.arc-connect-hero');if(hero)hero.insertAdjacentHTML('afterend',evidenceMarkup());
  }
  function decorate(){renderPassive();decorateProvenance()}

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-context-jump]'))document.querySelector('.v052-context-card')?.scrollIntoView({behavior:'smooth',block:'center'});
    if(e.target.closest('[data-connected-data]'))setTimeout(()=>{load(true);decorateModal()},100);
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>load(true),250)});
  window.addEventListener('arc:rendered',decorate);
  window.addEventListener('arc:cloud-ready',()=>load(true));
  window.addEventListener('arc:connected-opened',()=>{decorateModal();load(true)});
  decorate();
  if(user())load(true);
  window.ArcPassive={refresh:()=>load(true),get samples(){return samples},summary};
})();