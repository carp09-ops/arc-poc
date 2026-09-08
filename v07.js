// Arc 0.7 — Connected Body Foundation
(function(){
  const BUILD='0.7';
  let sources=[];
  const cloud=()=>window.ArcCloud;
  const client=()=>cloud()?.client;
  const user=()=>cloud()?.user;
  const lab=()=>new URLSearchParams(location.search).has('debug');

  async function ensureCoreSources(){
    if(!client()||!user()||lab())return;
    const rows=[
      {user_id:user().id,provider:'arc',source_kind:'app',display_name:'Arc',external_identifier:'arc-web',is_active:true,metadata:{build:BUILD,role:'primary_app'}},
      {user_id:user().id,provider:'manual',source_kind:'manual',display_name:'Manual entry',external_identifier:'arc-manual',is_active:true,metadata:{role:'user_entered'}}
    ];
    const {error}=await client().from('data_sources').upsert(rows,{onConflict:'user_id,provider,external_identifier'});
    if(error)console.warn('Arc sources bootstrap',error);
  }

  async function loadSources(){
    if(!client()||!user()||lab())return [];
    await ensureCoreSources();
    const {data,error}=await client().from('data_sources').select('*').eq('user_id',user().id).order('connected_at',{ascending:true});
    if(error){console.warn('Arc sources load',error);return []}
    sources=data||[];return sources;
  }

  const active=p=>sources.some(s=>s.provider===p&&s.is_active);
  const sourceRow=p=>sources.find(s=>s.provider===p&&s.is_active);
  const fmtSync=d=>d?new Date(d).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Not synced yet';
  const chip=(label,kind='manual')=>`<span class="arc-source-chip ${kind}"><i></i>${label}</span>`;

  function connectedMarkup(){
    const arc=sourceRow('arc'),manual=sourceRow('manual'),apple=sourceRow('apple_health');
    return `<div class="arc-connect-modal">
      <div class="arc-connect-head"><div><span class="eyebrow">CONNECTED BODY</span><h1>Let your devices do the logging.</h1><p>Arc should only ask for information your devices cannot reliably observe.</p></div><button data-close-connected>×</button></div>
      <section class="arc-connect-hero">
        <div><span class="eyebrow">AUTOMATION TARGET</span><h2>Observe more. Enter less.</h2><p>Apple Health becomes Arc’s primary device bridge on iPhone. Data stays source-aware so Arc always knows what was measured, entered, or inferred.</p></div>
        <div class="arc-connect-meter"><b>${apple?'LIVE':'NEXT'}</b><span>${apple?'HealthKit connected':'iOS HealthKit pilot'}</span></div>
      </section>
      <div class="arc-connect-grid">
        <article class="arc-provider-card primary ${apple?'connected':''}">
          <div class="provider-icon apple">♥</div><div class="provider-copy"><div class="provider-title"><h3>Apple Health</h3>${apple?chip('CONNECTED','device'):chip('IOS BETA','ready')}</div><p>Arc’s native bridge for health and fitness data already collected by iPhone, Apple Watch, and compatible apps/devices.</p>
          <div class="provider-streams">${['Steps','Sleep','Heart rate','Resting HR','Workouts','Weight','Body fat','Active energy','Distance'].map(x=>`<span>${x}</span>`).join('')}</div>
          ${apple?`<small>Last sync · ${fmtSync(apple.last_sync_at)}</small>`:`<small>Requires the Arc iOS app because HealthKit access is granted natively on the device.</small>`}</div>
        </article>
        <article class="arc-provider-card">
          <div class="provider-icon watch">◉</div><div class="provider-copy"><div class="provider-title"><h3>Apple Watch</h3>${chip('VIA APPLE HEALTH','ready')}</div><p>No separate Arc login needed. Watch activity, workouts, sleep and heart metrics can flow through the HealthKit permission you control.</p></div>
        </article>
        <article class="arc-provider-card">
          <div class="provider-icon scale">↕</div><div class="provider-copy"><div class="provider-title"><h3>Smart Scale</h3>${chip('DEVICE-READY','ready')}</div><p>Compatible scales that write weight or body composition into Apple Health can become automatic Arc inputs without another daily entry.</p></div>
        </article>
        <article class="arc-provider-card connected">
          <div class="provider-icon arc"><img src="assets/arc-monogram-transparent.svg" alt=""></div><div class="provider-copy"><div class="provider-title"><h3>Arc</h3>${chip(arc?'CONNECTED':'READY','app')}</div><p>Your workouts, plans, RIR, Signals and Weekly Arc remain first-party Arc data.</p>${arc?`<small>Cloud source · ${fmtSync(arc.last_sync_at||arc.connected_at)}</small>`:''}</div>
        </article>
        <article class="arc-provider-card connected">
          <div class="provider-icon manual">✦</div><div class="provider-copy"><div class="provider-title"><h3>You</h3>${chip(manual?'ACTIVE':'READY','manual')}</div><p>Manual entry stays for the things only you know: circumference, perceived stress, energy, recovery, photos and context.</p></div>
        </article>
      </div>
      <section class="arc-source-principle"><span>ARC DATA PRINCIPLE</span><h2>Every metric keeps its origin.</h2><div class="arc-source-example"><div><small>WEIGHT</small><b>164.8 lb</b><span>Withings → Apple Health</span></div><i>+</i><div><small>RECOVERY</small><b>4 / 5</b><span>Entered by you</span></div><i>→</i><div><small>SIGNAL</small><b>Recovery pattern</b><span>Inferred by Arc</span></div></div><p>Measured, entered and inferred data are not treated as interchangeable. Arc keeps provenance attached to the evidence.</p></section>
      <section class="arc-native-next"><img src="assets/arc-monogram-transparent.svg" alt=""><div><span class="eyebrow">NATIVE LAYER</span><h2>The web app proves the intelligence. iOS removes the friction.</h2><p>The next native build will request only the Health permissions needed for the experience and sync authorized samples into the same private Arc account you’re using now.</p></div></section>
    </div>`;
  }

  async function openConnected(){
    await loadSources();
    let host=document.querySelector('.arc-connect-overlay');if(host)host.remove();
    host=document.createElement('div');host.className='arc-connect-overlay';host.innerHTML=`<div class="arc-connect-backdrop" data-close-connected></div>${connectedMarkup()}`;document.body.appendChild(host);document.body.classList.add('arc-modal-open');
  }
  function closeConnected(){document.querySelector('.arc-connect-overlay')?.remove();document.body.classList.remove('arc-modal-open')}

  function addMenuLink(){
    const menu=document.querySelector('.arc-cloud-menu');if(!menu||menu.querySelector('[data-connected-data]'))return;
    const b=document.createElement('button');b.setAttribute('data-connected-data','');b.textContent='Connected Data';menu.prepend(b);
  }

  function decorateSources(){
    const w=document.querySelector('.v052-weight-card .v052-card-head');
    if(w&&!w.querySelector('.arc-source-chip'))w.appendChild(htmlEl(chip('MANUAL','manual')));
    const c=document.querySelector('.v052-context-card .v052-card-head');
    if(c&&!c.querySelector('.arc-source-chip'))c.appendChild(htmlEl(chip('YOU','manual')));
    const t=document.querySelector('.train-feature .weekly-card');
    if(t&&!t.querySelector('.arc-source-chip'))t.appendChild(htmlEl(chip('ARC','app')));
  }

  function htmlEl(str){const t=document.createElement('template');t.innerHTML=str.trim();return t.content.firstElementChild}

  function addTodayTeaser(){
    if(S?.screen!=='today')return;
    const stage=document.querySelector('.arc-stage');if(!stage||stage.querySelector('.arc-automation-teaser'))return;
    const anchor=stage.querySelector('.v052-today-context')||stage.querySelector('.cinema-hero');
    const el=document.createElement('section');el.className='arc-automation-teaser';el.innerHTML=`<div class="arc-auto-icon"><img src="assets/arc-monogram-transparent.svg" alt=""></div><div><span class="eyebrow">CONNECTED BODY</span><h3>Arc is learning how to ask you for less.</h3><p>Steps, sleep, workouts, heart metrics and compatible scale data can become automatic in the native iOS layer.</p></div><button data-connected-data>View Sources →</button>`;
    if(anchor)anchor.insertAdjacentElement('afterend',el);else stage.prepend(el);
  }

  const renderBase=window.render;
  if(renderBase)window.render=function(){renderBase();requestAnimationFrame(()=>{addMenuLink();decorateSources();addTodayTeaser()})};

  const mo=new MutationObserver(()=>{addMenuLink();decorateSources();addTodayTeaser()});mo.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-connected-data]')){document.querySelector('.arc-cloud-menu')?.classList.remove('open');openConnected()}
    if(e.target.closest('[data-close-connected]'))closeConnected();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeConnected()});

  async function boot(){
    for(let i=0;i<30&&!user();i++)await new Promise(r=>setTimeout(r,200));
    if(user())await loadSources();
    addMenuLink();decorateSources();addTodayTeaser();
  }
  window.ArcConnected={open:openConnected,refresh:loadSources,get sources(){return sources}};
  boot();
})();