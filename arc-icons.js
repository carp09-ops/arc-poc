const SPRITE='./assets/arc-icons.svg?v=ready14';
const NAV_ICON={today:'today',train:'train',body:'body',arc:'arc',history:'history',connections:'connections'};

function svg(name,extra=''){
  if(!name)return '';
  return `<svg class="arc-icon ${extra}" data-arc-icon="${name}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="${SPRITE}#${name}"></use></svg>`;
}

function iconizeNav(root=document){
  root.querySelectorAll?.('.nav-item[data-view]').forEach(btn=>{
    const first=btn.querySelector(':scope > span:first-child');
    if(!first)return;
    const expected=NAV_ICON[btn.dataset.view];
    if(!expected)return;
    if(first.querySelector(`.arc-icon[data-arc-icon="${expected}"]`))return;
    first.innerHTML=svg(expected);
    first.dataset.arcIconized='1';
  });
}

function iconizeMetrics(root=document){
  root.querySelectorAll?.('.metric-card').forEach(card=>{
    const label=card.querySelector('.metric-label')?.textContent?.trim().toLowerCase();
    const icon=card.querySelector('.metric-icon');
    if(!icon)return;
    const name=label==='workouts'?'workout':label==='consistency'?'consistency':label==='body'?'scale':null;
    if(name&&!icon.querySelector(`.arc-icon[data-arc-icon="${name}"]`)){icon.innerHTML=svg(name);icon.dataset.arcIconized='1';}
  });
}

function iconizeWorkoutTiers(root=document){
  root.querySelectorAll?.('.workout-card .workout-tier').forEach(el=>{
    const card=el.closest('.workout-card');
    const name=card?.classList.contains('restore')?'restore':card?.classList.contains('push')?'push':'build';
    if(!el.querySelector(`.arc-icon[data-arc-icon="${name}"]`)){el.innerHTML=svg(name);el.dataset.arcIconized='1';}
  });
}

function iconizeConnections(root=document){
  root.querySelectorAll?.('.connection-card').forEach(card=>{
    const title=card.querySelector('h3')?.textContent?.trim().toLowerCase()||'';
    const icon=card.querySelector('.device-icon');
    if(!icon)return;
    let name='connections';
    if(title.includes('oura'))name='ring';
    else if(title.includes('apple'))name='heart';
    if(!icon.querySelector(`.arc-icon[data-arc-icon="${name}"]`)){icon.innerHTML=svg(name);icon.dataset.arcIconized='1';}
  });
  root.querySelectorAll?.('.nutrition-source-card').forEach(card=>{
    const key=card.dataset.nutritionSource;
    const icon=card.querySelector('.nutrition-source-icon');
    if(!icon)return;
    const name=key==='apple_health'?'heart':key==='manual_import'?'upload':'utensils';
    card.dataset.arcConnection='nutrition';
    if(!icon.querySelector(`.arc-icon[data-arc-icon="${name}"]`)){icon.innerHTML=svg(name);icon.dataset.arcIconized='1';}
  });
}

function iconizeFavorites(root=document){
  root.querySelectorAll?.('.favorite-history').forEach(btn=>{
    const favorited=btn.classList.contains('active');
    const name=favorited?'heart-filled':'heart';
    if(!btn.querySelector(`.arc-icon[data-arc-icon="${name}"]`))btn.innerHTML=svg(name);
    btn.setAttribute('aria-pressed',favorited?'true':'false');
  });
  const active=root.querySelector?.('#edgeFavoriteActive');
  if(active){
    const favorited=/favorited/i.test(active.textContent||'')||active.dataset.arcFavorited==='true';
    active.dataset.arcFavorited=favorited?'true':'false';
    const name=favorited?'heart-filled':'heart';
    if(!active.querySelector(`.arc-icon[data-arc-icon="${name}"]`))active.innerHTML=`${svg(name)}<span>${favorited?'Favorited':'Favorite'}</span>`;
  }
}

function iconizeHistoryMeta(root=document){
  root.querySelectorAll?.('.history-meta > span').forEach(span=>{
    if(span.querySelector('.arc-icon'))return;
    let text=span.textContent.trim(),name=null;
    if(text.startsWith('◷')){name='clock';text=text.slice(1).trim();}
    else if(text.startsWith('◇')){name='consistency';text=text.slice(1).trim();}
    else if(text.startsWith('✓')){name='check';text=text.slice(1).trim();}
    else if(text.startsWith('↗')){name='trend';text=text.slice(1).trim();}
    if(name){span.innerHTML=`${svg(name)}<span>${text}</span>`;span.dataset.arcIconized='1';}
  });
}

function actionIcon(name){return svg(name,'arc-icon-sm');}
function iconizeActions(root=document){
  root.querySelectorAll?.('button,a').forEach(el=>{
    if(el.closest('.nav-item')||el.classList.contains('favorite-history')||el.classList.contains('starting-point-action'))return;
    if(el.dataset.arcActionIconized==='1'&&el.querySelector('.arc-icon'))return;
    if(el.children.length>1)return;
    const raw=el.textContent?.trim()||'';
    let name=null,text=raw;
    if(/^\+\s*/.test(text)){name='plus';text=text.replace(/^\+\s*/,'');}
    else if(/↗$/.test(text)){name='external-link';text=text.replace(/\s*↗$/,'');}
    else if(/→$/.test(text)){name='arrow-right';text=text.replace(/\s*→$/,'');}
    else if(/↓$/.test(text)){name='chevron-down';text=text.replace(/\s*↓$/,'');}
    else if(/↑$/.test(text)){name='chevron-up';text=text.replace(/\s*↑$/,'');}
    if(!name)return;
    el.innerHTML=`<span>${text}</span>${actionIcon(name)}`;
    el.classList.add('arc-icon-action');
    el.dataset.arcActionIconized='1';
  });
  const logout=root.querySelector?.('#logoutButton');
  if(logout&&!logout.querySelector('.arc-icon')){
    logout.innerHTML=`${actionIcon('logout')}<span>Sign out</span>`;
    logout.classList.add('arc-icon-action');
    logout.dataset.arcActionIconized='1';
  }
}

function iconize(root=document){
  iconizeNav(root);iconizeMetrics(root);iconizeWorkoutTiers(root);iconizeConnections(root);iconizeFavorites(root);iconizeHistoryMeta(root);iconizeActions(root);
}

window.ArcIcons={svg,iconize};
iconize();
let queued=false;
const observer=new MutationObserver(mutations=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    for(const m of mutations){for(const node of m.addedNodes){if(node.nodeType===1)iconize(node);}}
    iconize(document);
  });
});
observer.observe(document.body,{childList:true,subtree:true});
window.addEventListener('pageshow',()=>iconize());

export { svg, iconize };
