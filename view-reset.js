/* Arc mobile view reset — keep every tab change anchored below iOS chrome. */
(function(){
  const reset=()=>{
    const run=()=>window.scrollTo({top:0,left:0,behavior:'auto'});
    run();
    requestAnimationFrame(run);
    setTimeout(run,90);
  };
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-view],[data-view-target]')) reset();
  },true);
  window.addEventListener('pageshow',event=>{
    if(event.persisted) reset();
  });
})();
