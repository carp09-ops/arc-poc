const DETAIL_ICONS={
  edit:'<path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
  reset:'<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
  share:'<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>'
};
function detailIcon(name){return `<svg class="arc-icon" data-arc-detail-icon="${name}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${DETAIL_ICONS[name]}</svg>`;}
function polishDetails(root=document){
  const actions=[['#editStartingPoint','edit'],['#resetBaseline','reset'],['#arcInviteSomeone','share']];
  actions.forEach(([selector,name])=>{
    root.querySelectorAll?.(selector).forEach(button=>{
      const target=button.querySelector(':scope > b');
      if(target&&!target.querySelector('.arc-icon'))target.innerHTML=detailIcon(name);
    });
  });
  root.querySelectorAll?.('.starting-point-close,.setup-edit-close').forEach(button=>{
    if(!button.querySelector('.arc-icon'))button.innerHTML=detailIcon('close');
  });
}
polishDetails();
let queued=false;
new MutationObserver(mutations=>{
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;for(const mutation of mutations){mutation.addedNodes.forEach(node=>{if(node.nodeType===1)polishDetails(node);});}polishDetails(document);});
}).observe(document.body,{childList:true,subtree:true});
