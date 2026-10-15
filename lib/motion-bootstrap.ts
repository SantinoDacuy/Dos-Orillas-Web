// Classify motion before styles resolve; the film hero has no entrance overlay.
export const motionBootstrap = `(function(){try{
var r=document.documentElement;
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches||localStorage.getItem('dos-orillas:motion')==='reduce'||navigator.connection?.saveData;
var full=matchMedia('(min-width:1024px) and (pointer:fine)').matches&&sessionStorage.getItem('dos-orillas:motion-tier')!=='1';
r.dataset.motionTier=reduce?'0':full?'2':'1';
if(!reduce){r.classList.add('js-motion');setTimeout(function(){if(r.dataset.motionReady!=='true'){r.dataset.motionFailed='true';r.classList.remove('js-motion');r.dataset.motionTier='0';window.dispatchEvent(new Event('dos-orillas:motion-failed'))}},3000)}
}catch(e){}})();`;

