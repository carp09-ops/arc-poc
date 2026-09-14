import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm';

const SUPABASE_URL='https://svxbzkjxihcwsbyheyxd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_zm65KCzkWFvVmlnv9dpWFg_15L0nUfc';
const BUILD='ready15';
const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});

const $=id=>document.getElementById(id);
const baseUrl=`${window.location.origin}${window.location.pathname}`;

function friendlyAuthError(error,fallback='Arc could not complete that request.'){
  const raw=String(error?.message||error||'').toLowerCase();
  if(raw.includes('rate limit')||raw.includes('too many')) return 'Too many email requests. Give Arc a minute, then try again.';
  if(raw.includes('user already registered')) return 'That email already has an Arc account. Sign in instead.';
  if(raw.includes('email not confirmed')) return 'Check your email and confirm your Arc account first.';
  if(raw.includes('password')&&raw.includes('least')) return 'Use a stronger password with at least 8 characters.';
  if(raw.includes('failed to fetch')||raw.includes('network')||raw.includes('load failed')) return 'Arc cannot reach the server right now. Check your connection and try again.';
  return error?.message||fallback;
}

function setBusy(button,busy,text='Working…'){
  if(!button)return;
  if(busy){
    if(!button.dataset.arcOriginal)button.dataset.arcOriginal=button.innerHTML;
    button.disabled=true;
    button.setAttribute('aria-busy','true');
    button.textContent=text;
  }else{
    button.disabled=false;
    button.removeAttribute('aria-busy');
    if(button.dataset.arcOriginal){button.innerHTML=button.dataset.arcOriginal;delete button.dataset.arcOriginal;}
  }
}

function authMode(mode){
  const login=$('loginForm');
  const signup=$('arcSignupForm');
  const forgot=$('arcForgotForm');
  const reset=$('arcResetForm');
  [login,signup,forgot,reset].forEach(el=>el?.classList.add('hidden'));
  ({login,signup,forgot,reset}[mode])?.classList.remove('hidden');
  $('arcAuthActions')?.classList.toggle('hidden',mode!=='login');
}

function ensureAuthMarkup(){
  const card=document.querySelector('#authGate .auth-card');
  const login=$('loginForm');
  if(!card||!login)return false;

  if(!$('arcAuthActions')){
    const actions=document.createElement('div');
    actions.id='arcAuthActions';
    actions.className='arc-auth-actions';
    actions.innerHTML='<button type="button" id="arcShowSignup" class="text-button">Create account</button><span>·</span><button type="button" id="arcShowForgot" class="text-button">Forgot password?</button>';
    login.insertAdjacentElement('afterend',actions);
  }

  if(!$('arcSignupForm')){
    const signup=document.createElement('form');
    signup.id='arcSignupForm';
    signup.className='stack-form hidden arc-auth-secondary';
    signup.innerHTML='<div class="arc-auth-heading"><span class="eyebrow">New to Arc</span><h3>Create your account.</h3><p>Your starting point comes next.</p></div><label>Email<input id="arcSignupEmail" type="email" autocomplete="email" required /></label><label>Password<input id="arcSignupPassword" type="password" autocomplete="new-password" minlength="8" required /></label><label>Confirm password<input id="arcSignupConfirm" type="password" autocomplete="new-password" minlength="8" required /></label><button class="button button-primary" type="submit">Create my Arc <span>→</span></button><p id="arcSignupMessage" class="form-message" role="status"></p><button type="button" class="text-button" data-auth-back>← Back to sign in</button>';
    $('arcAuthActions').insertAdjacentElement('afterend',signup);
  }

  if(!$('arcForgotForm')){
    const forgot=document.createElement('form');
    forgot.id='arcForgotForm';
    forgot.className='stack-form hidden arc-auth-secondary';
    forgot.innerHTML='<div class="arc-auth-heading"><span class="eyebrow">Account recovery</span><h3>Reset your password.</h3><p>We’ll send a secure recovery link.</p></div><label>Email<input id="arcForgotEmail" type="email" autocomplete="email" required /></label><button class="button button-primary" type="submit">Send reset link <span>→</span></button><p id="arcForgotMessage" class="form-message" role="status"></p><button type="button" class="text-button" data-auth-back>← Back to sign in</button>';
    $('arcSignupForm').insertAdjacentElement('afterend',forgot);
  }

  if(!$('arcResetForm')){
    const reset=document.createElement('form');
    reset.id='arcResetForm';
    reset.className='stack-form hidden arc-auth-secondary';
    reset.innerHTML='<div class="arc-auth-heading"><span class="eyebrow">Secure recovery</span><h3>Choose a new password.</h3><p>Use at least 8 characters.</p></div><label>New password<input id="arcResetPassword" type="password" autocomplete="new-password" minlength="8" required /></label><label>Confirm password<input id="arcResetConfirm" type="password" autocomplete="new-password" minlength="8" required /></label><button class="button button-primary" type="submit">Update password <span>→</span></button><p id="arcResetMessage" class="form-message" role="status"></p>';
    $('arcForgotForm').insertAdjacentElement('afterend',reset);
  }
  return true;
}

function bindAuth(){
  if(!ensureAuthMarkup())return;
  const card=document.querySelector('#authGate .auth-card');
  if(card.dataset.arcEntryBound==='1')return;
  card.dataset.arcEntryBound='1';

  $('arcShowSignup')?.addEventListener('click',()=>authMode('signup'));
  $('arcShowForgot')?.addEventListener('click',()=>{
    if($('loginEmail')?.value)$('arcForgotEmail').value=$('loginEmail').value;
    authMode('forgot');
  });
  card.querySelectorAll('[data-auth-back]').forEach(btn=>btn.addEventListener('click',()=>authMode('login')));

  $('arcSignupForm')?.addEventListener('submit',async event=>{
    event.preventDefault();
    const form=event.currentTarget;
    const message=$('arcSignupMessage');
    const button=form.querySelector('button[type="submit"]');
    const email=$('arcSignupEmail').value.trim();
    const password=$('arcSignupPassword').value;
    const confirm=$('arcSignupConfirm').value;
    if(password!==confirm){message.textContent='Those passwords do not match.';return;}
    setBusy(button,true,'Creating…');message.textContent='';
    try{
      const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:`${baseUrl}?auth=confirmed&v=${BUILD}`}});
      if(error)throw error;
      if(data.session){message.textContent='Account created. Opening your Arc…';setTimeout(()=>window.location.replace(`${baseUrl}?v=${BUILD}`),500);}
      else message.textContent='Check your email to confirm your account, then Arc will bring you back here.';
    }catch(error){message.textContent=friendlyAuthError(error,'Could not create your account.');}
    finally{setBusy(button,false);}
  });

  $('arcForgotForm')?.addEventListener('submit',async event=>{
    event.preventDefault();
    const form=event.currentTarget;
    const message=$('arcForgotMessage');
    const button=form.querySelector('button[type="submit"]');
    setBusy(button,true,'Sending…');message.textContent='';
    try{
      const {error}=await supabase.auth.resetPasswordForEmail($('arcForgotEmail').value.trim(),{redirectTo:`${baseUrl}?recovery=1&v=${BUILD}`});
      if(error)throw error;
      message.textContent='Reset link sent. Check your email.';
    }catch(error){message.textContent=friendlyAuthError(error,'Could not send the reset link.');}
    finally{setBusy(button,false);}
  });

  $('arcResetForm')?.addEventListener('submit',async event=>{
    event.preventDefault();
    const form=event.currentTarget;
    const message=$('arcResetMessage');
    const button=form.querySelector('button[type="submit"]');
    const password=$('arcResetPassword').value;
    const confirm=$('arcResetConfirm').value;
    if(password!==confirm){message.textContent='Those passwords do not match.';return;}
    setBusy(button,true,'Updating…');message.textContent='';
    try{
      const {error}=await supabase.auth.updateUser({password});
      if(error)throw error;
      message.textContent='Password updated. Opening your Arc…';
      setTimeout(()=>window.location.replace(`${baseUrl}?v=${BUILD}`),650);
    }catch(error){message.textContent=friendlyAuthError(error,'Could not update your password.');setBusy(button,false);}
  });

  if(new URLSearchParams(location.search).get('recovery')==='1')authMode('reset');
}

supabase.auth.onAuthStateChange(event=>{
  if(event==='PASSWORD_RECOVERY'){bindAuth();authMode('reset');}
});

bindAuth();
window.addEventListener('pageshow',()=>bindAuth());
