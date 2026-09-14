const SPRITE='./assets/arc-icons.svg?v=ready13';
function detailIcon(name){return `<svg class="arc-icon" data-arc-detail-icon="${name}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="${SPRITE}#${name}"></use></svg>`;}

function setActionIcon(button,name){
  if(!button)return;
  const target=button.querySelector(':scope > b');
  if(target&&!target.querySelector(`.arc-icon[data-arc-detail-icon="${name}"]`))target.innerHTML=detailIcon(name);
}

function polishDetails(root=document){
  const actions=[
    ['#editStartingPoint','edit'],
    ['#resetBaseline','reset'],
    ['#arcInviteSomeone','share'],
    ['#exportArcData','export'],
    ['#showArcPrivacy','info'],
    ['#startDeleteArcAccount','trash']
  ];
  actions.forEach(([selector,name])=>root.querySelectorAll?.(selector).forEach(button=>setActionIcon(button,name)));
  root.querySelectorAll?.('.starting-point-close,.setup-edit-close').forEach(button=>{
    if(!button.querySelector('.arc-icon'))button.innerHTML=detailIcon('close');
  });
}

polishDetails();
let queued=false;
new MutationObserver(mutations=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    for(const mutation of mutations){mutation.addedNodes.forEach(node=>{if(node.nodeType===1)polishDetails(node);});}
    polishDetails(document);
  });
}).observe(document.body,{childList:true,subtree:true});
