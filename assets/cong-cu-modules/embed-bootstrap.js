
(function(){
  var allowed={nelson:true,nutrition:true,interaction:true,inject:true};
  function requestedModule(){
    return window.location.hash.slice(1).toLowerCase();
  }
  function applyEmbedMode(){
    var id=requestedModule();
    var isAllowedEmbed=new URLSearchParams(window.location.search).get('embed')==='1' && allowed[id];
    document.body.classList.toggle('vpmed-embedded',!!isAllowedEmbed);
    document.body.classList.toggle('vpmed-frame',!!isAllowedEmbed);
    if(isAllowedEmbed) document.body.classList.add('authed');
  }
  function openRequestedModule(){
    var id=requestedModule();
    applyEmbedMode();
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
