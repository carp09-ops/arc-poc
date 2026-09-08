// Arc 0.6.1 — Supabase Auth + live cloud persistence
(function(){
  const SUPABASE_URL='https://svxbzkjxihcwsbyheyxd.supabase.co';
  const SUPABASE_KEY='sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';
  const BUILD='0.6.1';
  const isLab=new URLSearchParams(location.search).has('debug');
  if(!window.supabase?.createClient){console.error('Arc Cloud: Supabase client unavailable');return;}

  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const originalSetItem=Storage.prototype.setItem;
  let user=null,ready=false,suppress=false,syncTimer=null,lastSync=null,syncing=false;

  function safeState(raw){
    const base=typeof defaults!=='undefined'?structuredClone(defaults):{screen:'welcome',on:1,profile:{},logs:{},done:false};
    const x=raw&&typeof raw==='object'?raw:{};
    const out={...base,...x,profile:{...(base.profile||{}),...(x.profile||{})},logs:{...(base.logs||{}),...(x.logs||{})}};
    out.history=out.history||{};
    for(const k of ['workouts','nutrition','body','activity','sleep','signals','weight','context','measurements'])out.history[k]=Array.isArray(out.history[k])?out.history[k]:[];
    out.meta=out.meta||{};
    return out;
  }

  function localState(){try{return safeState(JSON.parse(localStorage.getItem('arcState')||'null'))}catch(e){return safeState(null)}}
  function writeLocal(state){suppress=true;try{S=safeState(state);originalSetItem.call(localStorage,'arcState',JSON.stringify(S));}finally{suppress=false}}
  function cloudBadge(status='saved'){
    document.querySelectorAll('.arc-cloud-pill').forEach(el=>{
      const label=status==='syncing'?'Syncing…':status==='error'?'Sync issue':isLab?'LAB · Local only':'Saved to Arc';
      el.dataset.status=status;const t=el.querySelector('[data-cloud-label]');if(t)t.textContent=label;
    });
  }

  async function syncProfile(state){
    if(!user||isLab)return;
    const p=state.profile||{};
    const {error}=await client.from('profiles').upsert({
      user_id:user.id,
      display_name:p.name||null,
      primary_goal:p.primary||null,
      goals:Array.isArray(p.goals)?p.goals:[],
      why:p.why||null,
      preferences:{
        life:p.life||null,sleep:p.sleep||null,location:p.location||null,experience:p.experience||null,
        days:p.days||null,duration:p.duration||null,nutrition:p.nutrition||null,
        activities:p.activities||p.preferences?.activities||[],equipment:p.equipment||p.preferences?.equipment||[]
      },
      onboarding_completed:!['welcome','onboard','baseline'].includes(state.screen)
    },{onConflict:'user_id'});
    if(error)throw error;
  }

  async function syncSnapshot(force=false){
    if(!ready||!user||suppress||syncing||isLab)return;
    syncing=true;cloudBadge('syncing');
    try{
      const state=localState();state.meta=state.meta||{};state.meta.cloudUserId=user.id;state.meta.cloudBuild=BUILD;
      const now=new Date().toISOString();
      const {error}=await client.from('user_state').upsert({user_id:user.id,state,client_version:BUILD,device_updated_at:now},{onConflict:'user_id'});
      if(error)throw error;
      await syncProfile(state);
      lastSync=now;cloudBadge('saved');
    }catch(err){console.error('Arc Cloud sync failed',err);cloudBadge('error');}
    finally{syncing=false;}
  }

  function scheduleSync(){
    if(!ready||!user||isLab)return;
    clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncSnapshot(),850);
  }

  Storage.prototype.setItem=function(key,value){
    const result=originalSetItem.apply(this,arguments);
    if(this===localStorage&&key==='arcState'&&!suppress)scheduleSync();
    return result;
  };

  async function hydrateFromCloud(){
    if(!user||isLab){ready=true;return;}
    cloudBadge('syncing');
    const {data,error}=await client.from('user_state').select('state,updated_at,client_version').eq('user_id',user.id).maybeSingle();
    if(error){console.error('Arc Cloud load failed',error);ready=true;cloudBadge('error');return;}
    if(data?.state&&Object.keys(data.state).length){
      writeLocal(data.state);
      try{ArcData?.evaluateSignals?.()}catch(e){}
      try{render()}catch(e){location.reload()}
      lastSync=data.updated_at;ready=true;cloudBadge('saved');
    }else{
      ready=true;await syncSnapshot(true);
    }
  }

  function authMarkup(mode='signin',message=''){
    const create=mode==='signup';
    return `<div class="arc-auth-card">
      <img class="arc-auth-lockup" src="assets/arc-lockup-horizontal-transparent.svg" alt="Arc — Progress Has a Shape">
      <span class="arc-auth-kicker">YOUR BODY. YOUR DATA. YOUR ARC.</span>
      <h1>${create?'Create your Arc.':'Welcome back.'}</h1>
      <p>${create?'Your progress will now follow you securely across devices.':'Sign in to continue your private progress story.'}</p>
      <div class="arc-auth-tabs"><button data-auth-mode="signin" class="${!create?'active':''}">Sign in</button><button data-auth-mode="signup" class="${create?'active':''}">Create account</button></div>
      ${create?'<label>First name<input id="arc-auth-name" autocomplete="given-name" placeholder="Kimberly"></label>':''}
      <label>Email<input id="arc-auth-email" type="email" autocomplete="email" placeholder="you@example.com"></label>
      <label>Password<input id="arc-auth-password" type="password" autocomplete="current-password" placeholder="At least 6 characters"></label>
      <button class="arc-auth-submit" data-auth-submit="${mode}">${create?'Create My Arc →':'Sign In →'}</button>
      <div class="arc-auth-message ${message?'show':''}" data-auth-message>${message}</div>
      <div class="arc-auth-private"><i>◆</i><span><b>Private by design.</b><small>Your health data is protected by your account and can only be read by you.</small></span></div>
    </div>`;
  }

  function showAuth(mode='signin',message=''){
    let gate=document.querySelector('.arc-auth-gate');
    if(!gate){gate=document.createElement('div');gate.className='arc-auth-gate';document.body.appendChild(gate)}
    gate.innerHTML=`<div class="arc-auth-backdrop"></div>${authMarkup(mode,message)}`;
  }
  function hideAuth(){document.querySelector('.arc-auth-gate')?.remove()}
  function setMessage(msg,error=false){const el=document.querySelector('[data-auth-message]');if(!el)return;el.textContent=msg;el.classList.add('show');el.classList.toggle('error',error)}

  async function signIn(){
    const email=document.querySelector('#arc-auth-email')?.value.trim(),password=document.querySelector('#arc-auth-password')?.value||'';
    if(!email||!password){setMessage('Enter your email and password.',true);return}
    const btn=document.querySelector('[data-auth-submit]');if(btn){btn.disabled=true;btn.textContent='Signing in…'}
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error){if(btn){btn.disabled=false;btn.textContent='Sign In →'}setMessage(error.message,true);return}
    user=data.user;hideAuth();installAccountChrome();await hydrateFromCloud();
  }

  async function signUp(){
    const name=document.querySelector('#arc-auth-name')?.value.trim(),email=document.querySelector('#arc-auth-email')?.value.trim(),password=document.querySelector('#arc-auth-password')?.value||'';
    if(!name||!email||password.length<6){setMessage('Add your first name, a valid email, and a password of at least 6 characters.',true);return}
    const btn=document.querySelector('[data-auth-submit]');if(btn){btn.disabled=true;btn.textContent='Creating your Arc…'}
    const {data,error}=await client.auth.signUp({email,password,options:{data:{name},emailRedirectTo:'https://carp09-ops.github.io/arc-poc/'}});
    if(error){if(btn){btn.disabled=false;btn.textContent='Create My Arc →'}setMessage(error.message,true);return}
    if(data.session){user=data.user;hideAuth();installAccountChrome();await hydrateFromCloud();}
    else{showAuth('signin','Account created. Check your email to confirm it, then return here and sign in.');}
  }

  async function signOut(){await syncSnapshot(true);await client.auth.signOut();user=null;ready=false;document.querySelector('.arc-cloud-account')?.remove();showAuth('signin','Signed out safely.');}

  function installAccountChrome(){
    if(document.querySelector('.arc-cloud-account')||!user)return;
    const wrap=document.createElement('div');wrap.className='arc-cloud-account';
    wrap.innerHTML=`<button class="arc-cloud-pill" data-cloud-menu><i></i><span><b data-cloud-label>${isLab?'LAB · Local only':'Saved to Arc'}</b><small>${user.email||''}</small></span><em>⌄</em></button><div class="arc-cloud-menu"><button data-cloud-sync>Sync now</button><button data-cloud-signout>Sign out</button></div>`;
    document.body.appendChild(wrap);
  }

  document.addEventListener('click',async e=>{
    const mode=e.target.closest('[data-auth-mode]');if(mode){showAuth(mode.dataset.authMode);return}
    const submit=e.target.closest('[data-auth-submit]');if(submit){submit.dataset.authSubmit==='signup'?await signUp():await signIn();return}
    if(e.target.closest('[data-cloud-menu]')){document.querySelector('.arc-cloud-menu')?.classList.toggle('open');return}
    if(e.target.closest('[data-cloud-sync]')){document.querySelector('.arc-cloud-menu')?.classList.remove('open');await syncSnapshot(true);return}
    if(e.target.closest('[data-cloud-signout]')){await signOut();return}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&document.querySelector('.arc-auth-gate'))document.querySelector('[data-auth-submit]')?.click()});

  const observer=new MutationObserver(()=>{if(user)installAccountChrome()});observer.observe(document.body,{childList:true,subtree:true});

  async function init(){
    const {data:{session}}=await client.auth.getSession();
    if(session?.user){user=session.user;hideAuth();installAccountChrome();await hydrateFromCloud();}
    else{showAuth('signin');}
    client.auth.onAuthStateChange(async(event,session)=>{
      if(event==='SIGNED_IN'&&session?.user&&!user){user=session.user;hideAuth();installAccountChrome();await hydrateFromCloud();}
      if(event==='SIGNED_OUT'){user=null;ready=false;showAuth('signin');}
    });
  }

  window.ArcCloud={client,get user(){return user},get ready(){return ready},get lastSync(){return lastSync},sync:()=>syncSnapshot(true),signOut};
  init();
})();