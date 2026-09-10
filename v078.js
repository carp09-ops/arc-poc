// ARC 0.7.8 — iOS/Safari auth session resilience
(function(){
  const VERSION='0.7.8';
  let createClientWrapped=false;
  let reconciling=false;

  function installCreateClientGuard(){
    if(createClientWrapped)return true;
    const sb=window.supabase;
    if(!sb?.createClient)return false;

    const originalCreateClient=sb.createClient.bind(sb);
    sb.createClient=function(){
      const client=originalCreateClient.apply(sb,arguments);
      const auth=client?.auth;
      if(!auth||auth.__arcSafeAuthWrapped)return client;

      // Supabase currently documents a deadlock when async API work is performed
      // inside onAuthStateChange. Always hop callbacks outside the auth lock.
      if(typeof auth.onAuthStateChange==='function'){
        const originalOnAuthStateChange=auth.onAuthStateChange.bind(auth);
        auth.onAuthStateChange=function(callback){
          return originalOnAuthStateChange((event,session)=>{
            setTimeout(()=>{
              try{callback(event,session)}catch(err){console.error('ARC auth state handler failed',err)}
            },0);
          });
        };
      }

      // Never let older feature layers send confirmation/reset links back to a
      // retired host. The current production origin is always authoritative.
      if(typeof auth.signUp==='function'){
        const originalSignUp=auth.signUp.bind(auth);
        auth.signUp=function(credentials){
          const next={...(credentials||{})};
          next.options={...(next.options||{}),emailRedirectTo:`${location.origin}/`};
          return originalSignUp(next);
        };
      }
      if(typeof auth.resetPasswordForEmail==='function'){
        const originalReset=auth.resetPasswordForEmail.bind(auth);
        auth.resetPasswordForEmail=function(email,options){
          return originalReset(email,{...(options||{}),redirectTo:`${location.origin}/reset.html`});
        };
      }

      try{Object.defineProperty(auth,'__arcSafeAuthWrapped',{value:true})}catch(e){auth.__arcSafeAuthWrapped=true}
      return client;
    };
    createClientWrapped=true;
    return true;
  }

  if(!installCreateClientGuard()){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(installCreateClientGuard()||tries>100)clearInterval(timer);
    },20);
  }

  async function getCloudClient(){
    for(let i=0;i<80;i++){
      if(window.ArcCloud?.client)return window.ArcCloud.client;
      await new Promise(r=>setTimeout(r,75));
    }
    return null;
  }

  async function reconcileSession(reason='resume'){
    if(reconciling)return;
    const client=window.ArcCloud?.client||await getCloudClient();
    if(!client)return;
    reconciling=true;
    try{
      let {data,error}=await client.auth.getSession();
      if(error){console.warn(`ARC session check (${reason})`,error);return;}
      let session=data?.session||null;

      // iOS can suspend a web app long enough for the access token to age out.
      // Refresh proactively on wake when the token is close to expiry.
      if(session?.user){
        const expiresAt=(session.expires_at||0)*1000;
        if(expiresAt&&expiresAt<Date.now()+90000){
          const refreshed=await client.auth.refreshSession();
          if(!refreshed.error&&refreshed.data?.session)session=refreshed.data.session;
        }

        // If the backend session is valid but the legacy UI is showing the
        // sign-in gate, reload once so the normal boot path consumes it.
        if(document.querySelector('.arc-auth-gate')){
          const key='arcAuthResumeReloadAt';
          const last=Number(sessionStorage.getItem(key)||0);
          if(Date.now()-last>5000){
            sessionStorage.setItem(key,String(Date.now()));
            location.reload();
            return;
          }
        }
      }
    }catch(err){
      console.warn(`ARC session reconcile (${reason}) failed`,err);
    }finally{
      reconciling=false;
    }
  }

  function queueReconcile(reason,delay=120){
    setTimeout(()=>reconcileSession(reason),delay);
  }

  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)queueReconcile('visible',100);
  });
  window.addEventListener('pageshow',()=>queueReconcile('pageshow',80));
  window.addEventListener('focus',()=>queueReconcile('focus',150));

  window.ArcSessionResilience={version:VERSION,reconcile:reconcileSession};
})();
// Netlify deploy trigger — ARC 0.7.8
