const PROJECT_REF = 'svxbzkjxihcwsbyheyxd';
const cachedSessionKey = `sb-${PROJECT_REF}-auth-token`;

function hasCachedSession() {
  try { return !!localStorage.getItem(cachedSessionKey); } catch (_) { return false; }
}

function installStartupStyle() {
  if (document.getElementById('arcStartupStyle')) return;
  const style = document.createElement('style');
  style.id = 'arcStartupStyle';
  style.textContent = `
    .arc-startup-loading{position:fixed;z-index:6000;inset:0;display:grid;place-items:center;background:#0B1A2B;overflow:hidden;opacity:1;transition:opacity .34s ease;}
    .arc-startup-loading.leaving{opacity:0;pointer-events:none;}
    .arc-startup-loading:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,17,29,.28) 0%,rgba(11,26,43,.72) 55%,rgba(7,16,27,.96) 100%),url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=82') center/cover;transform:scale(1.025);filter:saturate(.72) contrast(1.04);}
    .arc-startup-loading:after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 62%,rgba(239,208,142,.13),transparent 36%),linear-gradient(90deg,rgba(11,26,43,.22),transparent 30%,transparent 70%,rgba(11,26,43,.22));pointer-events:none;}
    .arc-startup-content{position:relative;z-index:1;text-align:center;color:#F8F2E7;padding:30px;width:min(440px,88vw);font-family:Inter,system-ui,sans-serif;}
    .arc-startup-brand{display:block;margin-bottom:30px;font-family:'Cormorant Garamond',Georgia,serif;font-size:.92rem;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:#EFD08E;}
    .arc-startup-horizon{position:relative;width:min(290px,72vw);height:52px;margin:0 auto 25px;display:flex;align-items:flex-end;}
    .arc-startup-horizon:before{content:"";position:absolute;left:0;right:0;bottom:14px;height:1px;background:rgba(231,225,211,.20);}
    .arc-startup-horizon-line{position:absolute;left:0;bottom:13px;width:66%;height:3px;border-radius:999px;background:linear-gradient(90deg,rgba(239,208,142,.36),#EFD08E 58%,#F5DDA8);box-shadow:0 0 12px rgba(239,208,142,.34),0 0 30px rgba(239,208,142,.13);transform-origin:left center;animation:arcStartupHorizon 1.9s cubic-bezier(.45,0,.2,1) infinite alternate;}
    .arc-startup-horizon-line:after{content:"";position:absolute;right:-4px;top:50%;width:9px;height:9px;border-radius:50%;background:#FFF2C9;transform:translateY(-50%);box-shadow:0 0 9px #F5DDA8,0 0 24px rgba(239,208,142,.78),0 0 46px rgba(239,208,142,.30);animation:arcStartupGlow 1.6s ease-in-out infinite alternate;}
    .arc-startup-content span.arc-startup-kicker{display:block;font-size:.66rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#EFD08E;margin-bottom:9px;}
    .arc-startup-content strong{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-size:2.25rem;font-weight:600;line-height:1;color:#F8F2E7;}
    .arc-startup-content p{margin:11px auto 0;color:rgba(231,225,211,.72);font-size:.84rem;line-height:1.5;max-width:350px;}
    @keyframes arcStartupHorizon{0%{transform:scaleX(.42);opacity:.78}100%{transform:scaleX(1);opacity:1}}
    @keyframes arcStartupGlow{from{transform:translateY(-50%) scale(.82);opacity:.78}to{transform:translateY(-50%) scale(1.12);opacity:1}}
    @media(prefers-reduced-motion:reduce){.arc-startup-horizon-line,.arc-startup-horizon-line:after{animation:none}.arc-startup-loading{transition:none}}
  `;
  document.head.appendChild(style);
}

function showStartup() {
  if (!hasCachedSession() || document.getElementById('arcStartupLoading')) return;
  installStartupStyle();
  const overlay = document.createElement('div');
  overlay.id = 'arcStartupLoading';
  overlay.className = 'arc-startup-loading';
  overlay.setAttribute('aria-live','polite');
  overlay.innerHTML = `<div class="arc-startup-content"><span class="arc-startup-brand">ARC</span><div class="arc-startup-horizon" aria-hidden="true"><i class="arc-startup-horizon-line"></i></div><span class="arc-startup-kicker">Returning to your Arc</span><strong>Loading your pattern.</strong><p>Your latest training, body, and progress data are syncing.</p></div>`;
  document.body.appendChild(overlay);

  const finish = () => {
    if (!overlay.isConnected) return;
    overlay.classList.add('leaving');
    setTimeout(() => overlay.remove(), 380);
  };
  const ready = () => {
    const app = document.getElementById('app');
    const auth = document.getElementById('authGate');
    if (app && !app.classList.contains('hidden') && auth?.classList.contains('hidden')) {
      setTimeout(finish, 420);
      return true;
    }
    return false;
  };
  if (!ready()) {
    const observer = new MutationObserver(() => { if (ready()) observer.disconnect(); });
    observer.observe(document.body, { subtree:true, attributes:true, attributeFilter:['class'] });
    setTimeout(() => { observer.disconnect(); finish(); }, 6500);
  }
}

showStartup();
