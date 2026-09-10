// ARC 0.7.9 — non-blocking auth bootstrap with CDN fallback
(function(){
  const VERSION='0.7.9';
  const SOURCES=[
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.js',
    'https://unpkg.com/@supabase/supabase-js@2.116.0/dist/umd/supabase.js'
  ];
  const LOAD_TIMEOUT=4500;
  let sourceIndex=0, finished=false;

  function ensureCurtain(){
    if(document.getElementById('arc-auth-connect'))return;
    const style=document.createElement('style');
    style.id='arc-auth-connect-style';
    style.textContent=`#arc-auth-connect{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:radial-gradient(circle at 50% 38%,#15110d 0,#090b0c 36%,#050607 72%);color:#efe3d1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:24px;text-align:center}#arc-auth-connect .box{max-width:360px}#arc-auth-connect .mark{width:58px;height:58px;margin:0 auto 18px;border:1px solid rgba(221,177,108,.35);border-radius:50%;display:grid;place-items:center;color:#ddb16c;font:29px Georgia,serif}#arc-auth-connect h2{font:28px Georgia,serif;margin:0 0 10px}#arc-auth-connect p{color:#8f9391;line-height:1.5;font-size:13px}#arc-auth-connect button{margin-top:14px;border:1px solid rgba(221,177,108,.5);background:#d6a65f;color:#15110d;border-radius:14px;padding:12px 18px;font-weight:700}`;
    document.head.appendChild(style);
    const curtain=document.createElement('div');
    curtain.id='arc-auth-connect';
    curtain.innerHTML='<div class="box"><div class="mark">A</div><h2>Connecting securely…</h2><p>ARC is restoring your private session.</p></div>';
    document.body.appendChild(curtain);
  }

  function setCurtain(title,text,retry=false){
    ensureCurtain();
    const box=document.querySelector('#arc-auth-connect .box');
    if(!box)return;
    box.innerHTML=`<div class="mark">A</div><h2>${title}</h2><p>${text}</p>${retry?'<button type="button" data-arc-auth-retry>Retry connection</button>':''}`;
  }

  function clearCurtain(){document.getElementById('arc-auth-connect')?.remove()}

  function loadLocal(src){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=src;s.async=false;
      s.onload=()=>resolve();
      s.onerror=()=>reject(new Error(`Failed ${src}`));
      document.head.appendChild(s);
    });
  }

  async function startArcAuth(){
    try{
      await loadLocal(`v078.js?v=${VERSION}`);
      await loadLocal(`v061.js?v=${VERSION}`);
      finished=true;
      const settle=setInterval(()=>{
        if(window.ArcCloud?.user||document.querySelector('.arc-auth-gate')){
          clearInterval(settle);clearCurtain();
          setTimeout(()=>window.ArcRecovery?.check?.(),100);
        }
      },100);
      setTimeout(()=>{
        if(finished&&!window.ArcCloud)setCurtain('Sign-in did not initialize.','ARC loaded, but secure sign-in did not start. Retry the connection.',true);
      },7000);
    }catch(err){
      console.error('ARC auth bootstrap failed',err);
      setCurtain('Secure sign-in could not start.','ARC could not initialize its sign-in layer. Retry the connection.',true);
    }
  }

  function trySource(){
    ensureCurtain();
    if(window.supabase?.createClient){startArcAuth();return;}
    if(sourceIndex>=SOURCES.length){
      setCurtain('Secure connection unavailable.','ARC could not reach the authentication service. Your data has not been changed. Check your connection and retry.',true);
      return;
    }
    const src=SOURCES[sourceIndex++];
    const script=document.createElement('script');
    script.src=src;script.async=true;script.crossOrigin='anonymous';
    let settled=false;
    const fail=()=>{if(settled)return;settled=true;clearTimeout(timer);script.remove();trySource()};
    script.onload=()=>{
      if(settled)return;
      if(!window.supabase?.createClient){fail();return;}
      settled=true;clearTimeout(timer);startArcAuth();
    };
    script.onerror=fail;
    const timer=setTimeout(fail,LOAD_TIMEOUT);
    document.head.appendChild(script);
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-arc-auth-retry]')){
      sourceIndex=0;finished=false;
      setCurtain('Connecting securely…','ARC is restoring your private session.');
      trySource();
    }
  });

  window.ArcAuthBootstrap={version:VERSION,retry:()=>{sourceIndex=0;trySource()}};
  ensureCurtain();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',trySource,{once:true});
  else trySource();
})();