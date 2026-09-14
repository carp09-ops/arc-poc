const ICONS={
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
  train:'<path d="M4 17 17 4"/><path d="M9 4h8v8"/><path d="M5 20h14"/>',
  body:'<path d="M12 3 20 12 12 21 4 12 12 3Z"/><path d="M8.5 12h7"/>',
  eclipse:'<circle cx="12" cy="12" r="7.5"/><path d="M12 4.5a7.5 7.5 0 0 0 0 15"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>',
  history:'<path d="M3.5 12a8.5 8.5 0 1 0 2.2-5.7"/><path d="M3 4.5v5h5"/><path d="M12 7v5l3 2"/>',
  connections:'<path d="M8 8.5 5.5 6A3 3 0 0 1 10 1.8l2.7 2.7"/><path d="m16 15.5 2.5 2.5A3 3 0 0 1 14 22.2l-2.7-2.7"/><path d="m8.5 15.5 7-7"/>',
  workout:'<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>',
  consistency:'<circle cx="12" cy="12" r="8"/><path d="M12 12V7"/><path d="M12 12l4 2"/>',
  scale:'<path d="M5 7h14l1.5 13h-17L5 7Z"/><path d="M8 7a4 4 0 0 1 8 0"/><path d="m12 7 2-2"/>',
  restore:'<path d="M19.5 4.5c-6.5.3-10.6 3-12.3 8.1-1 3-.2 5.4 2.1 7"/><path d="M6 18c2.7-4.4 6.1-7.4 10.4-9.2"/>',
  build:'<path d="M12 3 21 20H3L12 3Z"/><path d="M12 8v7"/><path d="M9.5 15h5"/>',
  push:'<path d="m13 2-7 11h6l-1 9 7-12h-6l1-8Z"/>',
  ring:'<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="4.5"/>',
  heart:'<path d="M20.8 4.6a5.3 5.3 0 0 0-7.5 0L12 5.9l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 21l8.8-8.9a5.3 5.3 0 0 0 0-7.5Z"/><path d="M7 12h2l1.2-2.3 2.1 5 1.3-2.7H17"/>',
  utensils:'<path d="M7 3v7M4.5 3v4.5A2.5 2.5 0 0 0 7 10v11M9.5 3v4.5A2.5 2.5 0 0 1 7 10"/><path d="M16 3v18M16 3c2 0 3.5 2.3 3.5 5.2S18 13 16 13"/>',
  upload:'<path d="M12 16V4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/><path d="M5 14v6h14v-6"/>',
  favorite:'<path d="M20.8 4.6a5.3 5.3 0 0 0-7.5 0L12 5.9l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 21l8.8-8.9a5.3 5.3 0 0 0 0-7.5Z"/>',
  clock:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
  check:'<circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.3 2.3 4.8-5"/>',
  trend:'<path d="M4 17 9 12l3 3 7-8"/><path d="M14 7h5v5"/>',
  arrowRight:'<path d="M5 12h14"/><path d="m14 7 5 5-5 5"/>',
  externalLink:'<path d="M14 5h5v5"/><path d="M19 5 11 13"/><path d="M18 13v6H5V6h6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  share:'<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/>',
  logout:'<path d="M10 4H5v16h5"/><path d="M14 8l4 4-4 4"/><path d="M9 12h9"/>',
  chevronDown:'<path d="m7 9 5 5 5-5"/>',
  chevronUp:'<path d="m7 15 5-5 5 5"/>'
};

function svg(name,extra=''){
  const key=({today:'home',train:'train',body:'body',arc:'eclipse',history:'history',connections:'connections'}[name]||name);
  const body=ICONS[key];
  if(!body)return '';
  return `<svg class="arc-icon ${extra}" data-arc-icon="${key}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
}

function iconizeNav(root=document){
  root.querySelectorAll?.('.nav-item[data-view]').forEach(btn=>{
    const first=btn.querySelector(':scope > span:first-child');
    if(!first)return;
    const expected=({today:'home',train:'train',body:'body',arc:'eclipse',history:'history',connections:'connections'}[btn.dataset.view]);
    if(first.querySelector(`.arc-icon[data-arc-icon="${expected}"]`))return;
    first.innerHTML=svg(btn.dataset.view);
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
    if(!btn.querySelector('.arc-icon'))btn.innerHTML=svg('favorite');
    btn.setAttribute('aria-pressed',btn.classList.contains('active')?'true':'false');
  });
  const active=root.querySelector?.('#edgeFavoriteActive');
  if(active&&!active.querySelector('.arc-icon')){
    const favorited=/favorited/i.test(active.textContent||'');
    active.dataset.arcFavorited=favorited?'true':'false';
    active.innerHTML=`${svg('favorite')}<span>${favorited?'Favorited':'Favorite'}</span>`;
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
    else if(/↗$/.test(text)){name='externalLink';text=text.replace(/\s*↗$/,'');}
    else if(/→$/.test(text)){name='arrowRight';text=text.replace(/\s*→$/,'');}
    else if(/↓$/.test(text)){name='chevronDown';text=text.replace(/\s*↓$/,'');}
    else if(/↑$/.test(text)){name='chevronUp';text=text.replace(/\s*↑$/,'');}
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

iconize();
let queued=false;
const observer=new MutationObserver(mutations=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    for(const m of mutations){
      for(const node of m.addedNodes){if(node.nodeType===1)iconize(node);}
      if(m.type==='characterData'&&m.target.parentElement)iconize(m.target.parentElement);
    }
    iconize(document);
  });
});
observer.observe(document.body,{childList:true,subtree:true,characterData:true});
window.addEventListener('pageshow',()=>iconize());
