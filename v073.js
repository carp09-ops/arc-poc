// Arc 0.7.3 — Password recovery + auth resilience
(function(){
  const REDIRECT='https://arc-poc.netlify.app/';
  let recoveryOpen=false;
  const cloud=()=>window.ArcCloud;
  const client=()=>cloud()?.client;

  function authMessage(msg,error=false){
    const el=document.querySelector('[data-auth-message]');
    if(!el)return;
    el.textContent=msg;
    el.classList.add('show');
    el.classList.toggle('error',!!error);
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
    if(!c){authMessage('Arc sign-in is still loading. Try again.',true);return;}
    const email=document.querySelector('#arc-auth-email')?.value.trim();
    if(!email){authMessage('Enter your email above, then tap Forgot password.',true);document.querySelector('#arc-auth-email')?.focus();return;}
    const btn=document.querySelector('[data-arc-forgot-password]');
    if(btn){btn.disabled=true;btn.textContent='Sending reset email…';}
    const {error}=await c.auth.resetPasswordForEmail(email,{redirectTo:REDIRECT});
    if(btn){btn.disabled=false;btn.textContent='Forgot password?';}
    if(error){authMessage(error.message||'Could not send the reset email. Please try again.',true);return;}
    authMessage('Password reset email sent. Open the email, tap the reset link, then choose a new ARC password here.');
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
      <p>This updates the password for your ARC account without changing your saved progress.</p>
      <label>New password<input id="arc-reset-password" type="password" autocomplete="new-password" placeholder="At least 6 characters"></label>
      <label>Confirm password<input id="arc-reset-confirm" type="password" autocomplete="new-password" placeholder="Enter it again"></label>
      <button class="arc-auth-submit" data-arc-save-password>Update Password →</button>
      <div class="arc-auth-message" data-arc-reset-message></div>
    </div>`;
    document.body.appendChild(gate);
    setTimeout(()=>document.querySelector('#arc-reset-password')?.focus(),50);
  }

  function resetMessage(msg,error=false){
    const el=document.querySelector('[data-arc-reset-message]');if(!el)return;
    el.textContent=msg;el.classList.add('show');el.classList.toggle('error',!!error);
  }

  async function savePassword(){
    const c=client();
    if(!c){resetMessage('Arc sign-in is still loading. Try again.',true);return;}
    const p=document.querySelector('#arc-reset-password')?.value||'';
    const confirm=document.querySelector('#arc-reset-confirm')?.value||'';
    if(p.length<6){resetMessage('Use a password with at least 6 characters.',true);return;}
    if(p!==confirm){resetMessage('Those passwords do not match.',true);return;}
    const btn=document.querySelector('[data-arc-save-password]');if(btn){btn.disabled=true;btn.textContent='Updating…';}
    const {error}=await c.auth.updateUser({password:p});
    if(error){if(btn){btn.disabled=false;btn.textContent='Update Password →';}resetMessage(error.message||'Could not update the password.',true);return;}
    resetMessage('Password updated. Signing you back into ARC…');
    setTimeout(()=>{history.replaceState({},'',location.pathname);location.href=REDIRECT;},650);
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-arc-forgot-password]')){e.preventDefault();sendReset();}
    if(e.target.closest('[data-arc-save-password]')){e.preventDefault();savePassword();}
  });

  const mo=new MutationObserver(decorateAuth);mo.observe(document.body,{childList:true,subtree:true});
  decorateAuth();

  async function boot(){
    for(let i=0;i<40&&!client();i++)await new Promise(r=>setTimeout(r,150));
    const c=client();if(!c)return;
    c.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')showRecovery();});
    const hash=location.hash||'';
    if(hash.includes('type=recovery'))setTimeout(showRecovery,150);
  }
  boot();
})();