// ARC QA Sprint 1 — durable local-first persistence guard.
// Captures state changes before legacy handlers can stop propagation and protects newer local data from stale cloud hydration.
(function(){
  if(typeof S==='undefined')return;
  const STATE_KEY='arcState';
  let lastRaw='';
  let shadow=null;
  let shadowStamp='';
  let syncTimer=null;
  let dirty=false;

  function parse(raw){try{const x=JSON.parse(raw||'null');return x&&typeof x==='object'?x:null}catch(e){return null}}
  function stampOf(x){return String(x?.meta?.localUpdatedAt||'')}
  function load(){
    const raw=localStorage.getItem(STATE_KEY)||'';
    lastRaw=raw;
    shadow=parse(raw);
    shadowStamp=stampOf(shadow);
  }
  function dispatch(){try{window.dispatchEvent(new CustomEvent('arc:state-dirty'))}catch(e){}}
  function queueCloud(delay=900){
    dirty=true;clearTimeout(syncTimer);
    syncTimer=setTimeout(()=>{
      if(!dirty)return;
      if(window.ArcCloud?.ready){dirty=false;try{window.ArcCloud.sync()}catch(e){dirty=true}}
    },delay);
  }
  function markIfChanged(){
    const raw=localStorage.getItem(STATE_KEY)||'';
    if(!raw||raw===lastRaw)return;
    const state=parse(raw);if(!state){lastRaw=raw;return}
    state.meta=state.meta&&typeof state.meta==='object'?state.meta:{};
    state.meta.localUpdatedAt=new Date().toISOString();
    const stamped=JSON.stringify(state);
    try{localStorage.setItem(STATE_KEY,stamped);S=state}catch(e){return}
    lastRaw=stamped;shadow=state;shadowStamp=state.meta.localUpdatedAt;dirty=true;dispatch();queueCloud();
  }
  function afterEvent(){setTimeout(markIfChanged,0)}

  // Register early so this still runs when later legacy capture handlers call stopImmediatePropagation().
  for(const type of ['click','input','change'])document.addEventListener(type,afterEvent,true);
  window.addEventListener('arc:state-dirty',()=>{markIfChanged();queueCloud()});

  // hydrateFromCloud currently replaces local state. If the device has a newer stamped copy,
  // restore it immediately after cloud activation and push it back to Arc Cloud.
  window.addEventListener('arc:cloud-ready',()=>{
    const current=parse(localStorage.getItem(STATE_KEY)||''),currentStamp=stampOf(current);
    if(shadow&&shadowStamp&&(!currentStamp||shadowStamp>currentStamp)){
      try{S=shadow;localStorage.setItem(STATE_KEY,JSON.stringify(shadow));lastRaw=JSON.stringify(shadow);if(typeof render==='function')render()}catch(e){}
      dirty=true;queueCloud(150);
    }else{
      shadow=current;shadowStamp=currentStamp;lastRaw=localStorage.getItem(STATE_KEY)||'';if(dirty)queueCloud(150);
    }
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){markIfChanged();queueCloud(0)}});
  window.addEventListener('pagehide',()=>{markIfChanged();if(window.ArcCloud?.ready)try{window.ArcCloud.sync()}catch(e){}});

  load();
  window.ArcPersistence={get dirty(){return dirty},get localUpdatedAt(){return shadowStamp},flush(){markIfChanged();queueCloud(0)},version:'1.0'};
})();