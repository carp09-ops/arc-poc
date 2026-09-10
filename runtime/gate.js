// ARC runtime stability gate — suppress historical load-time re-renders until bootstrap completes.
(function(){
  const baseRender=window.render;
  const baseShell=window.shell;
  let suppressed=0;

  function screen(){
    try{return typeof S!=='undefined'?S.screen:null}catch(e){return null}
  }
  function rendered(){
    try{window.dispatchEvent(new CustomEvent('arc:rendered',{detail:{screen:screen()}}))}catch(e){}
  }

  window.__ARC_BOOTSTRAPPING=true;
  window.__ARC_PENDING_RENDER=false;

  if(typeof baseShell==='function'){
    window.shell=function(){
      if(window.__ARC_BOOTSTRAPPING){window.__ARC_PENDING_RENDER=true;suppressed++;return;}
      return baseShell.apply(this,arguments);
    };
  }

  if(typeof baseRender==='function'){
    window.render=function(){
      if(window.__ARC_BOOTSTRAPPING){window.__ARC_PENDING_RENDER=true;suppressed++;return;}
      const out=baseRender.apply(this,arguments);
      rendered();
      return out;
    };
  }

  window.__arcFinishBootstrap=function(){
    window.__ARC_BOOTSTRAPPING=false;
    window.__ARC_PENDING_RENDER=false;
    if(typeof window.render!=='function')throw new Error('ARC render function unavailable');
    const out=window.render();
    try{window.dispatchEvent(new CustomEvent('arc:boot-complete',{detail:{screen:screen(),suppressed}}))}catch(e){}
    return out;
  };

  window.__arcRuntime={
    get bootstrapping(){return !!window.__ARC_BOOTSTRAPPING},
    get suppressedRenders(){return suppressed},
    rendered
  };
})();