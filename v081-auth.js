// ARC 0.8.1 — non-blocking auth bootstrap
(function(){
  const SOURCES=[
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://unpkg.com/@supabase/supabase-js@2'
  ];
  const TIMEOUT=4500;
  let trying=false;

  function gate(){
    let el=document.getElementById('arc-auth-bootstrap');
    if(el)return el;
    el=document.createElement('div');
    el.id='arc-auth-bootstrap';
    el.style.cssText='position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;background:radial-gradient(circle at 50% 38%,#15110d 0,#090b0c 36%,#050607 72%);color:#efe3d1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:24px;text-align:center';
    el.innerHTML='<div style="max-width:340px"><div style="width:58px;height:58px;margin:0 auto 18px;border:1px solid rgba(221,177,108,.35);border-radius:50%;display:grid;place-items:center;color:#ddb16c;font:29px Georgia,serif">A</div><h2 style="font:28px Georgia,serif;margin:0 0 10px">Connecting securely…</h2><p style="color:#8f9391;line-height:1.5;font-size:13px">ARC is restoring your private session.</p></div>';
    document.body.appendChild(el);
    return el;
  }

  function failGate(){
    const el=gate();
    el.innerHTML='<div style="max-width:340px"><div style="width:58px;height:58px;margin:0 auto 18px;border:1px solid rgba(221,177,108,.35);border-radius:50%;display:grid;place-items:center;color:#ddb16c;font:29px Georgia,serif">A</div><h2 style="font:28px Georgia,serif;margin:0 0 10px">Secure connection unavailable.</h2><p style="color:#8f9391;line-height:1.5;font-size:13px">ARC loaded successfully, but sign-in could not connect. Your data has not been changed.</p><button type="button" data-arc-auth-retry style="margin-top:14px;border:0;background:#d6a65f;color:#15110d;border-radius:14px;padding:12px 18px;font-weight:700">Retry connection</button></div>';
  }

  function removeGate(){document.getElementById('arc-auth-bootstrap')?.remove()}

  function loadScript(src,timeout=TIMEOUT){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      let done=false;
      const finish=(ok)=>{if(done)return;done=true;clearTimeout(t);ok?resolve():reject(new Error('Failed '+src));};
      s.src=src;s.async=true;
      s.onload=()=>finish(true);
      s.onerror=()=>finish(false);
      const t=setTimeout(()=>{s.remove();finish(false)},timeout);
      document.head.appendChild(s);
    });
  }

  async function ensureSupabase(){
    if(window.supabase?.createClient)return true;
    for(const src of SOURCES){
      try{await loadScript(src);if(window.supabase?.createClient)return true}catch(e){console.warn('ARC auth source failed',src,e)}
    }
    return false;
  }

  async function start(){
    if(trying)return;
    trying=true;gate();
    try{
      if(!await ensureSupabase()){failGate();return;}
      await loadScript('v061.js?v=081',6000);
      await loadScript('v073.js?v=081',6000);
      const started=Date.now();
      const timer=setInterval(()=>{
        if(window.ArcCloud?.user||document.querySelector('.arc-auth-gate')){
          clearInterval(timer);removeGate();return;
        }
        if(Date.now()-started>8000){clearInterval(timer);failGate();}
      },100);
    }catch(e){console.error('ARC auth bootstrap failed',e);failGate();}
    finally{trying=false;}
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-arc-auth-retry]')){removeGate();start();}
  });

  window.ArcAuthBootstrap={retry:start};
  start();
})();