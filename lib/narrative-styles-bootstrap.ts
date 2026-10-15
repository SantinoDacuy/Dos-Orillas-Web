/** Small URL-only external stylesheet: no full CSS string enters HTML/Flight. */
export const narrativeStylesBootstrap = `(function(){try{
var r=document.documentElement;
var sheet=document.getElementById('dos-orillas-narrative-css');
if(!sheet)return;
var navigation=performance.getEntriesByType('navigation')[0];
var eligible=location.pathname==='/'&&!location.hash&&navigation&&navigation.type==='navigate'&&r.dataset.motionTier==='1'&&r.classList.contains('js-motion')&&matchMedia('(min-height:701px)').matches;
var done=false;var observer=null;var safety=0;var idle=0;var fallbackTimer=0;var refreshFrame=0;var queued=false;
var pagePath=location.pathname;var pendingHash=navigation&&navigation.type!=='back_forward'?location.hash:'';var anchorFrame=0;var anchorCancelled=false;var anchorClosed=false;var anchorCleanup=0;var waitingForServices=false;
function cancelAnchor(event){if(event.type!=='keydown'||['Tab','Escape','ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)){pendingHash='';anchorCancelled=true}}
function rememberAnchor(event){if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;var a=event.target instanceof Element?event.target.closest('a[href]'):null;if(!a)return;var u=new URL(a.href,location.href);pendingHash=u.origin===location.origin&&u.pathname===pagePath&&u.search===location.search?u.hash:'';anchorCancelled=false}
function rememberHash(){if(!anchorCancelled)pendingHash=location.hash}
function removeAnchor(){anchorClosed=true;clearTimeout(anchorCleanup);cancelAnimationFrame(anchorFrame);anchorFrame=0;document.removeEventListener('click',rememberAnchor,true);window.removeEventListener('hashchange',rememberHash,true);window.removeEventListener('dos-orillas:services-ready',servicesReady);window.removeEventListener('pagehide',removeAnchor);['wheel','touchstart','pointerdown','keydown'].forEach(function(name){window.removeEventListener(name,cancelAnchor,true)})}
function repairAnchor(){if(anchorClosed)return;if(!pendingHash){removeAnchor();return}cancelAnimationFrame(anchorFrame);anchorFrame=requestAnimationFrame(function(){anchorFrame=requestAnimationFrame(function(){anchorFrame=0;var hash=pendingHash;if(!hash||location.pathname!==pagePath||location.hash!==hash){removeAnchor();return}var id;try{id=decodeURIComponent(hash.slice(1))}catch(e){removeAnchor();return}var target=document.getElementById(id);if(!target||!target.getClientRects().length){removeAnchor();return}var services=document.getElementById('soluciones');waitingForServices=r.dataset.motionTier!=='0'&&matchMedia('(max-width:1023px)').matches&&services&&services.dataset.servicesTransitions!=='true'&&Boolean(services.compareDocumentPosition(target)&Node.DOCUMENT_POSITION_FOLLOWING);if(window.__lenis)window.__lenis.scrollTo(target,{offset:-76,immediate:true});else target.scrollIntoView({behavior:'instant',block:'start'});if(waitingForServices){if(!anchorCleanup)anchorCleanup=setTimeout(removeAnchor,3000)}else removeAnchor()})})}
function settleAnchor(){if(anchorClosed)return;if(!pendingHash){removeAnchor();return}document.fonts.ready.then(repairAnchor).catch(repairAnchor)}
function servicesReady(){if(waitingForServices&&!anchorClosed)settleAnchor()}
document.addEventListener('click',rememberAnchor,true);window.addEventListener('hashchange',rememberHash,true);['wheel','touchstart','pointerdown','keydown'].forEach(function(name){window.addEventListener(name,cancelAnchor,{capture:true,passive:true})});
window.addEventListener('dos-orillas:services-ready',servicesReady);window.addEventListener('pagehide',removeAnchor);
var events=['wheel','touchstart','pointerdown','scroll','keydown','click','focusin','hashchange','resize','dos-orillas:motion-failed'];
function refresh(){if(refreshFrame)return;refreshFrame=requestAnimationFrame(function(){refreshFrame=0;window.dispatchEvent(new Event('dos-orillas:refresh'))})}
function loaded(){sheet.removeEventListener('load',loaded);r.dataset.narrativeCssLoaded='true';if(pendingHash)['manifiesto','soluciones','proceso'].forEach(function(id){var scene=document.getElementById(id);if(scene)scene.dataset.narrativeLayoutReady='true'});if(done)refresh();if(document.readyState==='complete')settleAnchor();else window.addEventListener('load',settleAnchor,{once:true})}
function pageshow(event){if(event.persisted)activate()}
function remove(){if(observer){observer.disconnect();observer=null}clearTimeout(safety);clearTimeout(fallbackTimer);if(idle&&typeof cancelIdleCallback==='function')cancelIdleCallback(idle);idle=0;events.forEach(function(name){window.removeEventListener(name,activate,true)});window.removeEventListener('pageshow',pageshow,true);document.removeEventListener('DOMContentLoaded',ready)}
function activate(event){if(done)return;if(event&&event.type==='scroll'&&scrollY===0)return;done=true;remove();sheet.media='all';r.dataset.narrativeCss='ready';if(sheet.sheet){r.dataset.narrativeCssLoaded='true';sheet.removeEventListener('load',loaded);refresh()}}
function ready(){if(location.hash||r.dataset.motionTier!=='1'||r.dataset.motionFailed==='true')activate()}
function afterPaint(){if(done||queued)return;queued=true;if(observer){observer.disconnect();observer=null}window.addEventListener('resize',activate,{capture:true,passive:true});if(typeof requestIdleCallback==='function')idle=requestIdleCallback(function(){idle=0;activate()},{timeout:750});else fallbackTimer=setTimeout(activate,0)}
if(sheet.sheet){r.dataset.narrativeCssLoaded='true';if(pendingHash){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loaded,{once:true});else loaded()}else removeAnchor()}else{sheet.addEventListener('load',loaded,{once:true});sheet.addEventListener('error',removeAnchor,{once:true})}
if(!eligible){activate();return}
r.dataset.narrativeCss='pending';
events.filter(function(name){return name!=='resize'}).forEach(function(name){window.addEventListener(name,activate,{capture:true,passive:true})});
window.addEventListener('pageshow',pageshow,true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
if(done)return;
try{if(typeof PerformanceObserver==='function'&&PerformanceObserver.supportedEntryTypes?.includes('paint')){observer=new PerformanceObserver(function(list){if(list.getEntries().some(function(entry){return entry.name==='first-contentful-paint'}))afterPaint()});observer.observe({type:'paint',buffered:true})}else activate()}catch(e){activate()}
if(!done)safety=setTimeout(activate,3000);
}catch(e){var fallback=document.getElementById('dos-orillas-narrative-css');if(fallback)fallback.media='all';document.documentElement.dataset.narrativeCss='ready'}})();`;
