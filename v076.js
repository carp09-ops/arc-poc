// ARC 0.7.7 — dedicated auth recovery handoff
(function(){
  const BUILD='0.7.7';
  const RECOVERY_KEY='arcRecoveryPending';
  let recoveryOpen=false;
  const cloud=()=>window.ArcCloud;
  const client=()=>cloud()?.client;
  const appUrl=()=>`${location.origin}/`;
  const resetUrl=()=>`${location.origin}/reset.html`;

  function authMessage(msg,error=false){
    const el=document.querySelector('[data-auth-message]');
    if(!el)return;
    el.textContent=msg;
    el.classList.add('show');
    el.classList.toggle('error',!!error);
  }

  function markRecovery(){
    try{localStorage.setItem(RECOVERY_KEY,String(Date.now()))}catch(e){}
  }
  function clearRecovery(){
    try{localStorage.removeItem(RECOVERY_KEY)}catch(e){}
  }
  function recentRecovery(){
    try{
      const at=Number(localStorage.getItem(RECOVERY_KEY)||0);
      return at>0&&Date.now()-at<45*60*1000;
    }catch(e){return false}
  }
  function urlSaysRecovery(){
    const hash=location.hash||'';
    const params=new URLSearchParams(location.search);
    return hash.includes('type=recovery')||params.get('arc_recovery')==='1';
  }

  function decorateAuth(){
    const card=document.querySelector('.arc-auth-card');
    if(!card||card.querySelector('[data-arc-forgot-password]'))return;
    const submit=card.querySelector('[data-auth-submit="signin"]');
    if(!submit)return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='arc-forgot-password';
    btn.setAttribute('data-arc-forgot-password','');
    btn.textContent='Forgot password?';
    submit.insertAdjacentElement('afterend',btn);
  }

  async function sendReset(){
    const c=client();
    if(!c){authMessage('ARC sign-in is still loading. Try again.',true);return;}
    const email=document.querySelector('#arc-auth-email')?.value.trim();
    if(!email){authMessage('Enter your email above, then tap Forgot password.',true);document.querySelector('#arc-auth-email')?.focus();return;}
    const btn=document.querySelector('[data-arc-forgot-password]');
    if(btn){btn.disabled=true;btn.textContent='Sending reset email…';}
    markRecovery();
    const {error}=await c.auth.resetPasswordForEmail(email,{redirectTo:resetUrl()});
    if(btn){btn.disabled=false;btn.textContent='Forgot password?';}
    if(error){clearRecovery();
      const raw=(error.message||'').toLowerCase();
      const friendly=raw.includes('rate limit')?'Too many reset emails have been requested. Wait a little while, then try once more.':(error.message||'Could not send the reset email. Please try again.');
      authMessage(friendly,true);return;
    }
    authMessage('Password reset email sent. Open the newest ARC email and tap the reset link. You’ll go straight to ARC’s password reset page.');
  }

  function showRecovery(){
    if(recoveryOpen)return;
    recoveryOpen=true;
    document.querySelector('.arc-reset-gate')?.remove();
    const gate=document.createElement('div');
    gate.className='arc-reset-gate';
    gate.innerHTML=`<div class="arc-reset-backdrop"></div><div class="arc-reset-card">
      <img src="assets/arc-lockup-horizontal-transparent.svg" alt="Arc — Progress Has a Shape">
      <span class="arc-auth-kicker">SECURE ACCOUNT RECOVERY</span>
      <h1>Choose a new password.</h1>
      <p>Your recovery link was accepted. Set the password you want to use for ARC going forward.</p>
      <label>New password<input id="arc-reset-password" type="password" autocomplete="new-password" placeholder="At least 6 characters"></label>
      <label>Confirm password<input id="arc-reset-confirm" type="password" autocomplete="new-password" placeholder="Enter it again"></label>
      <button class="arc-auth-submit" data-arc-save-password>Update Password →</button>
      <div class="arc-auth-message" data-arc-reset-message></div>
    </div>`;
    document.body.appendChild(gate);
    setTimeout(()=>document.querySelector('#arc-reset-password')?.focus(),60);
  }

  function resetMessage(msg,error=false){
    const el=document.querySelector('[data-arc-reset-message]');if(!el)return;
    el.textContent=msg;el.classList.add('show');el.classList.toggle('error',!!error);
  }

  async function savePassword(){
    const c=client();
    if(!c){resetMessage('ARC sign-in is still loading. Try again.',true);return;}
    const {data:{session}}=await c.auth.getSession();
    if(!session?.user){resetMessage('This recovery session is no longer active. Return to Sign in and request a new reset email.',true);return;}
    const p=document.querySelector('#arc-reset-password')?.value||'';
    const confirm=document.querySelector('#arc-reset-confirm')?.value||'';
    if(p.length<6){resetMessage('Use a password with at least 6 characters.',true);return;}
    if(p!==confirm){resetMessage('Those passwords do not match.',true);return;}
    const btn=document.querySelector('[data-arc-save-password]');if(btn){btn.disabled=true;btn.textContent='Updating…';}
    const {error}=await c.auth.updateUser({password:p});
    if(error){if(btn){btn.disabled=false;btn.textContent='Update Password →';}resetMessage(error.message||'Could not update the password.',true);return;}
    clearRecovery();
    resetMessage('Password updated. Opening your ARC…');
    setTimeout(()=>{history.replaceState({},'',location.pathname);location.replace(appUrl());},650);
  }

  async function recoverIfNeeded(force=false){
    const c=client();if(!c)return;
    const {data:{session}}=await c.auth.getSession();
    const shouldShow=force||urlSaysRecovery()||(recentRecovery()&&!!session?.user);
    if(shouldShow&&session?.user){showRecovery();return true}
    return false;
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-arc-forgot-password]')){e.preventDefault();sendReset();}
    if(e.target.closest('[data-arc-save-password]')){e.preventDefault();savePassword();}
  });

  const mo=new MutationObserver(()=>{decorateAuth();if(recoveryOpen&&!document.querySelector('.arc-reset-gate'))recoveryOpen=false;});
  mo.observe(document.body,{childList:true,subtree:true});
  decorateAuth();

  async function boot(){
    for(let i=0;i<50&&!client();i++)await new Promise(r=>setTimeout(r,120));
    const c=client();if(!c)return;
    c.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY'){markRecovery();setTimeout(()=>recoverIfNeeded(true),0);}
      if(event==='SIGNED_IN'&&recentRecovery()&&session?.user)setTimeout(()=>recoverIfNeeded(),0);
    });
    await recoverIfNeeded();
  }

  window.ArcRecovery={show:showRecovery,check:recoverIfNeeded,version:BUILD};
  boot();
})();
