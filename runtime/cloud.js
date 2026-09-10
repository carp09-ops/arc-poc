// ARC stable cloud/auth runtime — product boot never waits on Supabase.
(function(){
  const SUPABASE_URL='https://svxbzkjxihcwsbyheyxd.supabase.co';
  const SUPABASE_KEY='sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';
  const BUILD='0.7.5-runtime-stable';
  const APP_BASE=new URL('./',location.href);
  const isLab=new URLSearchParams(location.search).has('debug');
  let client=null,user=null,ready=false,lastSync=null,syncTimer=null,syncing=false,suppress=false,activation=null,authSubscription=null;

  function dispatch(name,detail={}){try{window.dispatchEvent(new CustomEvent(name,{detail}))}catch(e){}}
  function cloneBase(){try{return typeof defaults!=='undefined'?structuredClone(defaults):{screen:'welcome',on:1,profile:{},logs:{},done:false}}catch(e){return {screen:'welcome',on:1,profile:{},logs:{},done:false}}}
  function safeState(raw){
    const base=cloneBase(),x=raw&&typeof raw==='object'?raw:{};
    const out={...base,...x,profile:{...(base.profile||{}),...(x.profile||{})},logs:{...(base.logs||{}),...(x.logs||{})}};
    out.history=out.history&&typeof out.history==='object'?out.history:{};
    for(const k of ['workouts','nutrition','body','activity','sleep','signals','weight','context','measurements'])out.history[k]=Array.isArray(out.history[k])?out.history[k]:[];
    out.meta=out.meta&&typeof out.meta==='object'?out.meta:{};
    return out;
  }
  function localState(){try{return safeState(JSON.parse(localStorage.getItem('arcState')||'null'))}catch(e){return safeState(null)}}
  function writeLocal(state){
    suppress=true;
    try{S=safeState(state);localStorage.setItem('arcState',JSON.stringify(S));}
    finally{suppress=false}
  }

  function shield(){
    if(document.querySelector('.arc-auth-shield'))return;
    const el=document.createElement('div');el.className='arc-auth-shield';
    el.innerHTML='<div class="arc-auth-backdrop"></div><div class="arc-auth-card"><img class="arc-auth-lockup" src="assets/arc-lockup-horizontal-transparent.svg" alt="Arc — Progress Has a Shape"><span class="arc-auth-kicker">YOUR BODY. YOUR DATA. YOUR ARC.</span><h1>Opening your Arc…</h1><p>Checking your secure session without blocking the app itself.</p><div class="arc-auth-message show">Secure sign-in is initializing.</div></div>';
    document.body.appendChild(el);
  }
  function removeShield(){document.querySelector('.arc-auth-shield')?.remove()}
  function authMarkup(mode='signin',message=''){
    const create=mode==='signup';
    return `<div class="arc-auth-card"><img class="arc-auth-lockup" src="assets/arc-lockup-horizontal-transparent.svg" alt="Arc — Progress Has a Shape"><span class="arc-auth-kicker">YOUR BODY. YOUR DATA. YOUR ARC.</span><h1>${create?'Create your Arc.':'Welcome back.'}</h1><p>${create?'Your progress will follow you securely across devices.':'Sign in to continue your private progress story.'}</p><div class="arc-auth-tabs"><button data-auth-mode="signin" class="${!create?'active':''}">Sign in</button><button data-auth-mode="signup" class="${create?'active':''}">Create account</button></div>${create?'<label>First name<input id="arc-auth-name" autocomplete="given-name" placeholder="First name"></label>':''}<label>Email<input id="arc-auth-email" type="email" autocomplete="email" placeholder="you@example.com"></label><label>Password<input id="arc-auth-password" type="password" autocomplete="current-password" placeholder="At least 6 characters"></label><button class="arc-auth-submit" data-auth-submit="${mode}">${create?'Create My Arc →':'Sign In →'}</button><div class="arc-auth-message ${message?'show':''}" data-auth-message>${message}</div><div class="arc-auth-private"><i>◆</i><span><b>Private by design.</b><small>Your health data is protected by your account and can only be read by you.</small></span></div></div>`;
  }
  function showAuth(mode='signin',message=''){
    removeShield();let gate=document.querySelector('.arc-auth-gate');
    if(!gate){gate=document.createElement('div');gate.className='arc-auth-gate';document.body.appendChild(gate)}
    gate.innerHTML=`<div class="arc-auth-backdrop"></div>${authMarkup(mode,message)}`;dispatch('arc:auth-rendered',{mode});
  }
  function hideAuth(){removeShield();document.querySelector('.arc-auth-gate')?.remove()}
  function setMessage(msg,error=false){const el=document.querySelector('[data-auth-message]');if(!el)return;el.textContent=msg;el.classList.add('show');el.classList.toggle('error',error)}
  function cloudBadge(status='saved'){
    document.querySelectorAll('.arc-cloud-pill').forEach(el=>{const label=status==='syncing'?'Syncing…':status==='error'?'Sync issue':isLab?'LAB · Local only':'Saved to Arc';el.dataset.status=status;const t=el.querySelector('[data-cloud-label]');if(t)t.textContent=label;});
  }
  function installAccountChrome(){
    if(document.querySelector('.arc-cloud-account')||!user)return;
    const wrap=document.createElement('div');wrap.className='arc-cloud-account';wrap.innerHTML=`<button class="arc-cloud-pill" data-cloud-menu><i></i><span><b data-cloud-label>${isLab?'LAB · Local only':'Saved to Arc'}</b><small>${user.email||''}</small></span><em>⌄</em></button><div class="arc-cloud-menu"><button data-cloud-sync>Sync now</button><button data-cloud-signout>Sign out</button></div>`;document.body.appendChild(wrap);dispatch('arc:auth-rendered',{mode:'account'});
  }

  async function syncProfile(state){
    if(!user||isLab)return;
    const p=state.profile||{};
    const {error}=await client.from('profiles').upsert({user_id:user.id,display_name:p.name||null,primary_goal:p.primary||null,goals:Array.isArray(p.goals)?p.goals:[],why:p.why||null,preferences:{life:p.life||null,sleep:p.sleep||null,location:p.location||null,experience:p.experience||null,days:p.days||null,duration:p.duration||null,nutrition:p.nutrition||null,activities:p.activities||p.preferences?.activities||[],equipment:p.equipment||p.preferences?.equipment||[]},onboarding_completed:!['welcome','onboard','baseline'].includes(state.screen)},{onConflict:'user_id'});
    if(error)throw error;
  }
  async function syncSnapshot(force=false){
    if(!ready||!user||suppress||syncing||isLab||!client)return;
    syncing=true;cloudBadge('syncing');
    try{
      const state=localState();state.meta=state.meta||{};state.meta.cloudUserId=user.id;state.meta.cloudBuild=BUILD;
      const now=new Date().toISOString();
      const {error}=await client.from('user_state').upsert({user_id:user.id,state,client_version:BUILD,device_updated_at:now},{onConflict:'user_id'});
      if(error)throw error;await syncProfile(state);lastSync=now;cloudBadge('saved');
    }catch(e){console.error('Arc Cloud sync failed',e);cloudBadge('error')}
    finally{syncing=false}
  }
  function scheduleSync(delay=1000){if(!ready||!user||isLab)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncSnapshot(),delay)}

  async function hydrateFromCloud(){
    if(!user||isLab||!client)return;
    cloudBadge('syncing');
    const {data,error}=await client.from('user_state').select('state,updated_at,client_version').eq('user_id',user.id).maybeSingle();
    if(error){console.error('Arc Cloud load failed',error);cloudBadge('error');return}
    if(data?.state&&Object.keys(data.state).length){writeLocal(data.state);lastSync=data.updated_at;try{ArcData?.evaluateSignals?.()}catch(e){}}
  }

  async function activateSession(session,reason='session'){
    if(!session?.user)return;
    if(activation)return activation;
    if(ready&&user?.id===session.user.id){hideAuth();installAccountChrome();return}
    activation=(async()=>{
      user=session.user;hideAuth();installAccountChrome();
      try{await hydrateFromCloud()}catch(e){console.error('Arc hydrate failed',e)}
      ready=true;cloudBadge('saved');
      try{if(typeof render==='function')render()}catch(e){console.error('Arc post-auth render failed',e)}
      dispatch('arc:cloud-ready',{userId:user.id,reason});
    })();
    try{await activation}finally{activation=null}
  }
  function deactivate(){user=null;ready=false;document.querySelector('.arc-cloud-account')?.remove();showAuth('signin','Signed out safely.');dispatch('arc:cloud-signed-out')}

  function loadScript(src,timeout=5000){
    return new Promise((resolve,reject)=>{const s=document.createElement('script');let done=false;const t=setTimeout(()=>{if(done)return;done=true;s.remove();reject(new Error('timeout'))},timeout);s.src=src;s.async=true;s.onload=()=>{if(done)return;done=true;clearTimeout(t);resolve()};s.onerror=()=>{if(done)return;done=true;clearTimeout(t);reject(new Error('network error'))};document.head.appendChild(s)});
  }
  async function ensureLibrary(){
    if(window.supabase?.createClient)return;
    const urls=['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2','https://unpkg.com/@supabase/supabase-js@2'];
    let last;
    for(const url of urls){try{await loadScript(url,5000);if(window.supabase?.createClient)return}catch(e){last=e}}
    throw last||new Error('Supabase client unavailable');
  }
  function bindAuth(){
    if(authSubscription||!client)return;
    const {data}=client.auth.onAuthStateChange((event,session)=>{
      dispatch('arc:auth-event',{event,session});
      if(event==='SIGNED_OUT'){setTimeout(deactivate,0);return}
      if(session?.user&&(event==='SIGNED_IN'||event==='INITIAL_SESSION'))setTimeout(()=>activateSession(session,event).catch(e=>console.error('Arc session activation',e)),0);
      if(session?.user&&event==='TOKEN_REFRESHED')user=session.user;
    });
    authSubscription=data?.subscription||null;
  }
  async function init(){
    shield();
    try{
      await ensureLibrary();
      client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      bindAuth();dispatch('arc:cloud-client-ready');
      const {data,error}=await client.auth.getSession();
      if(error)throw error;
      if(data?.session?.user)await activateSession(data.session,'getSession');else showAuth('signin');
    }catch(e){console.error('Arc secure sign-in failed to initialize',e);showAuth('signin','Secure sign-in could not initialize. Check your connection and tap Retry.');const btn=document.querySelector('[data-auth-submit]');if(btn){btn.disabled=true}const card=document.querySelector('.arc-auth-card');if(card&&!card.querySelector('[data-auth-retry]')){const r=document.createElement('button');r.type='button';r.className='arc-forgot-password';r.setAttribute('data-auth-retry','');r.textContent='Retry secure sign-in';card.appendChild(r)}}
  }

  async function signIn(){
    if(!client){setMessage('Secure sign-in is still initializing.',true);return}
    const email=document.querySelector('#arc-auth-email')?.value.trim(),password=document.querySelector('#arc-auth-password')?.value||'';
    if(!email||!password){setMessage('Enter your email and password.',true);return}
    const btn=document.querySelector('[data-auth-submit]');if(btn){btn.disabled=true;btn.textContent='Signing in…'}
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error){if(btn){btn.disabled=false;btn.textContent='Sign In →'}setMessage(error.message,true);return}
    if(data?.session)await activateSession(data.session,'signin');
  }
  async function signUp(){
    if(!client){setMessage('Secure sign-in is still initializing.',true);return}
    const name=document.querySelector('#arc-auth-name')?.value.trim(),email=document.querySelector('#arc-auth-email')?.value.trim(),password=document.querySelector('#arc-auth-password')?.value||'';
    if(!name||!email||password.length<6){setMessage('Add your first name, a valid email, and a password of at least 6 characters.',true);return}
    const btn=document.querySelector('[data-auth-submit]');if(btn){btn.disabled=true;btn.textContent='Creating your Arc…'}
    const {data,error}=await client.auth.signUp({email,password,options:{data:{name},emailRedirectTo:APP_BASE.href}});
    if(error){if(btn){btn.disabled=false;btn.textContent='Create My Arc →'}setMessage(error.message,true);return}
    if(data?.session)await activateSession(data.session,'signup');else showAuth('signin','Account created. Check your email to confirm it, then return here and sign in.');
  }
  async function signOut(){try{await syncSnapshot(true)}catch(e){}if(client)await client.auth.signOut();deactivate()}

  document.addEventListener('click',e=>{
    const mode=e.target.closest('[data-auth-mode]');if(mode){showAuth(mode.dataset.authMode);return}
    const submit=e.target.closest('[data-auth-submit]');if(submit){submit.dataset.authSubmit==='signup'?signUp():signIn();return}
    if(e.target.closest('[data-cloud-menu]')){document.querySelector('.arc-cloud-menu')?.classList.toggle('open');return}
    if(e.target.closest('[data-cloud-sync]')){document.querySelector('.arc-cloud-menu')?.classList.remove('open');syncSnapshot(true);return}
    if(e.target.closest('[data-cloud-signout]')){signOut();return}
    if(e.target.closest('[data-auth-retry]')){document.querySelector('.arc-auth-gate')?.remove();init();return}
    scheduleSync();
  });
  document.addEventListener('input',()=>scheduleSync(1400));
  document.addEventListener('change',()=>scheduleSync(700));
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&document.querySelector('.arc-auth-gate'))document.querySelector('[data-auth-submit]:not([disabled])')?.click()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)scheduleSync(0)});
  window.addEventListener('pagehide',()=>{if(ready&&!syncing)syncSnapshot(true)});
  window.addEventListener('arc:rendered',()=>{installAccountChrome();scheduleSync(1200)});

  window.ArcCloud={get client(){return client},get user(){return user},get ready(){return ready},get lastSync(){return lastSync},sync:()=>syncSnapshot(true),signOut};
  init();
})();