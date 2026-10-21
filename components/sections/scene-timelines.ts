import { loadGSAP } from '@/lib/gsap';
import type { MotionTier } from '@/hooks/useMotionTier';
import { buildDistance } from './distance-timeline';

export async function mountScene(root: HTMLElement, name: 'hero' | 'distance', tier: MotionTier, signal?: AbortSignal) {
  const { gsap, ScrollTrigger } = await loadGSAP();
  if (signal?.aborted || !root.isConnected) return () => {};
  let alive = true;
  let cleanupListeners = () => {};
  const context = gsap.context(() => {}, root);
  const cleanup = () => {
    alive = false;
    cleanupListeners();
    context.revert();
    delete root.dataset.sceneReady;
    if (window.__sceneRanges) delete window.__sceneRanges[name];
    window.__stCount = ScrollTrigger.getAll().length;
    window.dispatchEvent(new Event('dos-orillas:refresh'));
  };
  try {
    context.add(() => {
    const q = gsap.utils.selector(root);
    const debug = new URLSearchParams(location.search).has('debug');
    const range = (start: number, end: number) => {
      window.__sceneRanges ??= {};
      window.__sceneRanges[name] = { start, end };
      window.__stCount = ScrollTrigger.getAll().length;
    };
    const lite = tier === 1;
    const vertical = lite && innerWidth < 768;
    if (name === 'hero') {
      const stage = root.querySelector<HTMLElement>('.hero-stage');
      const left = root.querySelector<HTMLElement>('.hero-photo-left');
      const right = root.querySelector<HTMLElement>('.hero-photo-right');
      const dos = root.querySelector<HTMLElement>('.hero-title-dos');
      const orillas = root.querySelector<HTMLElement>('.hero-title-orillas');
      if (!stage || !left || !right || !dos || !orillas) return;
      const willChange = [left.style.willChange, right.style.willChange];
      cleanupListeners = () => { left.style.willChange = willChange[0] ?? ''; right.style.willChange = willChange[1] ?? ''; };
      const photoGap = () => (right.offsetLeft - (left.offsetLeft + left.offsetWidth)) / 2;
      const titleGap = () => Math.max(0, (orillas.offsetLeft - (dos.offsetLeft + dos.offsetWidth) - innerWidth * .015) / 2);
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: {
        trigger: root, start: 'top top', end: lite ? 'bottom bottom' : () => `+=${innerHeight * 2.5}`,
        pin: lite ? false : stage, pinSpacing: false, scrub: true, anticipatePin: 1, invalidateOnRefresh: true, markers: debug,
        onRefresh: st => range(st.start, st.end), onToggle: st => {
          [left, right].forEach(el => { el.style.willChange = st.isActive ? 'transform' : ''; });
        },
      } });
      tl.addLabel('separar', 0).to(q('.hero-scroll'), { autoAlpha: 0, duration: .08 }, 0);
      if (vertical) {
        // Narrow screens reserve a title band; wider lite scenes converge in X.
        const travel = () => innerHeight * .03;
        tl.to(left, { y: travel, duration: .55 }, 0)
          .to(right, { y: () => -travel(), duration: .55 }, .04);
      } else {
        tl.to(left, { x: photoGap, duration: .55 }, 0)
          .to(right, { x: () => -photoGap(), y: () => left.offsetTop - right.offsetTop, duration: .62 }, .03)
          .to(dos, { x: titleGap, duration: .55 }, 0)
          .to(orillas, { x: () => -titleGap(), duration: .55 }, 0);
      }
      tl.addLabel('acercar', .2).fromTo(q('.hero-horizon'), { scaleX: 0 }, { scaleX: 1, duration: .25 }, .2)
        .to(q('.hero-image-inner'), { scale: 1.08, duration: .7 }, .1)
        .to(q('.hero-camera'), { scale: lite ? 1 : 1.04, duration: .8 }, 0)
        .addLabel('entender', .35).fromTo(q('.hero-first'), { y: 18, opacity: 1 }, { y: 0, opacity: 1, duration: .22 }, .35)
        .addLabel('conectar', .55).fromTo(q('.hero-seam'), { scaleY: 0 }, { scaleY: 1, duration: .2 }, .55)
        .addLabel('hacer', .6).fromTo(q('.hero-second'), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .22 }, .6)
        .addLabel('cruzar', .82).to(q('.hero-title'), { yPercent: vertical ? 0 : -7, opacity: .65, duration: .18 }, .82);
      if (!lite) tl.to(q('.hero-actions'), { autoAlpha: .0, duration: .15 }, .3);
      tl.to({}, { duration: .01 }, .99);
      root.dataset.sceneReady = 'true';
      if (!lite) {
        const focus = () => tl.scrollTrigger && window.scrollTo({ top: tl.scrollTrigger.start, behavior: 'instant' });
        root.querySelectorAll<HTMLAnchorElement>('.hero-actions a').forEach(link => link.addEventListener('focus', focus));
        const previous = cleanupListeners;
        cleanupListeners = () => { previous(); root.querySelectorAll<HTMLAnchorElement>('.hero-actions a').forEach(link => link.removeEventListener('focus', focus)); };
        const layers = q('.hero-pointer-layer') as HTMLElement[];
        const setters = layers.map(layer => ({ x: gsap.quickTo(layer, 'x', { duration: .6, ease: 'power3.out' }), y: gsap.quickTo(layer, 'y', { duration: .6, ease: 'power3.out' }) }));
        const move = (event: PointerEvent) => setters.forEach((set, index) => { const sign = index === 0 ? 1 : -1; set.x((event.clientX / innerWidth - .5) * 12 * sign); set.y((event.clientY / innerHeight - .5) * 12 * sign); });
        const leave = () => setters.forEach(set => { set.x(0); set.y(0); });
        stage.addEventListener('pointermove', move, { passive: true }); stage.addEventListener('pointerleave', leave);
        const previousCleanup = cleanupListeners;
        cleanupListeners = () => { previousCleanup(); stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerleave', leave); };
      }
    } else {
      cleanupListeners = buildDistance({ gsap, ScrollTrigger }, { root, tier, narrow: innerWidth < 768, debug, range });
      root.dataset.sceneReady = 'true';
    }
    });
  } catch (error) {
    cleanup();
    throw error;
  }
  document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh(); }).catch(() => {});
  return cleanup;
}
