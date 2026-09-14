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
    .arc-startup-loading{position:fixed;z-index:6000;inset:0;display:grid;place-items:center;background:#173732;overflow:hidden;opacity:1;transition:opacity .32s ease;}
    .arc-startup-loading.leaving{opacity:0;pointer-events:none;}
    .arc-startup-loading:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(16,42,37,.25),rgba(16,42,37,.88)),url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=82') center/cover;transform:scale(1.025);}
    .arc-startup-content{position:relative;z-index:1;text-align:center;color:#fff;padding:28px;max-width:430px;font-family:Inter,system-ui,sans-serif;}
    .arc-startup-mark{width:78px;height:78px;margin:0 auto 20px;border-radius:50%;border:1px solid rgba(246,207,138,.28);position:relative;box-shadow:0 0 34px rgba(230,166,75,.12);}
    .arc-startup-mark:before{content:"";position:absolute;inset:6px;border-radius:50%;border:3px solid transparent;border-top-color:#e2b66f;border-right-color:#e2b66f;animation:arcStartupSpin 1.25s cubic-bezier(.55,.1,.45,.9) infinite;}
    .arc-startup-content span{display:block;font-size:.68rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#f1d6a2;margin-bottom:9px;}
    .arc-startup-content strong{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-size:2.1rem;font-weight:600;line-height:1;}
    .arc-startup-content p{margin:10px 0 0;color:rgba(255,255,255,.74);font-size:.84rem;line-height:1.5;}
    @keyframes arcStartupSpin{to{transform:rotate(360deg)}}
    @media(prefers-reduced-motion:reduce){.arc-startup-mark:before{animation:none}.arc-startup-loading{transition:none}}
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
  overlay.innerHTML = `<div class="arc-startup-content"><div class="arc-startup-mark" aria-hidden="true"></div><span>Returning to your Arc</span><strong>Loading your pattern.</strong><p>Your latest training, body, and progress data are syncing.</p></div>`;
  document.body.appendChild(overlay);

  const finish = () => {
    if (!overlay.isConnected) return;
    overlay.classList.add('leaving');
    setTimeout(() => overlay.remove(), 360);
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
