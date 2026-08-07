
(function(){
  var allowed={nelson:true,nutrition:true,interaction:true,inject:true};
  if(new URLSearchParams(window.location.search).get('embed')==='1'){
    document.body.classList.add('vpmed-frame');
  }
  function openRequestedModule(){
    var id=window.location.hash.slice(1).toLowerCase();
    if(allowed[id] && typeof window.showPg==='function') window.showPg(id);
  }
  window.addEventListener('hashchange',openRequestedModule);
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){
      openRequestedModule();
      window.setTimeout(openRequestedModule,800);
    },{once:true});
  }else{
    openRequestedModule();
    window.setTimeout(openRequestedModule,800);
  }
})();
